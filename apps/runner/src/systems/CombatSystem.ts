/**
 * Combat system: deterministic hitboxes, hurtboxes, damage, parry, dodge, and combo tracking.
 */

import { aabb } from '@badger/platformer-core';
import { type DamagePacket, type DamageType, resolveDamagePacket } from './DamageModel';
import type { ActionMap } from './InputSystem';
import {
	type MeleeAttackResult,
	MeleeComboSystem,
	type MeleeInput,
	createMeleeComboState,
} from './MeleeComboSystem';
import type { Entity } from './PhysicsSystem';
import {
	type StatusEffect,
	type StatusEvent,
	applyStatusEffect,
	stepStatusEffects,
} from './StatusEffectSystem';

export interface CombatEntity extends Entity {
	id?: string;
	hp: number;
	maxHp: number;
	invuln: number;
	stun: number;
	armor?: number;
	poise?: number;
	resistances?: Partial<Record<DamageType, number>>;
	vulnerabilities?: Partial<Record<DamageType, number>>;
	guardMultiplier?: number;
	faction?: 'player' | 'enemy' | 'neutral';

	parryWindow?: number;
	parryCooldown?: number;
	dodgeCooldown?: number;
	dodgeActive?: number;
	isDodging?: boolean;
	comboCount?: number;
	comboTimer?: number;
	lastHitTime?: number;
	meleeStyle?: number;
	unlockedSkills?: string[];
	itemSetEffects?: Record<string, number | string | boolean>;
	statusEffects?: StatusEffect[];

	rookMarked?: boolean;
	bossPhaseLabel?: string;
	bossPhaseMechanic?: string;
	bossPhaseIndex?: number;
	bossId?: string;
	bossName?: string;
	bossArgument?: string;
	isBossPlaceholder?: boolean;
	usesPatternController?: boolean;
	bossSpriteSheetId?: string;
	bossAction?: string;
	bossAnimation?: string;
	bossTelegraph?: number;
	aiState?: string;
	attackTelegraph?: number;
	procgenFamily?: string;
	procgenRole?: string;
	procgenAffixes?: string[];
}

export interface HitboxSet {
	attack: { x: number; y: number; w: number; h: number } | null;
	hurt: { x: number; y: number; w: number; h: number };
}

export type CombatEventKind =
	| 'hit'
	| 'kill'
	| 'parry'
	| 'dodge'
	| 'damage'
	| 'block'
	| 'poise-break'
	| 'combo-drop';

export interface CombatEvent {
	kind: CombatEventKind;
	source?: 'player' | 'enemy';
	status?: StatusEvent;
	targetId?: string;
	damage?: number;
	combo?: number;
	time?: number;
	moveId?: string;
}

export interface CombatEvents {
	onEvent?: (event: CombatEvent) => void;
	requestHitstop?: (duration: number) => void;
	requestScreenShake?: (intensity: number) => void;
	mitigateDamage?: (amount: number) => number;
}

export interface AttackSpec {
	id: string;
	source: 'player' | 'enemy';
	damage: number;
	damageType?: DamageType;
	damagePacket?: DamagePacket;
	stun: number;
	poiseDamage?: number;
	knockbackX: number;
	knockbackY?: number;
	hitbox: { x: number; y: number; w: number; h: number };
	parryable?: boolean;
	pierce?: number;
	comboGain?: number;
	statusOnHit?: StatusEffect[];
}

export interface AttackResolution {
	attackId: string;
	hits: CombatEvent[];
	kills: number;
	blocked: number;
}

export interface CombatStepOptions {
	time?: number;
	unlockedSkills?: readonly string[];
}

const DEFAULT_COMBAT_TIME = 0;
const BASE_COMBO_WINDOW = 1.2;
const BASE_MAX_COMBO = 9;

function effectNumber(entity: CombatEntity, key: string, fallback = 0): number {
	const value = entity.itemSetEffects?.[key];
	return typeof value === 'number' ? value : fallback;
}

function initialize(entity: CombatEntity): void {
	entity.invuln = Math.max(0, entity.invuln ?? 0);
	entity.stun = Math.max(0, entity.stun ?? 0);
	entity.armor = Math.max(0, entity.armor ?? 0);
	entity.poise = Math.max(0, entity.poise ?? 0);
	entity.parryWindow ??= 0;
	entity.parryCooldown ??= 0;
	entity.dodgeCooldown ??= 0;
	entity.dodgeActive ??= 0;
	entity.isDodging ??= false;
	entity.comboCount ??= 0;
	entity.comboTimer ??= 0;
	entity.lastHitTime ??= 0;
	entity.meleeStyle ??= 0;
	entity.unlockedSkills ??= [];
}

function decayTimers(entity: CombatEntity, dt: number): void {
	entity.invuln = Math.max(0, entity.invuln - dt);
	entity.stun = Math.max(0, entity.stun - dt);
	entity.parryWindow = Math.max(0, (entity.parryWindow ?? 0) - dt);
	entity.parryCooldown = Math.max(0, (entity.parryCooldown ?? 0) - dt);
	entity.dodgeCooldown = Math.max(0, (entity.dodgeCooldown ?? 0) - dt);
	entity.dodgeActive = Math.max(0, (entity.dodgeActive ?? 0) - dt);
	entity.comboTimer = Math.max(0, (entity.comboTimer ?? 0) - dt);
	entity.isDodging = (entity.dodgeActive ?? 0) > 0;
}

function statusTarget(entity: CombatEntity, fallbackId: string): CombatEntity & { id: string } {
	return { ...entity, id: entity.id ?? fallbackId };
}

function assignStatusTarget(
	entity: CombatEntity,
	next: ReturnType<typeof stepStatusEffects>['target']
): void {
	entity.hp = next.hp;
	entity.stun = next.stun;
	entity.invuln = next.invuln;
	entity.vx = next.vx;
	entity.vy = next.vy;
	entity.statusEffects = next.statusEffects;
}

function stepCombatStatuses(
	entity: CombatEntity,
	dt: number,
	events: CombatEvents | undefined,
	time: number
): void {
	if (!entity.statusEffects || entity.statusEffects.length === 0) return;
	const result = stepStatusEffects(statusTarget(entity, entity.faction ?? 'combatant'), dt);
	assignStatusTarget(entity, result.target);
	for (const status of result.events) {
		events?.onEvent?.({
			kind: status.kind === 'expired' ? 'block' : 'damage',
			source: entity.faction === 'player' ? 'player' : 'enemy',
			targetId: status.targetId,
			damage: status.amount,
			time,
			moveId: status.effectId,
			status,
		});
	}
}

export class CombatSystem {
	private lastAction: { kind: string; time: number; moveId?: string } | null = null;
	private readonly comboWindow = BASE_COMBO_WINDOW;
	private readonly maxCombo = BASE_MAX_COMBO;
	private readonly meleeCombos = new WeakMap<CombatEntity, MeleeComboSystem>();
	private clock = DEFAULT_COMBAT_TIME;

	step(
		player: CombatEntity,
		enemies: CombatEntity[],
		actionMap: ActionMap,
		dt: number,
		events?: CombatEvents,
		options: CombatStepOptions = {}
	): void {
		if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid combat dt: ${dt}`);
		this.clock = options.time ?? this.clock + dt;

		initialize(player);
		if (options.unlockedSkills) player.unlockedSkills = [...options.unlockedSkills];
		decayTimers(player, dt);
		stepCombatStatuses(player, dt, events, this.clock);

		const comboWasActive = (player.comboCount ?? 0) > 0;
		if ((player.comboTimer ?? 0) <= 0 && (player.comboCount ?? 0) > 0) {
			player.comboCount = 0;
			events?.onEvent?.({ kind: 'combo-drop', source: 'player', time: this.clock });
		} else if ((player.comboTimer ?? 0) <= 0) {
			player.comboCount = 0;
		}

		if (!comboWasActive && (player.comboTimer ?? 0) <= 0) player.comboCount = 0;

		const parryBonus = effectNumber(player, 'parryWindowBonus');
		if (actionMap.parryPressed && (player.parryCooldown ?? 0) <= 0) {
			player.parryWindow = 0.15 + parryBonus;
			player.parryCooldown = 0.4;
			events?.onEvent?.({ kind: 'parry', source: 'player', time: this.clock });
		}

		if (actionMap.dodgePressed && (player.dodgeCooldown ?? 0) <= 0 && player.onGround) {
			player.dodgeActive = 0.25 + effectNumber(player, 'beatGrace');
			player.dodgeCooldown = 0.5;
			player.invuln = Math.max(player.invuln, 0.3);
			player.isDodging = true;
			player.vx = player.dir * Math.max(430, Math.abs(player.vx));
			player.vy = Math.min(player.vy, -35);
			events?.onEvent?.({ kind: 'dodge', source: 'player', time: this.clock });
			events?.requestScreenShake?.(3);
		}

		for (const enemy of enemies) {
			initialize(enemy);
			decayTimers(enemy, dt);
			stepCombatStatuses(enemy, dt, events, this.clock);
			if (
				!enemy.usesPatternController &&
				player.invuln <= 0 &&
				enemy.stun <= 0 &&
				this.checkCollision(player, enemy)
			) {
				if ((player.parryWindow ?? 0) > 0) this.parry(player, enemy, events);
				else if (!player.isDodging) this.damage(player, 1, events, 'enemy');
			}
		}
	}

	getLastAction(): { kind: string; time: number; moveId?: string } | null {
		return this.lastAction ? { ...this.lastAction } : null;
	}

	getComboCount(entity?: CombatEntity): number {
		return entity?.comboCount ?? 0;
	}

	melee(
		player: CombatEntity,
		enemies: CombatEntity[],
		combo: string,
		events?: CombatEvents,
		time = this.clock
	): void {
		const input = this.comboStringToInput(combo);
		const result = this.meleeInput(player, enemies, input, events, time);
		if (!result && combo === 'katana') {
			this.resolveAttack(
				player,
				enemies,
				{
					id: 'legacy_katana',
					source: 'player',
					damage: 2,
					stun: 0.45,
					knockbackX: 150,
					hitbox: this.getMeleeHitbox(player, 'katana'),
					comboGain: 1,
				},
				events,
				time
			);
		}
	}

	meleeInput(
		player: CombatEntity,
		enemies: CombatEntity[],
		input: MeleeInput,
		events?: CombatEvents,
		time = this.clock
	): MeleeAttackResult | null {
		initialize(player);
		let combo = this.meleeCombos.get(player);
		if (!combo) {
			combo = new MeleeComboSystem(createMeleeComboState(player.unlockedSkills ?? []));
			this.meleeCombos.set(player, combo);
		}
		combo.setUnlockedSkills(player.unlockedSkills ?? []);
		const result = combo.attack(player, enemies, input, events);
		if (!result) return null;

		this.lastAction = { kind: 'melee', time, moveId: result.move.id };
		player.comboCount = Math.min(
			this.maxCombo,
			Math.max(player.comboCount ?? 0, result.state.chainDepth)
		);
		player.comboTimer = Math.max(player.comboTimer ?? 0, result.move.comboWindow);
		player.lastHitTime = time;
		player.meleeStyle = result.state.style + effectNumber(player, 'meleeStyleBonus');
		return result;
	}

	resolveAttack(
		attacker: CombatEntity,
		targets: CombatEntity[],
		attack: AttackSpec,
		events?: CombatEvents,
		time = this.clock
	): AttackResolution {
		initialize(attacker);
		this.lastAction = { kind: 'attack', time, moveId: attack.id };
		const hits: CombatEvent[] = [];
		let kills = 0;
		let blocked = 0;
		let pierceLeft = attack.pierce ?? Number.POSITIVE_INFINITY;

		for (const target of targets) {
			if (pierceLeft <= 0) break;
			initialize(target);
			if (target.hp <= 0 || target.invuln > 0 || target.isDodging || !aabb(attack.hitbox, target))
				continue;

			if (attack.parryable !== false && (target.parryWindow ?? 0) > 0) {
				blocked += 1;
				target.parryWindow = 0;
				attacker.stun = Math.max(attacker.stun, 0.35);
				const event: CombatEvent = {
					kind: 'parry',
					source: target.faction === 'player' ? 'player' : 'enemy',
					time,
					moveId: attack.id,
				};
				hits.push(event);
				events?.onEvent?.(event);
				events?.requestHitstop?.(0.1);
				continue;
			}

			const damageResolution = resolveDamagePacket(
				attack.damagePacket ?? { amount: attack.damage, type: attack.damageType ?? 'blunt' },
				{
					armor: Math.max(0, target.armor ?? 0),
					resistances: target.resistances,
					vulnerabilities: target.vulnerabilities,
					guardMultiplier: target.guardMultiplier,
				}
			);
			const damage = damageResolution.final;
			if (damage <= 0) {
				blocked += 1;
				const event: CombatEvent = {
					kind: 'block',
					source: attack.source,
					damage: 0,
					time,
					moveId: attack.id,
				};
				hits.push(event);
				events?.onEvent?.(event);
				continue;
			}

			target.hp -= damage;
			if (attack.source === 'enemy') target.invuln = Math.max(target.invuln, 0.5);
			target.stun = Math.max(target.stun, attack.stun);
			target.vx += attacker.dir * attack.knockbackX;
			target.vy += attack.knockbackY ?? 0;

			const poiseDamage = attack.poiseDamage ?? damage;
			if ((target.poise ?? 0) > 0) {
				target.poise = Math.max(0, (target.poise ?? 0) - poiseDamage);
				if (target.poise === 0) {
					target.stun = Math.max(target.stun, attack.stun + 0.25);
					events?.onEvent?.({
						kind: 'poise-break',
						source: attack.source,
						damage: poiseDamage,
						time,
						moveId: attack.id,
					});
				}
			}

			if (attack.statusOnHit) {
				for (const status of attack.statusOnHit) {
					const applied = applyStatusEffect(statusTarget(target, `target-${hits.length}`), {
						...status,
						sourceId: attack.id,
					});
					assignStatusTarget(target, applied.target);
					for (const statusEvent of applied.events) {
						events?.onEvent?.({
							kind: 'damage',
							source: attack.source,
							targetId: statusEvent.targetId,
							time,
							moveId: attack.id,
							status: statusEvent,
						});
					}
				}
			}

			if (attack.source === 'player') {
				attacker.comboCount = Math.min(
					this.maxCombo,
					(attacker.comboCount ?? 0) + (attack.comboGain ?? 1)
				);
				attacker.comboTimer = this.comboWindow;
				attacker.lastHitTime = time;
			}

			const kind = target.hp <= 0 ? 'kill' : 'hit';
			if (kind === 'kill') kills += 1;
			const event: CombatEvent = {
				kind,
				source: attack.source,
				targetId: target.id,
				damage,
				combo: attacker.comboCount,
				time,
				moveId: attack.id,
			};
			hits.push(event);
			events?.onEvent?.(event);
			events?.requestHitstop?.(Math.min(0.16, 0.035 + (attacker.comboCount ?? 0) * 0.012));
			events?.requestScreenShake?.(Math.min(12, 4 + (attacker.comboCount ?? 0)));
			pierceLeft -= 1;
		}

		return { attackId: attack.id, hits, kills, blocked };
	}

	canHit(entity: CombatEntity): boolean {
		initialize(entity);
		return entity.invuln <= 0 && !entity.isDodging && entity.hp > 0;
	}

	getComboMultiplier(comboCount: number): number {
		return 1 + Math.max(0, comboCount) * 0.1;
	}

	private parry(player: CombatEntity, enemy: CombatEntity, events?: CombatEvents): void {
		const damage = 1 + effectNumber(player, 'parryDamageBonus');
		enemy.hp -= damage;
		enemy.stun = Math.max(enemy.stun, 0.8);
		enemy.vx = player.dir * 250;
		player.parryWindow = 0;
		events?.requestHitstop?.(0.12);
		events?.requestScreenShake?.(8);
		events?.onEvent?.({
			kind: enemy.hp <= 0 ? 'kill' : 'hit',
			source: 'player',
			damage,
			time: this.clock,
			moveId: 'parry',
		});
	}

	private comboStringToInput(combo: string): MeleeInput {
		switch (combo) {
			case 'heavy':
			case 'katana':
				return 'heavy';
			case 'launcher':
				return 'launcher';
			case 'air':
				return 'air';
			case 'finisher':
				return 'finisher';
			default:
				return 'light';
		}
	}

	private getMeleeHitbox(
		player: Entity,
		combo: string
	): { x: number; y: number; w: number; h: number } {
		const w = combo === 'katana' ? 50 : 42;
		const h = combo === 'katana' ? 32 : 28;
		return {
			x: player.x + (player.dir > 0 ? player.w : -w),
			y: player.y + 8,
			w,
			h,
		};
	}

	private checkCollision(a: Entity, b: Entity): boolean {
		return aabb(a, b);
	}

	private damage(
		entity: CombatEntity,
		amount: number,
		events?: CombatEvents,
		source: 'player' | 'enemy' = 'enemy'
	): void {
		const mitigated = amount * (1 - effectNumber(entity, 'damageMitigation'));
		const finalAmount = events?.mitigateDamage?.(mitigated) ?? mitigated;
		if (finalAmount <= 0) {
			entity.invuln = Math.max(entity.invuln, 0.35);
			return;
		}
		entity.hp -= finalAmount;
		entity.invuln = 1.1;
		events?.onEvent?.({ kind: 'damage', source, damage: finalAmount, time: this.clock });
		events?.requestScreenShake?.(6);
		events?.requestHitstop?.(0.06);
	}
}

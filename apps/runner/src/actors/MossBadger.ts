/**
 * Moss Badger - player actor
 * Composes all player capabilities into a single entity
 */

import type { AnimationState } from '../renderer/AnimationState';
import type { CombatEntity, CombatEvents, CombatSystem } from '../systems/CombatSystem';
import type { ActionMap } from '../systems/InputSystem';
import type { Entity } from '../systems/PhysicsSystem';

function effectNumber(player: Player, key: string, fallback = 0): number {
	const value = player.itemSetEffects?.[key];
	return typeof value === 'number' ? value : fallback;
}

function effectBool(player: Player, key: string): boolean {
	return player.itemSetEffects?.[key] === true;
}

export interface Player extends Entity, CombatEntity {
	fuel: number;
	maxFuel: number;
	stims: number;
	hasRailgun: boolean;
	hasRocket: boolean;
	hasKatana: boolean;
	meleeTimer: number;
	shootCd: number;
	boostCd: number;
	focus: number;
	combo: string;
	parryWindow?: number;
	parryCooldown?: number;
	dodgeCooldown?: number;
	dodgeActive?: number;
	isDodging?: boolean;
	comboCount?: number;
	comboTimer?: number;
	animState?: AnimationState;
	hudToast?: string;
	hudToastTimer?: number;
	objectiveHint?: string;
	loadoutHint?: string;
	checkpointLabel?: string;
	contextHint?: string;
	damageFlash?: number;
	healFlash?: number;
	railgunFlash?: number;
	railgunAnimationTimer?: number;
	railgunHitCount?: number;
	skillTrackRanks?: Record<'clawline' | 'railgun' | 'rocket' | 'hacking', number>;
	gearIconSlots?: Array<{
		itemId: string;
		label: string;
		sheetId: string;
		animation: string;
	}>;
	hackMistakeShieldAvailable?: boolean;
}

export function createPlayer(): Player {
	return {
		x: 60,
		y: 420,
		w: 34,
		h: 46,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: false,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 5,
		maxHp: 5,
		invuln: 0,
		stun: 0,
		fuel: 0,
		maxFuel: 0,
		stims: 0,
		hasRailgun: false,
		hasRocket: false,
		hasKatana: false,
		meleeTimer: 0,
		shootCd: 0,
		boostCd: 0,
		focus: 0,
		combo: 'claws',
		parryWindow: 0,
		parryCooldown: 0,
		dodgeCooldown: 0,
		dodgeActive: 0,
		isDodging: false,
		comboCount: 0,
		comboTimer: 0,
		railgunFlash: 0,
		railgunAnimationTimer: 0,
		railgunHitCount: 0,
	};
}

export function processMossInput(
	player: Player,
	actionMap: ActionMap,
	dt: number,
	combatSystem: Pick<CombatSystem, 'melee' | 'resolveAttack'>,
	enemies: CombatEntity[] = [],
	combatEvents?: CombatEvents
): void {
	const canAct = player.stun <= 0;

	// Melee
	if (canAct && actionMap.meleePressed && player.meleeTimer <= 0) {
		player.meleeTimer = player.hasKatana ? 0.28 : 0.18;
		player.combo = player.hasKatana ? 'katana' : 'claws';
		combatSystem.melee(player, enemies, player.combo, combatEvents);
	}

	// Shoot
	if (canAct && actionMap.shootPressed && player.hasRailgun && player.shootCd <= 0) {
		const damage = 1.6 + effectNumber(player, 'railDamageBonus');
		const pierce = 4 + Math.max(0, Math.floor(effectNumber(player, 'railPierceBonus')));
		const cooldown = Math.max(0.32, 0.72 - effectNumber(player, 'railCooldownReduction'));
		const recoilReduction = Math.min(
			0.85,
			Math.max(0, effectNumber(player, 'railRecoilReduction'))
		);
		player.shootCd = cooldown;
		player.railgunFlash = 0.14;
		player.railgunAnimationTimer = 0.34;
		player.vx -= player.dir * 38 * (1 - recoilReduction);
		const muzzleX = player.dir > 0 ? player.x + player.w : player.x - 560;
		const empStatus = effectBool(player, 'empOnChargedShot')
			? [
					{
						id: 'railgun-public-emp',
						kind: 'emp' as const,
						sourceId: 'moss:railgun-pierce',
						duration: 1.1,
						remaining: 1.1,
						stacks: 1,
						maxStacks: 2,
						tickInterval: 0.35,
						tickTimer: 0.35,
						magnitude: 0.22,
					},
				]
			: undefined;
		const resolution = combatSystem.resolveAttack(
			player,
			enemies,
			{
				id: 'moss:railgun-pierce',
				source: 'player',
				damage,
				damageType: 'pierce',
				damagePacket: { amount: damage, type: 'pierce', armorPierce: 0.7 },
				stun: 0.34,
				poiseDamage: 1.4,
				knockbackX: 190,
				knockbackY: -55,
				hitbox: {
					x: muzzleX,
					y: player.y + 14,
					w: 560,
					h: 18,
				},
				parryable: false,
				pierce,
				comboGain: 1,
				statusOnHit: empStatus,
			},
			combatEvents
		);
		player.railgunHitCount = resolution.hits.length;
	}

	// Context-sensitive item use: grounded recovery takes priority, airborne E remains a boost.
	if (canAct && actionMap.itemPressed) {
		if (player.stims > 0 && player.hp < player.maxHp && player.onGround) {
			player.stims--;
			player.hp = Math.min(player.maxHp, player.hp + 2);
			player.focus = 1.5;
			player.healFlash = 0.42;
			player.hudToast = 'Stim applied // focus window';
			player.hudToastTimer = 1.5;
		} else if (player.hasRocket && player.fuel > 0 && player.boostCd <= 0) {
			player.fuel--;
			player.boostCd = Math.max(0.16, 0.35 - effectNumber(player, 'boostCooldownReduction'));
			player.vy = Math.min(player.vy, -420);
			player.vx += player.dir * 45;
			player.onGround = false;
		}
	}

	// Decay timers
	player.meleeTimer = Math.max(0, player.meleeTimer - dt);
	player.shootCd = Math.max(0, player.shootCd - dt);
	player.boostCd = Math.max(0, player.boostCd - dt);
	player.focus = Math.max(0, player.focus - dt);
	player.railgunFlash = Math.max(0, (player.railgunFlash ?? 0) - dt);
	player.railgunAnimationTimer = Math.max(0, (player.railgunAnimationTimer ?? 0) - dt);

	// Recharge fuel on ground
	if (player.onGround && player.hasRocket) {
		player.fuel = Math.min(
			player.maxFuel,
			player.fuel + dt * (1.75 + effectNumber(player, 'fuelRechargeBonus'))
		);
	}
}

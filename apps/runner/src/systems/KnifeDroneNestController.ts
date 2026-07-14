import type { Player } from '../actors/MossBadger';
import type { BossPhaseRuntimeState } from './BossPhaseSystem';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type KnifeDroneNestAction =
	| 'intro'
	| 'phase-transition'
	| 'hover'
	| 'windup'
	| 'knife-lunge'
	| 'blade-fan'
	| 'recover'
	| 'stunned'
	| 'defeated';

export interface KnifeDroneNestSnapshot {
	action: KnifeDroneNestAction;
	actionRemaining: number;
	phaseIndex: number;
	attackCount: number;
	telegraph: number;
	animation: string;
}

export type KnifeDroneNestEvent =
	| { kind: 'boss-telegraph'; attack: 'knife-lunge' | 'blade-fan' }
	| { kind: 'boss-attack'; attack: 'knife-lunge' | 'blade-fan' }
	| { kind: 'boss-phase-transition'; phaseIndex: number }
	| { kind: 'boss-defeated' };

const ARENA_LEFT = 1510;
const ARENA_RIGHT = 1910;

export class KnifeDroneNestController {
	private action: KnifeDroneNestAction = 'intro';
	private actionRemaining = 0.75;
	private pendingAttack: 'knife-lunge' | 'blade-fan' = 'knife-lunge';
	private attackCount = 0;
	private hitApplied = false;
	private lastPhaseIndex = 0;
	private defeatEmitted = false;

	step(
		boss: CombatEntity | undefined,
		player: Player,
		phase: BossPhaseRuntimeState | null,
		dt: number,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): KnifeDroneNestEvent[] {
		if (!boss) return [];
		const events: KnifeDroneNestEvent[] = [];
		const safeDt = Math.max(0, dt);
		const phaseIndex = phase?.phaseIndex ?? (boss.hp <= boss.maxHp / 2 ? 1 : 0);

		boss.usesPatternController = true;
		boss.bossSpriteSheetId = 'boss_boss_knife_drone_nest';

		if (boss.hp <= 0) {
			this.action = 'defeated';
			this.actionRemaining = 0;
			boss.vx = 0;
			this.applyPresentation(boss);
			if (!this.defeatEmitted) {
				this.defeatEmitted = true;
				events.push({ kind: 'boss-defeated' });
			}
			return events;
		}

		if (phaseIndex !== this.lastPhaseIndex) {
			this.lastPhaseIndex = phaseIndex;
			this.action = 'phase-transition';
			this.actionRemaining = 0.68;
			this.hitApplied = false;
			events.push({ kind: 'boss-phase-transition', phaseIndex });
		}

		if (boss.stun > 0 && this.action !== 'phase-transition') {
			this.action = 'stunned';
			this.actionRemaining = boss.stun;
			boss.vx = 0;
			this.applyPresentation(boss);
			return events;
		}

		this.actionRemaining = Math.max(0, this.actionRemaining - safeDt);
		switch (this.action) {
			case 'intro':
			case 'phase-transition':
				boss.vx = 0;
				if (this.actionRemaining === 0) this.enterHover(phaseIndex);
				break;
			case 'stunned':
				boss.vx = 0;
				if (boss.stun <= 0 || this.actionRemaining === 0) this.enterRecover();
				break;
			case 'hover':
				this.stepHover(boss, player, phaseIndex, safeDt, events);
				break;
			case 'windup':
				boss.vx = 0;
				boss.dir = player.x < boss.x ? -1 : 1;
				if (this.actionRemaining === 0) {
					this.action = this.pendingAttack;
					this.actionRemaining = this.pendingAttack === 'knife-lunge' ? 0.46 : 0.3;
					this.hitApplied = false;
					events.push({ kind: 'boss-attack', attack: this.pendingAttack });
				}
				break;
			case 'knife-lunge':
				boss.vx = boss.dir * (phaseIndex > 0 ? 470 : 390);
				boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * safeDt));
				this.tryAttack(boss, player, 'knife-lunge', combat, combatEvents);
				if (this.actionRemaining === 0 || boss.x <= ARENA_LEFT || boss.x >= ARENA_RIGHT - boss.w) {
					this.enterRecover();
				}
				break;
			case 'blade-fan':
				boss.vx = 0;
				this.tryAttack(boss, player, 'blade-fan', combat, combatEvents);
				if (this.actionRemaining === 0) this.enterRecover();
				break;
			case 'recover':
				boss.vx *= 0.76;
				if (this.actionRemaining === 0) this.enterHover(phaseIndex);
				break;
			case 'defeated':
				break;
		}

		this.applyPresentation(boss);
		return events;
	}

	getSnapshot(): KnifeDroneNestSnapshot {
		return {
			action: this.action,
			actionRemaining: this.actionRemaining,
			phaseIndex: this.lastPhaseIndex,
			attackCount: this.attackCount,
			telegraph: this.action === 'windup' ? 1 - Math.min(1, this.actionRemaining / 0.72) : 0,
			animation: this.animationForAction(),
		};
	}

	private stepHover(
		boss: CombatEntity,
		player: Player,
		phaseIndex: number,
		dt: number,
		events: KnifeDroneNestEvent[]
	): void {
		boss.dir = player.x < boss.x ? -1 : 1;
		boss.vx = boss.dir * (phaseIndex > 0 ? 86 : 62);
		boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * dt));
		if (this.actionRemaining > 0) return;
		this.pendingAttack = phaseIndex > 0 && this.attackCount % 2 === 1 ? 'blade-fan' : 'knife-lunge';
		this.action = 'windup';
		this.actionRemaining = this.pendingAttack === 'knife-lunge' ? 0.62 : 0.74;
		this.attackCount += 1;
		events.push({ kind: 'boss-telegraph', attack: this.pendingAttack });
	}

	private tryAttack(
		boss: CombatEntity,
		player: Player,
		attack: 'knife-lunge' | 'blade-fan',
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): void {
		if (this.hitApplied) return;
		const hitbox =
			attack === 'knife-lunge'
				? { x: boss.x - 8, y: boss.y + 4, w: boss.w + 16, h: boss.h - 6 }
				: {
						x: boss.x - 170,
						y: boss.y - 18,
						w: boss.w + 340,
						h: boss.h + 36,
					};
		const result = combat.resolveAttack(
			boss,
			[player],
			{
				id: `drainmarket:nest-${attack}`,
				source: 'enemy',
				damage: attack === 'knife-lunge' ? 1.15 : 1,
				damageType: 'pierce',
				stun: attack === 'knife-lunge' ? 0.24 : 0.34,
				knockbackX: attack === 'knife-lunge' ? 230 : 175,
				knockbackY: attack === 'knife-lunge' ? -100 : -155,
				hitbox,
				parryable: true,
			},
			combatEvents
		);
		this.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private enterHover(phaseIndex: number): void {
		this.action = 'hover';
		this.actionRemaining = phaseIndex > 0 ? 0.72 : 1.05;
	}

	private enterRecover(): void {
		this.action = 'recover';
		this.actionRemaining = 0.5;
		this.hitApplied = false;
	}

	private applyPresentation(boss: CombatEntity): void {
		boss.bossAction = this.action;
		boss.bossAnimation = this.animationForAction();
		boss.bossTelegraph =
			this.action === 'windup' ? 1 - Math.min(1, this.actionRemaining / 0.74) : 0;
	}

	private animationForAction(): string {
		switch (this.action) {
			case 'intro':
				return 'phase_intro';
			case 'phase-transition':
				return 'phase_transition';
			case 'hover':
				return 'patrol_or_move';
			case 'windup':
				return 'windup';
			case 'knife-lunge':
				return 'attack';
			case 'blade-fan':
				return 'signature_attack';
			case 'recover':
				return 'idle';
			case 'stunned':
				return 'stun_or_parried';
			case 'defeated':
				return 'defeat';
		}
	}
}

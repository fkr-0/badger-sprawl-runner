import type { Player } from '../actors/MossBadger';
import type { BossPhaseRuntimeState } from './BossPhaseSystem';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type CaptainGrinAction =
	| 'intro'
	| 'phase-transition'
	| 'patrol'
	| 'windup'
	| 'charge'
	| 'receipt-burst'
	| 'recover'
	| 'stunned'
	| 'defeated';

export interface CaptainGrinSnapshot {
	action: CaptainGrinAction;
	actionRemaining: number;
	phaseIndex: number;
	attackCount: number;
	telegraph: number;
	animation: string;
}

export type CaptainGrinEvent =
	| { kind: 'boss-telegraph'; attack: 'charge' | 'receipt-burst' }
	| { kind: 'boss-attack'; attack: 'charge' | 'receipt-burst' }
	| { kind: 'boss-phase-transition'; phaseIndex: number }
	| { kind: 'boss-defeated' };

const ARENA_LEFT = 1320;
const ARENA_RIGHT = 1740;

export class CaptainGrinController {
	private action: CaptainGrinAction = 'intro';
	private actionRemaining = 0.8;
	private pendingAttack: 'charge' | 'receipt-burst' = 'charge';
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
	): CaptainGrinEvent[] {
		if (!boss) return [];
		const events: CaptainGrinEvent[] = [];
		const safeDt = Math.max(0, dt);
		const phaseIndex = phase?.phaseIndex ?? 0;

		boss.usesPatternController = true;
		boss.bossSpriteSheetId = 'boss_boss_captain_grin_tollmech';

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
			this.actionRemaining = 0.7;
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
				if (this.actionRemaining === 0) this.enterPatrol(phaseIndex);
				break;
			case 'stunned':
				boss.vx = 0;
				if (boss.stun <= 0 || this.actionRemaining === 0) this.enterRecover();
				break;
			case 'patrol':
				this.stepPatrol(boss, player, phaseIndex, safeDt, events);
				break;
			case 'windup':
				boss.vx = 0;
				boss.dir = player.x < boss.x ? -1 : 1;
				if (this.actionRemaining === 0) {
					this.action = this.pendingAttack;
					this.actionRemaining = this.pendingAttack === 'charge' ? 0.58 : 0.34;
					this.hitApplied = false;
					events.push({ kind: 'boss-attack', attack: this.pendingAttack });
				}
				break;
			case 'charge':
				boss.vx = boss.dir * (phaseIndex > 0 ? 390 : 320);
				boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * safeDt));
				this.tryAttack(boss, player, 'charge', combat, combatEvents);
				if (this.actionRemaining === 0 || boss.x <= ARENA_LEFT || boss.x >= ARENA_RIGHT - boss.w) {
					this.enterRecover();
				}
				break;
			case 'receipt-burst':
				boss.vx = 0;
				this.tryAttack(boss, player, 'receipt-burst', combat, combatEvents);
				if (this.actionRemaining === 0) this.enterRecover();
				break;
			case 'recover':
				boss.vx *= 0.8;
				if (this.actionRemaining === 0) this.enterPatrol(phaseIndex);
				break;
			case 'defeated':
				break;
		}

		this.applyPresentation(boss);
		return events;
	}

	getSnapshot(): CaptainGrinSnapshot {
		return {
			action: this.action,
			actionRemaining: this.actionRemaining,
			phaseIndex: this.lastPhaseIndex,
			attackCount: this.attackCount,
			telegraph:
				this.action === 'windup' ? Math.max(0, Math.min(1, this.actionRemaining / 0.5)) : 0,
			animation: this.animationForAction(),
		};
	}

	private stepPatrol(
		boss: CombatEntity,
		player: Player,
		phaseIndex: number,
		dt: number,
		events: CaptainGrinEvent[]
	): void {
		boss.dir = player.x < boss.x ? -1 : 1;
		boss.vx = boss.dir * (phaseIndex > 0 ? 105 : 78);
		boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * dt));
		if (this.actionRemaining > 0) return;
		this.pendingAttack = phaseIndex > 0 && this.attackCount % 2 === 1 ? 'receipt-burst' : 'charge';
		this.action = 'windup';
		this.actionRemaining = this.pendingAttack === 'charge' ? 0.48 : 0.62;
		this.attackCount += 1;
		events.push({ kind: 'boss-telegraph', attack: this.pendingAttack });
	}

	private tryAttack(
		boss: CombatEntity,
		player: Player,
		attack: 'charge' | 'receipt-burst',
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): void {
		if (this.hitApplied) return;
		const hitbox =
			attack === 'charge'
				? { x: boss.x - 6, y: boss.y + 6, w: boss.w + 12, h: boss.h - 8 }
				: {
						x: boss.dir > 0 ? boss.x + boss.w - 8 : boss.x - 142,
						y: boss.y + 8,
						w: 150,
						h: 50,
					};
		const result = combat.resolveAttack(
			boss,
			[player],
			{
				id: `captain-grin:${attack}`,
				source: 'enemy',
				damage: attack === 'charge' ? 1 : 1.25,
				damageType: attack === 'charge' ? 'blunt' : 'shock',
				stun: attack === 'charge' ? 0.2 : 0.35,
				knockbackX: attack === 'charge' ? 190 : 260,
				knockbackY: attack === 'charge' ? -80 : -130,
				hitbox,
				parryable: true,
			},
			combatEvents
		);
		this.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private enterPatrol(phaseIndex: number): void {
		this.action = 'patrol';
		this.actionRemaining = phaseIndex > 0 ? 0.85 : 1.15;
	}

	private enterRecover(): void {
		this.action = 'recover';
		this.actionRemaining = 0.42;
		this.hitApplied = false;
	}

	private applyPresentation(boss: CombatEntity): void {
		boss.bossAction = this.action;
		boss.bossAnimation = this.animationForAction();
		boss.bossTelegraph =
			this.action === 'windup' ? 1 - Math.min(1, this.actionRemaining / 0.62) : 0;
	}

	private animationForAction(): string {
		switch (this.action) {
			case 'intro':
				return 'phase_intro';
			case 'phase-transition':
				return 'phase_transition';
			case 'patrol':
				return 'patrol_or_move';
			case 'windup':
				return 'windup';
			case 'charge':
				return 'attack';
			case 'receipt-burst':
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

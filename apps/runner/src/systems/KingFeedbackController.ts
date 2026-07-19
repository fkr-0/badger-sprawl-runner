import type { Player } from '../actors/MossBadger';
import type { BossPhaseRuntimeState } from './BossPhaseSystem';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type KingFeedbackAction =
	| 'intro'
	| 'phase-transition'
	| 'command'
	| 'windup'
	| 'security-pulse'
	| 'emergency-crown'
	| 'chorus-test'
	| 'recover'
	| 'stunned'
	| 'defeated';

export type KingFeedbackAttack = 'security-pulse' | 'emergency-crown' | 'chorus-test';

export interface KingFeedbackSnapshot {
	action: KingFeedbackAction;
	actionRemaining: number;
	phaseIndex: number;
	attackCount: number;
	telegraph: number;
	pendingAttack: KingFeedbackAttack;
	animation: string;
}

export type KingFeedbackEvent =
	| { kind: 'boss-telegraph'; attack: KingFeedbackAttack }
	| { kind: 'boss-attack'; attack: KingFeedbackAttack }
	| { kind: 'boss-phase-transition'; phaseIndex: number }
	| { kind: 'boss-defeated' };

const ARENA_LEFT = 2290;
const ARENA_RIGHT = 2780;

export class KingFeedbackController {
	private action: KingFeedbackAction = 'intro';
	private actionRemaining = 0.95;
	private pendingAttack: KingFeedbackAttack = 'security-pulse';
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
	): KingFeedbackEvent[] {
		if (!boss) return [];
		const events: KingFeedbackEvent[] = [];
		const phaseIndex = phase?.phaseIndex ?? this.phaseForHealth(boss);
		const safeDt = Math.max(0, dt);
		boss.usesPatternController = true;
		boss.bossSpriteSheetId = 'boss_boss_king_feedback_ampthrone';

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
			this.actionRemaining = 0.82;
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
				if (this.actionRemaining === 0) this.enterCommand(phaseIndex);
				break;
			case 'stunned':
				boss.vx = 0;
				if (boss.stun <= 0 || this.actionRemaining === 0) this.enterRecover();
				break;
			case 'command':
				boss.dir = player.x < boss.x ? -1 : 1;
				boss.vx = boss.dir * (phaseIndex >= 2 ? 70 : 42);
				boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * safeDt));
				if (this.actionRemaining === 0) {
					this.pendingAttack = this.selectAttack(phaseIndex);
					this.action = 'windup';
					this.actionRemaining = this.windupDuration(this.pendingAttack, phaseIndex);
					this.attackCount += 1;
					events.push({ kind: 'boss-telegraph', attack: this.pendingAttack });
				}
				break;
			case 'windup':
				boss.vx = 0;
				boss.dir = player.x < boss.x ? -1 : 1;
				if (this.actionRemaining === 0) {
					this.action = this.pendingAttack;
					this.actionRemaining = this.attackDuration(this.pendingAttack);
					this.hitApplied = false;
					events.push({ kind: 'boss-attack', attack: this.pendingAttack });
				}
				break;
			case 'security-pulse':
			case 'emergency-crown':
			case 'chorus-test':
				boss.vx = 0;
				this.tryAttack(boss, player, this.action, combat, combatEvents);
				if (this.actionRemaining === 0) this.enterRecover();
				break;
			case 'recover':
				boss.vx *= 0.7;
				if (this.actionRemaining === 0) this.enterCommand(phaseIndex);
				break;
			case 'defeated':
				break;
		}
		this.applyPresentation(boss);
		return events;
	}

	getSnapshot(): KingFeedbackSnapshot {
		return {
			action: this.action,
			actionRemaining: this.actionRemaining,
			phaseIndex: this.lastPhaseIndex,
			attackCount: this.attackCount,
			telegraph: this.action === 'windup' ? 1 - Math.min(1, this.actionRemaining / 0.92) : 0,
			pendingAttack: this.pendingAttack,
			animation: this.animationForAction(),
		};
	}

	private phaseForHealth(boss: CombatEntity): number {
		const ratio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
		if (ratio <= 1 / 3) return 2;
		if (ratio <= 2 / 3) return 1;
		return 0;
	}

	private selectAttack(phaseIndex: number): KingFeedbackAttack {
		if (phaseIndex >= 2 && this.attackCount % 3 === 2) return 'chorus-test';
		if (phaseIndex >= 1 && this.attackCount % 2 === 1) return 'emergency-crown';
		return 'security-pulse';
	}

	private windupDuration(attack: KingFeedbackAttack, phaseIndex: number): number {
		const pressure = phaseIndex * 0.06;
		if (attack === 'security-pulse') return 0.74 - pressure;
		if (attack === 'emergency-crown') return 0.9 - pressure;
		return 0.82 - pressure;
	}

	private attackDuration(attack: KingFeedbackAttack): number {
		if (attack === 'security-pulse') return 0.28;
		if (attack === 'emergency-crown') return 0.32;
		return 0.48;
	}

	private tryAttack(
		boss: CombatEntity,
		player: Player,
		attack: KingFeedbackAttack,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): void {
		if (this.hitApplied) return;
		const hitbox =
			attack === 'security-pulse'
				? { x: boss.x - 150, y: boss.y - 60, w: boss.w + 300, h: boss.h + 120 }
				: attack === 'emergency-crown'
					? {
							x: boss.dir > 0 ? boss.x + boss.w : boss.x - 520,
							y: boss.y + 10,
							w: 520,
							h: 30,
						}
					: { x: ARENA_LEFT, y: boss.y - 20, w: ARENA_RIGHT - ARENA_LEFT, h: boss.h + 40 };
		const result = combat.resolveAttack(
			boss,
			[player],
			{
				id: `dub-colony:king-${attack}`,
				source: 'enemy',
				damage: attack === 'chorus-test' ? 1.35 : 1.1,
				damageType: 'shock',
				stun: attack === 'chorus-test' ? 0.36 : 0.24,
				knockbackX: attack === 'emergency-crown' ? 260 : 170,
				knockbackY: attack === 'security-pulse' ? -150 : -80,
				hitbox,
				parryable: attack !== 'emergency-crown',
			},
			combatEvents
		);
		this.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private enterCommand(phaseIndex: number): void {
		this.action = 'command';
		this.actionRemaining = phaseIndex >= 2 ? 0.55 : 0.84;
	}

	private enterRecover(): void {
		this.action = 'recover';
		this.actionRemaining = 0.46;
		this.hitApplied = false;
	}

	private applyPresentation(boss: CombatEntity): void {
		boss.bossAction = this.action;
		boss.bossAnimation = this.animationForAction();
		boss.bossTelegraph =
			this.action === 'windup' ? 1 - Math.min(1, this.actionRemaining / 0.92) : 0;
	}

	private animationForAction(): string {
		switch (this.action) {
			case 'intro':
				return 'phase_intro';
			case 'phase-transition':
				return 'phase_transition';
			case 'command':
				return 'patrol_or_move';
			case 'windup':
				return 'windup';
			case 'security-pulse':
				return 'attack';
			case 'emergency-crown':
			case 'chorus-test':
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

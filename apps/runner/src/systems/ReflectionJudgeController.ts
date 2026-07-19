import type { Player } from '../actors/MossBadger';
import type { BossPhaseRuntimeState } from './BossPhaseSystem';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type ReflectionJudgeAction =
	| 'intro'
	| 'phase-transition'
	| 'stalk'
	| 'windup'
	| 'contract-gavel'
	| 'mirror-verdict'
	| 'false-self-dash'
	| 'recover'
	| 'stunned'
	| 'defeated';

export type ReflectionJudgeAttack = 'contract-gavel' | 'mirror-verdict' | 'false-self-dash';

export interface ReflectionJudgeSnapshot {
	action: ReflectionJudgeAction;
	actionRemaining: number;
	phaseIndex: number;
	attackCount: number;
	telegraph: number;
	pendingAttack: ReflectionJudgeAttack;
	animation: string;
}

export type ReflectionJudgeEvent =
	| { kind: 'boss-telegraph'; attack: ReflectionJudgeAttack }
	| { kind: 'boss-attack'; attack: ReflectionJudgeAttack }
	| { kind: 'boss-phase-transition'; phaseIndex: number }
	| { kind: 'boss-defeated' };

const ARENA_LEFT = 2070;
const ARENA_RIGHT = 2520;

export class ReflectionJudgeController {
	private action: ReflectionJudgeAction = 'intro';
	private actionRemaining = 0.9;
	private pendingAttack: ReflectionJudgeAttack = 'contract-gavel';
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
	): ReflectionJudgeEvent[] {
		if (!boss) return [];
		const events: ReflectionJudgeEvent[] = [];
		const phaseIndex = phase?.phaseIndex ?? this.phaseForHealth(boss);
		const safeDt = Math.max(0, dt);
		boss.usesPatternController = true;
		boss.bossSpriteSheetId = 'boss_boss_reflection_judge_court';

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
			this.actionRemaining = 0.76;
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
				if (this.actionRemaining === 0) this.enterStalk(phaseIndex);
				break;
			case 'stunned':
				boss.vx = 0;
				if (boss.stun <= 0 || this.actionRemaining === 0) this.enterRecover();
				break;
			case 'stalk':
				boss.dir = player.x < boss.x ? -1 : 1;
				boss.vx = boss.dir * (phaseIndex >= 2 ? 82 : 55);
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
			case 'contract-gavel':
			case 'mirror-verdict':
				boss.vx = 0;
				this.tryAttack(boss, player, this.action, combat, combatEvents);
				if (this.actionRemaining === 0) this.enterRecover();
				break;
			case 'false-self-dash':
				boss.vx = boss.dir * 500;
				boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * safeDt));
				this.tryAttack(boss, player, 'false-self-dash', combat, combatEvents);
				if (this.actionRemaining === 0 || boss.x <= ARENA_LEFT || boss.x >= ARENA_RIGHT - boss.w) {
					this.enterRecover();
				}
				break;
			case 'recover':
				boss.vx *= 0.72;
				if (this.actionRemaining === 0) this.enterStalk(phaseIndex);
				break;
			case 'defeated':
				break;
		}
		this.applyPresentation(boss);
		return events;
	}

	getSnapshot(): ReflectionJudgeSnapshot {
		return {
			action: this.action,
			actionRemaining: this.actionRemaining,
			phaseIndex: this.lastPhaseIndex,
			attackCount: this.attackCount,
			telegraph: this.action === 'windup' ? 1 - Math.min(1, this.actionRemaining / 0.9) : 0,
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

	private selectAttack(phaseIndex: number): ReflectionJudgeAttack {
		if (phaseIndex >= 2 && this.attackCount % 3 === 2) return 'false-self-dash';
		if (phaseIndex >= 1 && this.attackCount % 2 === 1) return 'mirror-verdict';
		return 'contract-gavel';
	}

	private windupDuration(attack: ReflectionJudgeAttack, phaseIndex: number): number {
		const pressure = phaseIndex * 0.07;
		if (attack === 'contract-gavel') return 0.74 - pressure;
		if (attack === 'mirror-verdict') return 0.9 - pressure;
		return 0.64 - pressure;
	}

	private attackDuration(attack: ReflectionJudgeAttack): number {
		if (attack === 'contract-gavel') return 0.28;
		if (attack === 'mirror-verdict') return 0.22;
		return 0.46;
	}

	private tryAttack(
		boss: CombatEntity,
		player: Player,
		attack: ReflectionJudgeAttack,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): void {
		if (this.hitApplied) return;
		const hitbox =
			attack === 'contract-gavel'
				? { x: boss.x - 90, y: boss.y - 8, w: boss.w + 180, h: boss.h + 16 }
				: attack === 'mirror-verdict'
					? {
							x: boss.dir > 0 ? boss.x + boss.w : boss.x - 540,
							y: boss.y + 18,
							w: 540,
							h: 18,
						}
					: { x: boss.x - 12, y: boss.y, w: boss.w + 24, h: boss.h };
		const result = combat.resolveAttack(
			boss,
			[player],
			{
				id: `mirror-palace:judge-${attack}`,
				source: 'enemy',
				damage: attack === 'false-self-dash' ? 1.4 : 1.1,
				damageType: attack === 'contract-gavel' ? 'blunt' : 'shock',
				stun: attack === 'mirror-verdict' ? 0.2 : 0.32,
				knockbackX: attack === 'false-self-dash' ? 300 : 210,
				knockbackY: attack === 'contract-gavel' ? -150 : -85,
				hitbox,
				parryable: attack !== 'mirror-verdict',
			},
			combatEvents
		);
		this.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private enterStalk(phaseIndex: number): void {
		this.action = 'stalk';
		this.actionRemaining = phaseIndex >= 2 ? 0.58 : 0.88;
	}

	private enterRecover(): void {
		this.action = 'recover';
		this.actionRemaining = 0.45;
		this.hitApplied = false;
	}

	private applyPresentation(boss: CombatEntity): void {
		boss.bossAction = this.action;
		boss.bossAnimation = this.animationForAction();
		boss.bossTelegraph = this.action === 'windup' ? 1 - Math.min(1, this.actionRemaining / 0.9) : 0;
	}

	private animationForAction(): string {
		switch (this.action) {
			case 'intro':
				return 'phase_intro';
			case 'phase-transition':
				return 'phase_transition';
			case 'stalk':
				return 'patrol_or_move';
			case 'windup':
				return 'windup';
			case 'contract-gavel':
				return 'attack';
			case 'mirror-verdict':
			case 'false-self-dash':
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

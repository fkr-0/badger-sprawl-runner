import type { Player } from '../actors/MossBadger';
import type { BossPhaseRuntimeState } from './BossPhaseSystem';
import type { CombatEntity, CombatEvents, CombatSystem } from './CombatSystem';

export type MadameVitrineAction =
	| 'intro'
	| 'phase-transition'
	| 'stroll'
	| 'windup'
	| 'glass-lane'
	| 'contract-fan'
	| 'mirror-dash'
	| 'recover'
	| 'stunned'
	| 'defeated';

export type MadameVitrineAttack = 'glass-lane' | 'contract-fan' | 'mirror-dash';

export interface MadameVitrineSnapshot {
	action: MadameVitrineAction;
	actionRemaining: number;
	phaseIndex: number;
	attackCount: number;
	telegraph: number;
	pendingAttack: MadameVitrineAttack;
	animation: string;
}

export type MadameVitrineEvent =
	| { kind: 'boss-telegraph'; attack: MadameVitrineAttack }
	| { kind: 'boss-attack'; attack: MadameVitrineAttack }
	| { kind: 'boss-phase-transition'; phaseIndex: number }
	| { kind: 'boss-defeated' };

const ARENA_LEFT = 1870;
const ARENA_RIGHT = 2260;

export class MadameVitrineController {
	private action: MadameVitrineAction = 'intro';
	private actionRemaining = 0.9;
	private pendingAttack: MadameVitrineAttack = 'glass-lane';
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
	): MadameVitrineEvent[] {
		if (!boss) return [];
		const events: MadameVitrineEvent[] = [];
		const safeDt = Math.max(0, dt);
		const phaseIndex = phase?.phaseIndex ?? this.phaseForHealth(boss);

		boss.usesPatternController = true;
		boss.bossSpriteSheetId = 'boss_boss_madame_vitrine_glasscourt';

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
			this.actionRemaining = 0.78;
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
				if (this.actionRemaining === 0) this.enterStroll(phaseIndex);
				break;
			case 'stunned':
				boss.vx = 0;
				if (boss.stun <= 0 || this.actionRemaining === 0) this.enterRecover();
				break;
			case 'stroll':
				this.stepStroll(boss, player, phaseIndex, safeDt, events);
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
			case 'glass-lane':
				boss.vx = 0;
				this.tryAttack(boss, player, 'glass-lane', combat, combatEvents);
				if (this.actionRemaining === 0) this.enterRecover();
				break;
			case 'contract-fan':
				boss.vx = 0;
				this.tryAttack(boss, player, 'contract-fan', combat, combatEvents);
				if (this.actionRemaining === 0) this.enterRecover();
				break;
			case 'mirror-dash':
				boss.vx = boss.dir * (phaseIndex >= 2 ? 510 : 430);
				boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * safeDt));
				this.tryAttack(boss, player, 'mirror-dash', combat, combatEvents);
				if (this.actionRemaining === 0 || boss.x <= ARENA_LEFT || boss.x >= ARENA_RIGHT - boss.w) {
					this.enterRecover();
				}
				break;
			case 'recover':
				boss.vx *= 0.72;
				if (this.actionRemaining === 0) this.enterStroll(phaseIndex);
				break;
			case 'defeated':
				break;
		}

		this.applyPresentation(boss);
		return events;
	}

	getSnapshot(): MadameVitrineSnapshot {
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
		const healthRatio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
		if (healthRatio <= 1 / 3) return 2;
		if (healthRatio <= 2 / 3) return 1;
		return 0;
	}

	private stepStroll(
		boss: CombatEntity,
		player: Player,
		phaseIndex: number,
		dt: number,
		events: MadameVitrineEvent[]
	): void {
		boss.dir = player.x < boss.x ? -1 : 1;
		boss.vx = boss.dir * (phaseIndex >= 2 ? 76 : 52);
		boss.x = Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT - boss.w, boss.x + boss.vx * dt));
		if (this.actionRemaining > 0) return;
		this.pendingAttack = this.selectAttack(phaseIndex);
		this.action = 'windup';
		this.actionRemaining = this.windupDuration(this.pendingAttack, phaseIndex);
		this.attackCount += 1;
		events.push({ kind: 'boss-telegraph', attack: this.pendingAttack });
	}

	private selectAttack(phaseIndex: number): MadameVitrineAttack {
		if (phaseIndex >= 2 && this.attackCount % 3 === 2) return 'mirror-dash';
		if (phaseIndex >= 1 && this.attackCount % 2 === 1) return 'contract-fan';
		return 'glass-lane';
	}

	private windupDuration(attack: MadameVitrineAttack, phaseIndex: number): number {
		const pressure = phaseIndex * 0.08;
		if (attack === 'glass-lane') return 0.92 - pressure;
		if (attack === 'contract-fan') return 0.78 - pressure;
		return 0.68 - pressure;
	}

	private attackDuration(attack: MadameVitrineAttack): number {
		if (attack === 'glass-lane') return 0.24;
		if (attack === 'contract-fan') return 0.36;
		return 0.48;
	}

	private tryAttack(
		boss: CombatEntity,
		player: Player,
		attack: MadameVitrineAttack,
		combat: Pick<CombatSystem, 'resolveAttack'>,
		combatEvents?: CombatEvents
	): void {
		if (this.hitApplied) return;
		const hitbox =
			attack === 'glass-lane'
				? {
						x: boss.dir > 0 ? boss.x + boss.w : boss.x - 520,
						y: boss.y + 20,
						w: 520,
						h: 18,
					}
				: attack === 'contract-fan'
					? { x: boss.x - 150, y: boss.y - 16, w: boss.w + 300, h: boss.h + 32 }
					: { x: boss.x - 10, y: boss.y, w: boss.w + 20, h: boss.h };
		const result = combat.resolveAttack(
			boss,
			[player],
			{
				id: `chrome-arcology:vitrine-${attack}`,
				source: 'enemy',
				damage: attack === 'mirror-dash' ? 1.35 : 1,
				damageType: attack === 'contract-fan' ? 'slash' : 'pierce',
				stun: attack === 'glass-lane' ? 0.18 : 0.3,
				knockbackX: attack === 'mirror-dash' ? 280 : 190,
				knockbackY: attack === 'contract-fan' ? -155 : -85,
				hitbox,
				parryable: attack !== 'glass-lane',
			},
			combatEvents
		);
		this.hitApplied = result.hits.length > 0 || result.blocked > 0;
	}

	private enterStroll(phaseIndex: number): void {
		this.action = 'stroll';
		this.actionRemaining = phaseIndex >= 2 ? 0.62 : 0.92;
	}

	private enterRecover(): void {
		this.action = 'recover';
		this.actionRemaining = 0.48;
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
			case 'stroll':
				return 'patrol_or_move';
			case 'windup':
				return 'windup';
			case 'glass-lane':
				return 'attack';
			case 'contract-fan':
			case 'mirror-dash':
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

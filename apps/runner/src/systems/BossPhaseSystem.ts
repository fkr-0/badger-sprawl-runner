import type { Player } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';

export interface RuntimeBossPhase {
	id: string;
	label: string;
	mechanic: string;
}

export interface BossPhaseRuntimeState {
	activePhaseId: string;
	activePhaseLabel: string;
	activeMechanic: string;
	phaseIndex: number;
	phaseCount: number;
}

export class BossPhaseSystem {
	private state: BossPhaseRuntimeState | null = null;

	constructor(private readonly phases: readonly RuntimeBossPhase[] = []) {}

	step(_player: Player, enemies: CombatEntity[], _dt: number): BossPhaseRuntimeState | null {
		const boss = enemies.find((enemy) => enemy.hp > 0 && enemy.maxHp > 1);
		if (!boss || this.phases.length === 0) {
			this.state = null;
			return null;
		}

		const healthRatio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
		const phaseIndex = Math.min(
			this.phases.length - 1,
			Math.floor((1 - healthRatio) * this.phases.length)
		);
		const phase = this.phases[phaseIndex] ?? this.phases[0];
		if (!phase) {
			this.state = null;
			return null;
		}
		this.applyPhasePressure(boss, phase, phaseIndex);
		this.state = {
			activePhaseId: phase.id,
			activePhaseLabel: phase.label,
			activeMechanic: phase.mechanic,
			phaseIndex,
			phaseCount: this.phases.length,
		};
		return this.getState();
	}

	getState(): BossPhaseRuntimeState | null {
		return this.state ? { ...this.state } : null;
	}

	private applyPhasePressure(boss: CombatEntity, phase: RuntimeBossPhase, phaseIndex: number): void {
		boss.bossPhaseLabel = phase.label;
		boss.bossPhaseMechanic = phase.mechanic;
		boss.bossPhaseIndex = phaseIndex;
		if (phaseIndex > 0) boss.vx += boss.dir * (8 + phaseIndex * 4);
		if (/parry|mirror|counter/i.test(phase.mechanic)) boss.parryWindow = Math.max(boss.parryWindow ?? 0, 0.08);
		if (/laser|static|signal|broadcast|surge/i.test(phase.mechanic)) boss.stun = Math.max(0, boss.stun - 0.03);
		if (/summon|drone|cargo|container/i.test(phase.mechanic)) boss.invuln = Math.max(boss.invuln, 0.05);
	}
}

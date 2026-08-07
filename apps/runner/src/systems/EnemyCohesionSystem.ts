import type { Player } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';

export type EnemyCohesionState = 'committed' | 'wavering' | 'retreating' | 'standing-down';

export interface EnemyCohesionProfile {
	baseMorale: number;
	casualtyPressure: number;
	conflictPressure: number;
	relayLossPressure: number;
	engagementSupport: number;
	responseRate: number;
	waveringThreshold: number;
	retreatThreshold: number;
	retreatSpeed: number;
	standDownThreshold: number;
}

interface CellBaseline {
	memberIds: Set<string>;
	relayIds: Set<string>;
}

export type EnemyCohesionEvent =
	| {
			kind: 'enemy-wavering' | 'enemy-retreating' | 'enemy-standing-down' | 'enemy-recommitted';
			enemyId: string;
			cellId: string;
			morale: number;
		}
	| {
			kind: 'cell-cohesion-broken';
			cellId: string;
			casualtyRatio: number;
			reportConflict: number;
			relayLost: boolean;
		};

const DEFAULT_PROFILE: EnemyCohesionProfile = Object.freeze({
	baseMorale: 0.82,
	casualtyPressure: 0.64,
	conflictPressure: 0.46,
	relayLossPressure: 0.18,
	engagementSupport: 0.14,
	responseRate: 2.2,
	waveringThreshold: 0.48,
	retreatThreshold: 0.22,
	retreatSpeed: 72,
	standDownThreshold: 0.72,
});

/**
 * Local faction cohesion derived from material conditions rather than a global
 * morale bar. Casualties, lost relays, and contradictory intelligence weaken a
 * patrol cell; active mutual support can stabilize it. Bosses remain authored
 * encounters and never retreat through this generic system.
 */
export class EnemyCohesionSystem {
	private readonly baselines = new Map<string, CellBaseline>();
	private readonly standDownOffers = new Map<string, number>();
	private readonly brokenCells = new Set<string>();

	constructor(private readonly profile: EnemyCohesionProfile = DEFAULT_PROFILE) {}

	offerStandDown(cellId: string, legitimacy: number): void {
		this.standDownOffers.set(cellId, Math.max(this.standDownOffers.get(cellId) ?? 0, clamp01(legitimacy)));
	}

	step(enemies: CombatEntity[], player: Player, dt: number): EnemyCohesionEvent[] {
		const safeDt = Math.max(0, dt);
		const events: EnemyCohesionEvent[] = [];
		const byCell = new Map<string, CombatEntity[]>();
		for (const enemy of enemies) {
			if (enemy.bossId || enemy.isDummy || !enemy.communicationCellId?.includes(':cell:')) continue;
			const cell = byCell.get(enemy.communicationCellId) ?? [];
			cell.push(enemy);
			byCell.set(enemy.communicationCellId, cell);
		}

		for (const [cellId, members] of byCell) {
			const baseline = this.ensureBaseline(cellId, members);
			const living = members.filter((enemy) => enemy.hp > 0);
			if (living.length === 0) continue;
			const casualtyRatio = clamp01(1 - living.length / Math.max(1, baseline.memberIds.size));
			const reportConflict =
				living.reduce((total, enemy) => total + (enemy.networkReportConflict ?? 0), 0) /
				living.length;
			const relayLost =
				baseline.relayIds.size > 0 &&
				![...baseline.relayIds].some((id) => living.some((enemy) => enemy.id === id));
			const engagedRatio =
				living.filter((enemy) => enemy.awarenessState === 'engaged').length / living.length;
			const targetMorale = clamp01(
				this.profile.baseMorale -
					casualtyRatio * this.profile.casualtyPressure -
					reportConflict * this.profile.conflictPressure -
					(relayLost ? this.profile.relayLossPressure : 0) +
					engagedRatio * this.profile.engagementSupport
			);
			const standDownLegitimacy = this.standDownOffers.get(cellId) ?? 0;

			if (
				targetMorale <= this.profile.retreatThreshold &&
				!this.brokenCells.has(cellId)
			) {
				this.brokenCells.add(cellId);
				events.push({
					kind: 'cell-cohesion-broken',
					cellId,
					casualtyRatio,
					reportConflict,
					relayLost,
				});
			}

			for (const enemy of living) {
				const previous = enemy.cohesionState ?? 'committed';
				const currentMorale = enemy.morale ?? this.profile.baseMorale;
				enemy.morale = approach(currentMorale, targetMorale, safeDt * this.profile.responseRate);
				const next = this.resolveState(enemy.morale, standDownLegitimacy);
				enemy.cohesionState = next;
				this.applyState(enemy, next, player, safeDt);
				if (next !== previous) {
					events.push({
					kind:
						next === 'wavering'
							? 'enemy-wavering'
							: next === 'retreating'
								? 'enemy-retreating'
								: next === 'standing-down'
									? 'enemy-standing-down'
									: 'enemy-recommitted',
					enemyId: enemy.id ?? 'anonymous-enemy',
					cellId,
					morale: enemy.morale,
				});
				}
			}
		}
		return events;
	}

	private ensureBaseline(cellId: string, members: CombatEntity[]): CellBaseline {
		const existing = this.baselines.get(cellId);
		if (existing) return existing;
		const baseline: CellBaseline = {
			memberIds: new Set(members.map((enemy, index) => enemy.id ?? `${cellId}:member:${index}`)),
			relayIds: new Set(
				members
					.filter((enemy) => enemy.communicationRole === 'relay')
					.map((enemy, index) => enemy.id ?? `${cellId}:relay:${index}`)
			),
		};
		this.baselines.set(cellId, baseline);
		return baseline;
	}

	private resolveState(morale: number, standDownLegitimacy: number): EnemyCohesionState {
		if (
			standDownLegitimacy >= this.profile.standDownThreshold &&
			morale <= this.profile.waveringThreshold
		) {
			return 'standing-down';
		}
		if (morale <= this.profile.retreatThreshold) return 'retreating';
		if (morale <= this.profile.waveringThreshold) return 'wavering';
		return 'committed';
	}

	private applyState(
		enemy: CombatEntity,
		state: EnemyCohesionState,
		player: Player,
		dt: number
	): void {
		if (state === 'standing-down') {
			enemy.awarenessState = 'routine';
			enemy.awarenessLevel = 0;
			enemy.aiState = 'stand-down';
			enemy.vx = 0;
			return;
		}
		if (state !== 'retreating') return;
		const playerCenter = player.x + player.w / 2;
		const enemyCenter = enemy.x + enemy.w / 2;
		const direction = enemyCenter < playerCenter ? -1 : 1;
		enemy.awarenessState = 'alert';
		enemy.awarenessLevel = Math.min(enemy.awarenessLevel ?? 0.45, 0.55);
		enemy.aiState = 'retreat';
		enemy.vx = direction * this.profile.retreatSpeed;
		enemy.x = Math.max(0, enemy.x + enemy.vx * dt);
	}
}

function approach(current: number, target: number, amount: number): number {
	return current + (target - current) * Math.min(1, Math.max(0, amount));
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

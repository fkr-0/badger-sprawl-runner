import { createResolutionEvidenceTracker } from '@arcade/runtime/gameplay';
import type { Player } from '../actors/MossBadger';
import type { StageRuntimeResult } from '../game/GameFlow';
import { RESOLUTION_APPROACHES, type ResolutionApproach } from '../game/ResolutionApproach';
import type { CombatEntity, CombatEvent } from './CombatSystem';
import type { ActionMap } from './InputSystem';

export interface ResolutionApproachSnapshot {
	approaches: ResolutionApproach[];
	playerKillCount: number;
	engagementObserved: boolean;
	ghoststepSeconds: number;
	nonLethal: boolean;
	undetected: boolean;
}

export interface ResolutionApproachProfile {
	ghoststepProximity: number;
	ghoststepEvidenceSeconds: number;
}

const DEFAULT_PROFILE: ResolutionApproachProfile = Object.freeze({
	ghoststepProximity: 360,
	ghoststepEvidenceSeconds: 1.8,
});

const PLAYER_KILL_COUNTER = 'player-kills';
const ENGAGEMENT_FLAG = 'engagement-observed';
const GHOSTSTEP_DURATION = 'ghoststep-seconds';

/**
 * Game-specific observation policy over the shared, renderer-neutral resolution
 * evidence tracker. Badger decides what counts as claw, ballistics, hacking or
 * ghoststep evidence; the runtime owns deterministic accumulation, sorting,
 * constraint derivation and event delivery.
 */
export class ResolutionApproachTracker {
	private readonly evidence = createResolutionEvidenceTracker({
		knownApproaches: RESOLUTION_APPROACHES,
		constraints: {
			nonLethal: (snapshot) => (snapshot.counters[PLAYER_KILL_COUNTER] ?? 0) === 0,
			undetected: (snapshot) => snapshot.flags[ENGAGEMENT_FLAG] !== true,
		},
	});

	constructor(private readonly profile: ResolutionApproachProfile = DEFAULT_PROFILE) {}

	observeAction(action: ActionMap): void {
		if (action.meleePressed) this.evidence.recordApproach('claw');
		if (action.shootPressed) this.evidence.recordApproach('ballistics');
		if (action.hackPressed) this.evidence.recordApproach('hacking');
	}

	observeCombatEvent(event: CombatEvent): void {
		if (event.kind === 'kill' && event.source === 'player') {
			this.evidence.incrementCounter(PLAYER_KILL_COUNTER);
		}
	}

	observeEncounter(
		enemies: readonly CombatEntity[],
		player: Pick<Player, 'x' | 'y' | 'w' | 'h'>,
		dt: number
	): void {
		const living = enemies.filter((enemy) => enemy.hp > 0 && !enemy.isDummy);
		if (living.some((enemy) => enemy.awarenessState === 'engaged')) {
			this.evidence.setFlag(ENGAGEMENT_FLAG, true);
		}
		const playerX = player.x + player.w / 2;
		const playerY = player.y + player.h / 2;
		const quietlyExposed = living.some((enemy) => {
			if (enemy.bossId || enemy.awarenessState === 'engaged') return false;
			const enemyX = enemy.x + enemy.w / 2;
			const enemyY = enemy.y + enemy.h / 2;
			return Math.hypot(enemyX - playerX, enemyY - playerY) <= this.profile.ghoststepProximity;
		});
		if (quietlyExposed) {
			const ghoststepSeconds = this.evidence.addDuration(GHOSTSTEP_DURATION, Math.max(0, dt));
			if (ghoststepSeconds >= this.profile.ghoststepEvidenceSeconds) {
				this.evidence.recordApproach('ghoststep');
			}
		}
	}

	recordSemanticApproach(approach: ResolutionApproach): void {
		this.evidence.recordApproach(approach);
	}

	decorate<T extends StageRuntimeResult>(result: T): T {
		const snapshot = this.getSnapshot();
		return {
			...result,
			resolutionApproaches: snapshot.approaches,
			resolutionConstraints: {
				nonLethal: snapshot.nonLethal,
				undetected: snapshot.undetected,
			},
		};
	}

	getSnapshot(): ResolutionApproachSnapshot {
		const snapshot = this.evidence.snapshot();
		return {
			approaches: [...snapshot.approaches] as ResolutionApproach[],
			playerKillCount: snapshot.counters[PLAYER_KILL_COUNTER] ?? 0,
			engagementObserved: snapshot.flags[ENGAGEMENT_FLAG] ?? false,
			ghoststepSeconds: snapshot.durations[GHOSTSTEP_DURATION] ?? 0,
			nonLethal: snapshot.constraints.nonLethal ?? true,
			undetected: snapshot.constraints.undetected ?? true,
		};
	}
}

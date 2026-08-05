import type { Player } from '../actors/MossBadger';
import {
	findEncounterRoute,
	getEncounterZoneAtPoint,
	type EncounterPortalState,
	type StageEncounterTopology,
} from '../world/EncounterTopology';
import type { CombatEntity } from './CombatSystem';
import { computeCombatVisibility } from './CombatVisibilitySystem';
import type { EncounterNoticeEvidence } from './EncounterReadinessSystem';

export interface EnemyVisionProfile {
	frontRange: number;
	rearRange: number;
	verticalRange: number;
	minimumConfidence: number;
}

export interface EnemyVisionEvidence extends EncounterNoticeEvidence {
	enemyId: string;
	enemyZoneId?: string;
	playerZoneId?: string;
	portalIds: string[];
	blockerId?: string;
	reason: 'visible' | 'range' | 'vertical' | 'topology' | 'occluded' | 'outside-topology';
}

export type EnemyVisionEvent =
	| { kind: 'player-spotted'; enemyId: string; confidence: number; portalIds: string[] }
	| { kind: 'player-lost'; enemyId: string; reason: EnemyVisionEvidence['reason'] }
	| { kind: 'vision-occluded'; enemyId: string; blockerId: string };

export interface EnemyVisionStep {
	evidenceByEnemyId: ReadonlyMap<string, EnemyVisionEvidence>;
	events: EnemyVisionEvent[];
}

const DEFAULT_PROFILE: EnemyVisionProfile = Object.freeze({
	frontRange: 520,
	rearRange: 130,
	verticalRange: 210,
	minimumConfidence: 0.05,
});

/**
 * Deterministic authored-geometry vision query.
 *
 * The system owns no engagement or attack state. It emits bounded local
 * evidence for EncounterReadinessSystem, preserving one readiness truth while
 * replacing the former distance-only visibility heuristic in authored stages.
 */
export class EnemyVisionSystem {
	private readonly lastVisible = new Map<string, boolean>();

	constructor(private readonly profile: EnemyVisionProfile = DEFAULT_PROFILE) {}

	step(
		enemies: readonly CombatEntity[],
		player: Player,
		topology: StageEncounterTopology,
		portalStates: Readonly<Record<string, EncounterPortalState>> = {}
	): EnemyVisionStep {
		const evidenceByEnemyId = new Map<string, EnemyVisionEvidence>();
		const events: EnemyVisionEvent[] = [];
		const playerCenter = center(player);
		const playerZone = getEncounterZoneAtPoint(topology, playerCenter.x, playerCenter.y);
		const obstacles = topology.occluders
			.filter((occluder) => occluder.blocksVision)
			.map((occluder) => ({
				id: occluder.id,
				x: occluder.x,
				y: occluder.y,
				w: occluder.w,
				h: occluder.h,
				layer: 'sight-occluder',
			}));

		for (const [index, enemy] of [...enemies].entries()) {
			if (enemy.hp <= 0 || enemy.isDummy) continue;
			const enemyId = stableEnemyId(enemy, index);
			const enemyCenter = center(enemy);
			const enemyZone = getEncounterZoneAtPoint(topology, enemyCenter.x, enemyCenter.y);
			const dx = playerCenter.x - enemyCenter.x;
			const dy = Math.abs(playerCenter.y - enemyCenter.y);
			const facing = dx === 0 || Math.sign(dx) === (enemy.dir < 0 ? -1 : 1);
			const maxRange = facing ? this.profile.frontRange : this.profile.rearRange;
			const distance = Math.hypot(dx, playerCenter.y - enemyCenter.y);

			let evidence: EnemyVisionEvidence;
			if (distance > maxRange) {
				evidence = hidden(enemyId, enemyZone?.id, playerZone?.id, 'range');
			} else if (dy > this.profile.verticalRange) {
				evidence = hidden(enemyId, enemyZone?.id, playerZone?.id, 'vertical');
			} else {
				const route =
					enemyZone && playerZone
						? findEncounterRoute(topology, enemyZone.id, playerZone.id, 'vision', portalStates)
						: null;
				if (enemyZone && playerZone && !route) {
					evidence = hidden(enemyId, enemyZone.id, playerZone.id, 'topology');
				} else {
					const visibility = computeCombatVisibility(
						{ ...enemy, id: enemyId },
						[{ ...player, id: 'player', faction: 'player' }],
						obstacles,
						maxRange
					);
					const blockerId = visibility.blockersByTarget.player;
					if (blockerId && blockerId !== 'range') {
						evidence = {
							...hidden(enemyId, enemyZone?.id, playerZone?.id, 'occluded'),
							blockerId,
						};
					} else {
						const distanceFactor = Math.max(0, 1 - distance / Math.max(1, maxRange));
						const transmission = route?.transmission ?? 1;
						const confidence = Math.min(1, (0.22 + distanceFactor * 0.78) * transmission);
						evidence = {
							enemyId,
							visible: confidence >= this.profile.minimumConfidence,
							confidence,
							enemyZoneId: enemyZone?.id,
							playerZoneId: playerZone?.id,
							portalIds: route?.portalIds ?? [],
							reason: enemyZone && playerZone ? 'visible' : 'outside-topology',
						};
					}
				}
			}

			evidenceByEnemyId.set(enemyId, evidence);
			this.project(enemy, evidence);
			const wasVisible = this.lastVisible.get(enemyId) ?? false;
			if (evidence.visible && !wasVisible) {
				events.push({
					kind: 'player-spotted',
					enemyId,
					confidence: evidence.confidence,
					portalIds: [...evidence.portalIds],
				});
			} else if (!evidence.visible && wasVisible) {
				events.push({ kind: 'player-lost', enemyId, reason: evidence.reason });
			}
			if (!evidence.visible && evidence.blockerId) {
				events.push({ kind: 'vision-occluded', enemyId, blockerId: evidence.blockerId });
			}
			this.lastVisible.set(enemyId, evidence.visible);
		}

		return { evidenceByEnemyId, events };
	}

	private project(enemy: CombatEntity, evidence: EnemyVisionEvidence): void {
		enemy.visionConfidence = evidence.confidence;
		enemy.visionState = evidence.visible ? 'visible' : evidence.reason === 'occluded' ? 'occluded' : 'hidden';
		enemy.visionBlockerId = evidence.blockerId;
		enemy.visionPortalIds = [...evidence.portalIds];
		enemy.encounterZoneId = evidence.enemyZoneId;
	}
}

function hidden(
	enemyId: string,
	enemyZoneId: string | undefined,
	playerZoneId: string | undefined,
	reason: EnemyVisionEvidence['reason']
): EnemyVisionEvidence {
	return {
		enemyId,
		visible: false,
		confidence: 0,
		enemyZoneId,
		playerZoneId,
		portalIds: [],
		reason,
	};
}

function stableEnemyId(enemy: CombatEntity, index: number): string {
	return enemy.id ?? `${enemy.procgenFamily ?? enemy.procgenRole ?? 'enemy'}:${index}`;
}

function center(entity: Pick<CombatEntity, 'x' | 'y' | 'w' | 'h'>): { x: number; y: number } {
	return { x: entity.x + entity.w / 2, y: entity.y + entity.h / 2 };
}

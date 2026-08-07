import type { Player } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import type { EncounterReadinessSystem } from './EncounterReadinessSystem';
import { EnemyReportLedger, type EnemyReportConsensus } from './EnemyReportLedger';
import {
	applyEnemySourceTrust,
	type EnemyReportSourceKind,
} from './EnemySourceTrustDoctrine';

export type EnemyCommunicationRole = 'observer' | 'relay' | 'enforcer' | 'isolated';

export interface EnemyCommunicationProfile {
	cellWidth: number;
	localSignalRange: number;
	localBuildRate: number;
	relayBuildRate: number;
	noticeTransferRate: number;
	decayRate: number;
	maxRelayHops: number;
}

export type EnemyCommunicationEvent =
	| {
			kind: 'cell-suspicious' | 'cell-alerted';
			cellId: string;
			sourceEnemyId: string;
			lastKnownX: number;
			lastKnownY: number;
		}
	| {
			kind: 'relay-signal';
			fromCellId: string;
			toCellId: string;
			hop: number;
		}
	| {
			kind: 'cell-conflicted';
			cellId: string;
			primarySourceId: string;
			reportCount: number;
			trust: number;
			conflict: number;
		};

interface CellRuntime {
	alert: number;
	previousBand: 0 | 1 | 2;
	lastKnownX: number;
	lastKnownY: number;
	sourceEnemyId: string;
	hop: number;
	reportTrust: number;
	reportConflict: number;
	reportCount: number;
	previousConflictBand: 0 | 1;
	sourceKind: EnemyReportSourceKind;
	sourceTrustWeight: number;
	doctrineLabel: string;
}

const DEFAULT_PROFILE: EnemyCommunicationProfile = Object.freeze({
	cellWidth: 460,
	localSignalRange: 390,
	localBuildRate: 1.45,
	relayBuildRate: 0.42,
	noticeTransferRate: 0.5,
	decayRate: 0.14,
	maxRelayHops: 1,
});

/**
 * Local, bounded enemy coordination.
 *
 * Enemies share a last-known position through encounter cells. Relays may warn
 * one adjacent cell, but signals never become global scene omniscience. The
 * system transfers suspicion into EncounterReadiness rather than taking over
 * combat AI, preserving the encounter/action boundary.
 */
export class EnemyCommunicationNetwork {
	private readonly cells = new Map<string, CellRuntime>();
	private readonly reportLedger = new EnemyReportLedger();
	private readonly sourceMetadata = new Map<
		string,
		{ sourceKind: EnemyReportSourceKind; sourceTrustWeight: number; doctrineLabel: string }
	>();
	private readonly assignedCells = new WeakMap<CombatEntity, string>();
	private readonly assignedRoles = new WeakMap<CombatEntity, EnemyCommunicationRole>();

	constructor(private readonly profile: EnemyCommunicationProfile = DEFAULT_PROFILE) {}

	reportLocalIncident(
		stageId: string,
		reporterX: number,
		lastKnownX: number,
		lastKnownY: number,
		confidence: number,
		sourceEnemyId: string,
		sourceKind: EnemyReportSourceKind = 'sensor'
	): EnemyCommunicationEvent[] {
		const index = Math.floor(Math.max(0, reporterX) / this.profile.cellWidth);
		const cellId = `${stageId}:cell:${index}`;
		const cell = this.ensureCell(cellId);
		const trust = applyEnemySourceTrust(stageId, sourceKind, confidence);
		this.rememberSourceMetadata(cellId, sourceEnemyId, trust);
		const consensus = this.reportLedger.report({
			cellId,
			sourceId: sourceEnemyId,
			x: lastKnownX,
			y: lastKnownY,
			confidence: trust.adjustedConfidence,
		});
		this.applyConsensus(cell, consensus);
		cell.alert = Math.max(cell.alert, consensus.confidence);
		cell.hop = 0;
		const events: EnemyCommunicationEvent[] = [];
		this.emitConflictEvent(cellId, cell, events);
		this.emitBandEvent(cellId, cell, events);
		return events;
	}

	step(
		stageId: string,
		enemies: CombatEntity[],
		player: Player,
		dt: number,
		readiness: Pick<EncounterReadinessSystem, 'raiseNotice'>
	): EnemyCommunicationEvent[] {
		const safeDt = Math.max(0, dt);
		const events: EnemyCommunicationEvent[] = [];
		this.reportLedger.decay(safeDt);
		const living = enemies.filter((enemy) => enemy.hp > 0);
		for (const enemy of living) this.assign(stageId, enemy);

		const activeSources = living.filter(
			(enemy) => enemy.awarenessState === 'engaged' && this.roleOf(enemy) !== 'isolated'
		);
		const sourceCells = new Set<string>();
		for (const source of activeSources) {
			const cellId = this.cellOf(source);
			const cell = this.ensureCell(cellId);
			sourceCells.add(cellId);
			const sourceId = source.id ?? 'engaged-observer';
			const trust = applyEnemySourceTrust(stageId, 'witness', 1);
			this.rememberSourceMetadata(cellId, sourceId, trust);
			const consensus = this.reportLedger.report({
				cellId,
				sourceId,
				x: player.x + player.w / 2,
				y: player.y + player.h / 2,
				confidence: trust.adjustedConfidence,
			});
			this.applyConsensus(cell, consensus);
			cell.hop = 0;
			cell.alert = Math.min(1, cell.alert + safeDt * this.profile.localBuildRate);
		}

		for (const [cellId, cell] of this.cells) {
			if (!sourceCells.has(cellId)) {
				cell.alert = Math.max(0, cell.alert - safeDt * this.profile.decayRate);
			}
			const consensus = this.reportLedger.resolve(cellId);
			if (consensus) {
				this.applyConsensus(cell, consensus);
				cell.alert = Math.max(cell.alert, consensus.confidence);
			} else {
				cell.reportTrust = 0;
				cell.reportConflict = 0;
				cell.reportCount = 0;
			}
			this.emitConflictEvent(cellId, cell, events);
			this.emitBandEvent(cellId, cell, events);
		}

		const relaySourceCells = new Set(sourceCells);
		for (const [cellId, cell] of this.cells) {
			if (cell.alert >= 0.72 && cell.hop === 0) relaySourceCells.add(cellId);
		}

		for (const sourceCellId of relaySourceCells) {
			const sourceCell = this.ensureCell(sourceCellId);
			if (sourceCell.alert < 0.72 || sourceCell.hop >= this.profile.maxRelayHops) continue;
			const sourceIndex = parseCellIndex(sourceCellId);
			if (sourceIndex === null) continue;
			const hasRelay = living.some(
				(enemy) => this.cellOf(enemy) === sourceCellId && this.roleOf(enemy) === 'relay'
			);
			if (!hasRelay) continue;
			for (const nextIndex of [sourceIndex - 1, sourceIndex + 1]) {
				const targetCellId = `${stageId}:cell:${nextIndex}`;
				if (!living.some((enemy) => this.cellOf(enemy) === targetCellId)) continue;
				const target = this.ensureCell(targetCellId);
				const before = target.alert;
				const relaySourceId = `relay:${sourceCellId}`;
				const relayTrust = applyEnemySourceTrust(
					stageId,
					'relay',
					Math.min(0.68, sourceCell.alert * Math.max(0.35, sourceCell.reportTrust))
				);
				this.rememberSourceMetadata(targetCellId, relaySourceId, relayTrust);
				const relayConsensus = this.reportLedger.report({
					cellId: targetCellId,
					sourceId: relaySourceId,
					x: sourceCell.lastKnownX,
					y: sourceCell.lastKnownY,
					confidence: relayTrust.adjustedConfidence,
				});
				this.applyConsensus(target, relayConsensus);
				target.alert = Math.min(
					0.68,
					Math.max(
						relayConsensus.confidence,
						target.alert + safeDt * this.profile.relayBuildRate * sourceCell.alert
					)
				);
				target.hop = sourceCell.hop + 1;
				if (before === 0 && target.alert > 0) {
					events.push({
						kind: 'relay-signal',
						fromCellId: sourceCellId,
						toCellId: targetCellId,
						hop: target.hop,
					});
				}
			}
		}

		for (const enemy of living) {
			const role = this.roleOf(enemy);
			const cell = this.ensureCell(this.cellOf(enemy));
			enemy.networkAlert = cell.alert;
			enemy.networkReportTrust = cell.reportTrust;
			enemy.networkReportConflict = cell.reportConflict;
			enemy.networkReportSourceId = cell.sourceEnemyId;
			enemy.networkReportSourceKind = cell.sourceKind;
			enemy.networkSourceTrustWeight = cell.sourceTrustWeight;
			enemy.networkDoctrineLabel = cell.doctrineLabel;
			if (cell.alert <= 0 || role === 'isolated' || enemy.awarenessState === 'engaged') continue;
			const distanceToSource = Math.abs(enemy.x + enemy.w / 2 - cell.lastKnownX);
			if (distanceToSource > this.profile.localSignalRange && cell.hop === 0) continue;
			enemy.lastKnownPlayerX = cell.lastKnownX;
			enemy.lastKnownPlayerY = cell.lastKnownY;
			const roleMultiplier = role === 'relay' ? 1.2 : role === 'enforcer' ? 0.82 : 1;
			const trustMultiplier = 0.45 + cell.reportTrust * 0.55;
			readiness.raiseNotice(
				enemy,
				safeDt * this.profile.noticeTransferRate * cell.alert * roleMultiplier * trustMultiplier
			);
		}
		return events;
	}

	getCellSnapshot(): Array<{
		cellId: string;
		alert: number;
		lastKnownX: number;
		lastKnownY: number;
		hop: number;
		primarySourceId: string;
		reportTrust: number;
		reportConflict: number;
		reportCount: number;
		sourceKind: EnemyReportSourceKind;
		sourceTrustWeight: number;
		doctrineLabel: string;
	}> {
		return [...this.cells.entries()]
			.map(([cellId, cell]) => ({
				cellId,
				alert: cell.alert,
				lastKnownX: cell.lastKnownX,
				lastKnownY: cell.lastKnownY,
				hop: cell.hop,
				primarySourceId: cell.sourceEnemyId,
				reportTrust: cell.reportTrust,
				reportConflict: cell.reportConflict,
				reportCount: cell.reportCount,
				sourceKind: cell.sourceKind,
				sourceTrustWeight: cell.sourceTrustWeight,
				doctrineLabel: cell.doctrineLabel,
			}))
			.sort((a, b) => a.cellId.localeCompare(b.cellId));
	}

	private assign(stageId: string, enemy: CombatEntity): void {
		if (!this.assignedCells.has(enemy)) {
			const index = Math.floor(Math.max(0, enemy.x) / this.profile.cellWidth);
			const cellId = enemy.bossId ? `${stageId}:boss:${enemy.bossId}` : `${stageId}:cell:${index}`;
			this.assignedCells.set(enemy, cellId);
			enemy.communicationCellId = cellId;
		}
		if (!this.assignedRoles.has(enemy)) {
			const role = inferCommunicationRole(enemy);
			this.assignedRoles.set(enemy, role);
			enemy.communicationRole = role;
		}
	}

	private cellOf(enemy: CombatEntity): string {
		return this.assignedCells.get(enemy) ?? enemy.communicationCellId ?? 'unassigned:cell:0';
	}

	private roleOf(enemy: CombatEntity): EnemyCommunicationRole {
		return this.assignedRoles.get(enemy) ?? inferCommunicationRole(enemy);
	}

	private ensureCell(cellId: string): CellRuntime {
		const existing = this.cells.get(cellId);
		if (existing) return existing;
		const created: CellRuntime = {
			alert: 0,
			previousBand: 0,
			lastKnownX: 0,
			lastKnownY: 0,
			sourceEnemyId: 'unknown',
			hop: 0,
			reportTrust: 0,
			reportConflict: 0,
			reportCount: 0,
			previousConflictBand: 0,
			sourceKind: 'witness',
			sourceTrustWeight: 1,
			doctrineLabel: 'UNASSIGNED LOCAL DOCTRINE',
		};
		this.cells.set(cellId, created);
		return created;
	}

	private applyConsensus(cell: CellRuntime, consensus: EnemyReportConsensus): void {
		cell.lastKnownX = consensus.x;
		cell.lastKnownY = consensus.y;
		cell.sourceEnemyId = consensus.primarySourceId;
		cell.reportTrust = consensus.trust;
		cell.reportConflict = consensus.conflict;
		cell.reportCount = consensus.reportCount;
		const metadata = this.sourceMetadata.get(
			this.sourceMetadataKey(consensus.cellId, consensus.primarySourceId)
		);
		if (metadata) {
			cell.sourceKind = metadata.sourceKind;
			cell.sourceTrustWeight = metadata.sourceTrustWeight;
			cell.doctrineLabel = metadata.doctrineLabel;
		}
	}

	private rememberSourceMetadata(
		cellId: string,
		sourceId: string,
		metadata: { sourceKind: EnemyReportSourceKind; weight: number; doctrineLabel: string }
	): void {
		this.sourceMetadata.set(this.sourceMetadataKey(cellId, sourceId), {
			sourceKind: metadata.sourceKind,
			sourceTrustWeight: metadata.weight,
			doctrineLabel: metadata.doctrineLabel,
		});
	}

	private sourceMetadataKey(cellId: string, sourceId: string): string {
		return `${cellId}\u0000${sourceId}`;
	}

	private emitConflictEvent(
		cellId: string,
		cell: CellRuntime,
		events: EnemyCommunicationEvent[]
	): void {
		const band: 0 | 1 = cell.reportConflict >= 0.28 && cell.reportCount > 1 ? 1 : 0;
		if (band > cell.previousConflictBand) {
			events.push({
				kind: 'cell-conflicted',
				cellId,
				primarySourceId: cell.sourceEnemyId,
				reportCount: cell.reportCount,
				trust: cell.reportTrust,
				conflict: cell.reportConflict,
			});
		}
		cell.previousConflictBand = band;
	}

	private emitBandEvent(
		cellId: string,
		cell: CellRuntime,
		events: EnemyCommunicationEvent[]
	): void {
		const band: 0 | 1 | 2 = cell.alert >= 0.72 ? 2 : cell.alert >= 0.28 ? 1 : 0;
		if (band <= cell.previousBand) {
			cell.previousBand = band;
			return;
		}
		events.push({
			kind: band === 2 ? 'cell-alerted' : 'cell-suspicious',
			cellId,
			sourceEnemyId: cell.sourceEnemyId,
			lastKnownX: cell.lastKnownX,
			lastKnownY: cell.lastKnownY,
		});
		cell.previousBand = band;
	}
}

export function inferCommunicationRole(enemy: CombatEntity): EnemyCommunicationRole {
	if (enemy.bossId) return 'isolated';
	const role = enemy.procgenRole ?? '';
	if (['turret', 'ranged', 'trapper', 'summoner', 'support'].includes(role)) return 'relay';
	if (['bruiser', 'shield'].includes(role)) return 'enforcer';
	return 'observer';
}

function parseCellIndex(cellId: string): number | null {
	const match = /:cell:(-?\d+)$/.exec(cellId);
	return match ? Number(match[1]) : null;
}


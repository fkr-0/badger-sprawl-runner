import type { DroppedItem } from '../../systems/ItemDropSystem';
import type { StageRuntimeResult } from '../GameFlow';
import type { ExpeditionCommit } from './ExpeditionLedger';
import type { WorldCommand, WorldCommandResult, WorldDirector } from './WorldDirector';

export interface ExpeditionCommitResult {
	ok: boolean;
	changed: boolean;
	salvageCredchips: number;
	worldResult?: WorldCommandResult;
	rewardResults: WorldCommandResult[];
}

/**
 * Commits only the bounded expedition projection returned by StageRunScene.
 * Scene objects, enemies, pickups, and transient combat state never cross the
 * world boundary.
 */
export class ExpeditionDirector {
	constructor(private readonly world: WorldDirector) {}

	commitStageResult(result: StageRuntimeResult): ExpeditionCommitResult {
		const commit = result.expeditionCommit;
		const commands: WorldCommand[] = [];
		if (commit) commands.push({ type: 'commit-expedition', commit });
		if (commit && commit.bankedSalvage > 0) {
			commands.push({
				type: 'record-economy-entry',
				entry: {
					id: `salvage:${commit.runId}`,
					kind: 'salvage',
					amount: commit.bankedSalvage,
					note: `${commit.bankedSalvage} field salvage settled after ${commit.stageId}.`,
				},
			});
		}
		for (const drop of result.rewardDrops ?? []) {
			commands.push({
				type: 'record-economy-entry',
				entry: rewardEconomyEntry(result.stageId, drop, this.world.getState().transitionSequence),
			});
		}
		if (commands.length === 0) {
			return { ok: true, changed: false, salvageCredchips: 0, rewardResults: [] };
		}
		const transaction = this.world.executeTransaction(commands);
		if (!transaction.ok) {
			if (transaction.reason === 'expedition-already-committed') {
				return {
					ok: true,
					changed: false,
					salvageCredchips: 0,
					rewardResults: [],
				};
			}
			return {
				ok: false,
				changed: false,
				salvageCredchips: 0,
				worldResult: {
					ok: false,
					reason: transaction.reason,
					state: transaction.state,
				},
				rewardResults: [],
			};
		}
		return {
			ok: true,
			changed: true,
			salvageCredchips: commit?.bankedSalvage ?? 0,
			worldResult: { ok: true, events: transaction.events, state: transaction.state },
			rewardResults: [],
		};
	}
}

export function createExpeditionCommit(input: {
	runId: string;
	stageId: string;
	inventory: readonly { itemId: string; quantity: number }[];
	equippedItemIds: readonly string[];
	itemStates: ExpeditionCommit['itemStates'];
	integrity: number;
	maxIntegrity: number;
	injuries: number;
	bankedSalvage?: number;
}): ExpeditionCommit {
	return {
		runId: input.runId,
		stageId: input.stageId,
		inventory: input.inventory.map((stack) => ({ ...stack })),
		equippedItemIds: [...input.equippedItemIds],
		itemStates: Object.fromEntries(
			Object.entries(input.itemStates).map(([itemId, state]) => [itemId, { ...state }])
		),
		integrity: Math.max(1, Math.min(input.maxIntegrity, Math.floor(input.integrity))),
		maxIntegrity: Math.max(1, Math.floor(input.maxIntegrity)),
		injuries: Math.max(0, Math.floor(input.injuries)),
		bankedSalvage: Math.max(0, Math.floor(input.bankedSalvage ?? 0)),
	};
}

function rewardEconomyEntry(
	stageId: string,
	drop: DroppedItem,
	sequence: number
): Omit<import('./ExpeditionLedger').AdventureEconomyEntry, 'sequence'> {
	return {
		id: `reward:${stageId}:${drop.itemId}:${sequence}`,
		kind: 'reward',
		amount: 0,
		itemId: drop.itemId,
		note: `${drop.quantity} × ${drop.itemId} entered persistent inventory from ${drop.tableId}.`,
	};
}

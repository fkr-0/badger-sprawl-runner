import {
	createDeterministicRng,
	rngRange,
	type DeterministicRngState,
} from '@badger/platformer-core';

export interface DropEntry {
	itemId: string;
	weight: number;
	minQuantity: number;
	maxQuantity: number;
	requiresTag?: string;
}

export interface DropTable {
	id: string;
	entries: DropEntry[];
	guaranteed?: DropEntry[];
}

export interface DropContext {
	seed: string;
	runId: string;
	sourceId: string;
	sourceTags?: string[];
	luck?: number;
}

export interface DroppedItem {
	itemId: string;
	quantity: number;
	sourceId: string;
	tableId: string;
}

function rollInt(state: DeterministicRngState, min: number, max: number): { state: DeterministicRngState; value: number } {
	const roll = rngRange(state, min, max + 1);
	return { state: roll.state, value: Math.floor(roll.value) };
}

function allowed(entry: DropEntry, context: DropContext): boolean {
	return !entry.requiresTag || Boolean(context.sourceTags?.includes(entry.requiresTag));
}

function weightedPick(state: DeterministicRngState, entries: readonly DropEntry[], luck = 0): { state: DeterministicRngState; value: DropEntry | null } {
	const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight + luck), 0);
	if (total <= 0) return { state, value: null };
	const roll = rngRange(state, 0, total);
	let cursor = roll.value;
	for (const entry of entries) {
		cursor -= Math.max(0, entry.weight + luck);
		if (cursor <= 0) return { state: roll.state, value: entry };
	}
	return { state: roll.state, value: entries.at(-1) ?? null };
}

function materialize(entry: DropEntry, state: DeterministicRngState, context: DropContext, table: DropTable): { state: DeterministicRngState; value: DroppedItem } {
	const quantity = rollInt(state, entry.minQuantity, entry.maxQuantity);
	return {
		state: quantity.state,
		value: {
			itemId: entry.itemId,
			quantity: quantity.value,
			sourceId: context.sourceId,
			tableId: table.id,
		},
	};
}

export function rollDropTable(table: DropTable, context: DropContext, rolls = 1): DroppedItem[] {
	let state = createDeterministicRng(`${context.seed}:${context.runId}:${context.sourceId}:${table.id}`);
	const drops: DroppedItem[] = [];

	for (const entry of table.guaranteed ?? []) {
		if (!allowed(entry, context)) continue;
		const drop = materialize(entry, state, context, table);
		state = drop.state;
		drops.push(drop.value);
	}

	const entries = table.entries.filter((entry) => allowed(entry, context));
	for (let index = 0; index < rolls; index += 1) {
		const picked = weightedPick(state, entries, context.luck ?? 0);
		state = picked.state;
		if (!picked.value) continue;
		const drop = materialize(picked.value, state, context, table);
		state = drop.state;
		drops.push(drop.value);
	}

	return drops;
}

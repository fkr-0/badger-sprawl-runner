import type { AdventureInventoryStack } from './AdventureState';

export interface AdventureItemState {
	condition: number;
	maxCondition: number;
	modificationId?: string;
	repairCount: number;
}

export interface AdventureExpeditionState {
	integrity: number;
	maxIntegrity: number;
	injuries: number;
	completedRuns: number;
	lastStageId?: string;
	settledRunIds: string[];
}

export type EconomyEntryKind =
	| 'purchase'
	| 'repair'
	| 'modification'
	| 'clinic'
	| 'greenhouse'
	| 'salvage'
	| 'reward';

export interface AdventureEconomyEntry {
	id: string;
	sequence: number;
	kind: EconomyEntryKind;
	amount: number;
	locationId?: string;
	itemId?: string;
	note: string;
}

export interface AdventureEconomyState {
	spentCredchips: number;
	serviceSpend: number;
	purchaseCount: number;
	repairCount: number;
	clinicVisits: number;
	rewardItemCount: number;
	earnedCredchips: number;
	journal: AdventureEconomyEntry[];
}

export interface ExpeditionLaunchState {
	runId: string;
	inventory: AdventureInventoryStack[];
	equippedItemIds: string[];
	itemStates: Record<string, AdventureItemState>;
	integrity: number;
	maxIntegrity: number;
	injuries: number;
}

export interface ExpeditionCommit {
	runId: string;
	stageId: string;
	inventory: AdventureInventoryStack[];
	equippedItemIds: string[];
	itemStates: Record<string, AdventureItemState>;
	integrity: number;
	maxIntegrity: number;
	injuries: number;
	bankedSalvage: number;
}

export const DEFAULT_ITEM_CONDITION = 100;
export const DEFAULT_MAX_INTEGRITY = 5;
export const ECONOMY_JOURNAL_LIMIT = 64;

export function createDefaultItemState(
	overrides: Partial<AdventureItemState> = {}
): AdventureItemState {
	const maxCondition = positiveInteger(overrides.maxCondition, DEFAULT_ITEM_CONDITION);
	return {
		condition: boundedInteger(overrides.condition, maxCondition, 0, maxCondition),
		maxCondition,
		modificationId: nonEmptyString(overrides.modificationId),
		repairCount: nonNegativeInteger(overrides.repairCount, 0),
	};
}

export function createDefaultExpeditionState(
	overrides: Partial<AdventureExpeditionState> = {}
): AdventureExpeditionState {
	const maxIntegrity = positiveInteger(overrides.maxIntegrity, DEFAULT_MAX_INTEGRITY);
	return {
		integrity: boundedInteger(overrides.integrity, maxIntegrity, 1, maxIntegrity),
		maxIntegrity,
		injuries: nonNegativeInteger(overrides.injuries, 0),
		completedRuns: nonNegativeInteger(overrides.completedRuns, 0),
		lastStageId: nonEmptyString(overrides.lastStageId),
		settledRunIds: stringArray(overrides.settledRunIds),
	};
}

export function createDefaultEconomyState(
	overrides: Partial<AdventureEconomyState> = {}
): AdventureEconomyState {
	return {
		spentCredchips: nonNegativeInteger(overrides.spentCredchips, 0),
		serviceSpend: nonNegativeInteger(overrides.serviceSpend, 0),
		purchaseCount: nonNegativeInteger(overrides.purchaseCount, 0),
		repairCount: nonNegativeInteger(overrides.repairCount, 0),
		clinicVisits: nonNegativeInteger(overrides.clinicVisits, 0),
		rewardItemCount: nonNegativeInteger(overrides.rewardItemCount, 0),
		earnedCredchips: nonNegativeInteger(overrides.earnedCredchips, 0),
		journal: sanitizeEconomyJournal(overrides.journal),
	};
}

export function sanitizeItemStates(value: unknown): Record<string, AdventureItemState> {
	if (!isRecord(value)) return {};
	const result: Record<string, AdventureItemState> = {};
	for (const [itemId, candidate] of Object.entries(value)) {
		if (!isRecord(candidate) || itemId.length === 0) continue;
		result[itemId] = createDefaultItemState({
			condition: candidate.condition as number,
			maxCondition: candidate.maxCondition as number,
			modificationId: candidate.modificationId as string,
			repairCount: candidate.repairCount as number,
		});
	}
	return result;
}

export function sanitizeExpeditionState(value: unknown): AdventureExpeditionState {
	if (!isRecord(value)) return createDefaultExpeditionState();
	return createDefaultExpeditionState({
		integrity: value.integrity as number,
		maxIntegrity: value.maxIntegrity as number,
		injuries: value.injuries as number,
		completedRuns: value.completedRuns as number,
		lastStageId: value.lastStageId as string,
		settledRunIds: value.settledRunIds as string[],
	});
}

export function sanitizeEconomyState(value: unknown): AdventureEconomyState {
	if (!isRecord(value)) return createDefaultEconomyState();
	return createDefaultEconomyState({
		spentCredchips: value.spentCredchips as number,
		serviceSpend: value.serviceSpend as number,
		purchaseCount: value.purchaseCount as number,
		repairCount: value.repairCount as number,
		clinicVisits: value.clinicVisits as number,
		rewardItemCount: value.rewardItemCount as number,
		earnedCredchips: value.earnedCredchips as number,
		journal: value.journal as AdventureEconomyEntry[],
	});
}

export function buildExpeditionLaunchState(state: {
	inventory: AdventureInventoryStack[];
	equippedItemIds: string[];
	itemStates: Record<string, AdventureItemState>;
	expedition: AdventureExpeditionState;
}, runId = `expedition:${state.expedition.completedRuns + 1}`): ExpeditionLaunchState {
	const owned = new Set(state.inventory.filter((stack) => stack.quantity > 0).map((stack) => stack.itemId));
	const itemStates = normalizeOwnedItemStates(state.inventory, state.itemStates);
	return {
		runId,
		inventory: state.inventory.map((stack) => ({ ...stack })),
		equippedItemIds: state.equippedItemIds.filter(
			(itemId) => owned.has(itemId) && (itemStates[itemId]?.condition ?? DEFAULT_ITEM_CONDITION) > 0
		),
		itemStates,
		integrity: state.expedition.integrity,
		maxIntegrity: state.expedition.maxIntegrity,
		injuries: state.expedition.injuries,
	};
}

export function normalizeOwnedItemStates(
	inventory: readonly AdventureInventoryStack[],
	itemStates: Readonly<Record<string, AdventureItemState>>
): Record<string, AdventureItemState> {
	return Object.fromEntries(
		inventory
			.filter((stack) => stack.quantity > 0)
			.map((stack) => [stack.itemId, createDefaultItemState(itemStates[stack.itemId])])
	);
}

export function degradeEquippedItems(
	itemStates: Readonly<Record<string, AdventureItemState>>,
	equippedItemIds: readonly string[],
	wear: number
): Record<string, AdventureItemState> {
	const equipped = new Set(equippedItemIds);
	return Object.fromEntries(
		Object.entries(itemStates).map(([itemId, state]) => {
			const normalized = createDefaultItemState(state);
			if (!equipped.has(itemId) || itemId === 'claws') return [itemId, normalized];
			return [
				itemId,
				{
					...normalized,
					condition: Math.max(0, normalized.condition - Math.max(0, Math.floor(wear))),
				},
			];
		})
	);
}

function sanitizeEconomyJournal(value: unknown): AdventureEconomyEntry[] {
	if (!Array.isArray(value)) return [];
	return value
		.filter(isRecord)
		.map((entry) => ({
			id: typeof entry.id === 'string' ? entry.id : '',
			sequence: nonNegativeInteger(entry.sequence, 0),
			kind: isEconomyKind(entry.kind) ? entry.kind : 'reward',
			amount: nonNegativeInteger(entry.amount, 0),
			locationId: nonEmptyString(entry.locationId),
			itemId: nonEmptyString(entry.itemId),
			note: typeof entry.note === 'string' ? entry.note : '',
		}))
		.filter((entry) => entry.id.length > 0)
		.slice(-ECONOMY_JOURNAL_LIMIT);
}

function isEconomyKind(value: unknown): value is EconomyEntryKind {
	return ['purchase', 'repair', 'modification', 'clinic', 'greenhouse', 'salvage', 'reward'].includes(
		String(value)
	);
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? [...new Set(value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))]
		: [];
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.min(maximum, Math.max(minimum, Math.trunc(value)))
		: fallback;
}

function positiveInteger(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0
		? Math.floor(value)
		: fallback;
}

function nonNegativeInteger(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.max(0, Math.floor(value))
		: fallback;
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

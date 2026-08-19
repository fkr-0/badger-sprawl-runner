import { normalizeArcadeSpriteManifest } from '@arcade/runtime/sprites';
import type { SpriteManifest, SpriteSheet } from './types';

export interface SpriteSheetContractChange {
	id: string;
	previous: SpriteSheet;
	next: SpriteSheet;
	previousKey: string;
	nextKey: string;
}

export interface SpriteManifestContractDiff {
	previous: SpriteManifest | null;
	next: SpriteManifest;
	addedSheetIds: readonly string[];
	removedSheetIds: readonly string[];
	changedSheetIds: readonly string[];
	unchangedSheetIds: readonly string[];
	changes: readonly SpriteSheetContractChange[];
}

function canonicalJson(value: unknown, seen = new Set<object>()): string {
	if (value === null) return 'null';
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return Number.isFinite(value) ? JSON.stringify(value) : 'null';
	if (typeof value === 'bigint')
		throw new TypeError('Sprite contracts cannot contain bigint values.');
	if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') {
		return 'null';
	}
	if (typeof value !== 'object') return JSON.stringify(String(value));
	if (seen.has(value))
		throw new TypeError('Sprite contracts must not contain circular references.');
	seen.add(value);
	try {
		if (Array.isArray(value)) {
			return `[${value.map((item) => canonicalJson(item, seen)).join(',')}]`;
		}
		const record = value as Record<string, unknown>;
		const entries = Object.keys(record)
			.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
			.filter((key) => {
				const item = record[key];
				return (
					typeof item !== 'undefined' && typeof item !== 'function' && typeof item !== 'symbol'
				);
			})
			.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key], seen)}`);
		return `{${entries.join(',')}}`;
	} finally {
		seen.delete(value);
	}
}

function normalizeSheet(sheet: SpriteSheet): SpriteSheet {
	return normalizeArcadeSpriteManifest({ version: '1.0.0', sheets: [sheet] })
		.sheets[0] as SpriteSheet;
}

/**
 * Return a deterministic, order-insensitive key for every JSON-safe field in
 * a normalized sprite-sheet contract, including source revision metadata.
 */
export function createSpriteSheetContractKey(sheet: SpriteSheet): string {
	return canonicalJson(normalizeSheet(sheet));
}

/** Return a deterministic key for a complete normalized manifest. */
export function createSpriteManifestContractKey(manifestSource: unknown): string {
	return canonicalJson(normalizeArcadeSpriteManifest(manifestSource));
}

/**
 * Compare manifests by sheet id and canonical contract content. Added,
 * changed, and unchanged ids follow next-manifest order; removals follow the
 * previous manifest order.
 */
export function diffSpriteManifests(
	previousSource: unknown | null | undefined,
	nextSource: unknown
): SpriteManifestContractDiff {
	const previous =
		previousSource == null
			? null
			: (normalizeArcadeSpriteManifest(previousSource) as SpriteManifest);
	const next = normalizeArcadeSpriteManifest(nextSource) as SpriteManifest;
	const previousById = new Map(previous?.sheets.map((sheet) => [sheet.id, sheet] as const) ?? []);
	const nextById = new Map(next.sheets.map((sheet) => [sheet.id, sheet] as const));
	const previousKeys = new Map(
		previous?.sheets.map((sheet) => [sheet.id, createSpriteSheetContractKey(sheet)] as const) ?? []
	);
	const nextKeys = new Map(
		next.sheets.map((sheet) => [sheet.id, createSpriteSheetContractKey(sheet)] as const)
	);
	const addedSheetIds: string[] = [];
	const changedSheetIds: string[] = [];
	const unchangedSheetIds: string[] = [];
	const changes: SpriteSheetContractChange[] = [];

	for (const sheet of next.sheets) {
		const previousSheet = previousById.get(sheet.id);
		if (!previousSheet) {
			addedSheetIds.push(sheet.id);
			continue;
		}
		const previousKey = previousKeys.get(sheet.id) as string;
		const nextKey = nextKeys.get(sheet.id) as string;
		if (previousKey === nextKey) {
			unchangedSheetIds.push(sheet.id);
			continue;
		}
		changedSheetIds.push(sheet.id);
		changes.push(
			Object.freeze({
				id: sheet.id,
				previous: previousSheet,
				next: sheet,
				previousKey,
				nextKey,
			})
		);
	}

	const removedSheetIds =
		previous?.sheets.filter((sheet) => !nextById.has(sheet.id)).map((sheet) => sheet.id) ?? [];

	return Object.freeze({
		previous,
		next,
		addedSheetIds: Object.freeze(addedSheetIds),
		removedSheetIds: Object.freeze(removedSheetIds),
		changedSheetIds: Object.freeze(changedSheetIds),
		unchangedSheetIds: Object.freeze(unchangedSheetIds),
		changes: Object.freeze(changes),
	});
}

export interface SpriteSheetContractKeyEntry {
	sheetId: string;
	key: string;
}

export interface SpriteManifestReloadPlanOptions {
	availableSheetIds?: Iterable<string>;
	forceReloadSheetIds?: Iterable<string>;
	reuseUnchanged?: boolean;
}

export interface SpriteManifestReloadPlan {
	diff: SpriteManifestContractDiff;
	reuseUnchanged: boolean;
	availableSheetIds: readonly string[];
	forcedReloadSheetIds: readonly string[];
	reusableSheetIds: readonly string[];
	reloadSheetIds: readonly string[];
	evictedSheetIds: readonly string[];
	nextContractKeys: readonly SpriteSheetContractKeyEntry[];
}

/**
 * Create a side-effect-free reload plan from semantic manifest changes and
 * the decoded sheet ids currently available to a renderer.
 */
export function createSpriteManifestReloadPlan(
	previousSource: unknown | null | undefined,
	nextSource: unknown,
	options: SpriteManifestReloadPlanOptions = {}
): SpriteManifestReloadPlan {
	const diff = diffSpriteManifests(previousSource, nextSource);
	const reuseUnchanged = options.reuseUnchanged ?? true;
	const available = new Set(options.availableSheetIds ?? []);
	const forced = new Set(options.forceReloadSheetIds ?? []);
	const unchanged = new Set(diff.unchangedSheetIds);
	const availableSheetIds = diff.next.sheets
		.filter((sheet) => available.has(sheet.id))
		.map((sheet) => sheet.id);
	const forcedReloadSheetIds = diff.next.sheets
		.filter((sheet) => forced.has(sheet.id))
		.map((sheet) => sheet.id);
	const reusableSheetIds = diff.next.sheets
		.filter(
			(sheet) =>
				reuseUnchanged &&
				unchanged.has(sheet.id) &&
				available.has(sheet.id) &&
				!forced.has(sheet.id)
		)
		.map((sheet) => sheet.id);
	const reusable = new Set(reusableSheetIds);
	const reloadSheetIds = diff.next.sheets
		.filter((sheet) => !reusable.has(sheet.id))
		.map((sheet) => sheet.id);
	const nextContractKeys = diff.next.sheets.map((sheet) =>
		Object.freeze({ sheetId: sheet.id, key: createSpriteSheetContractKey(sheet) })
	);

	return Object.freeze({
		diff,
		reuseUnchanged,
		availableSheetIds: Object.freeze(availableSheetIds),
		forcedReloadSheetIds: Object.freeze(forcedReloadSheetIds),
		reusableSheetIds: Object.freeze(reusableSheetIds),
		reloadSheetIds: Object.freeze(reloadSheetIds),
		evictedSheetIds: diff.removedSheetIds,
		nextContractKeys: Object.freeze(nextContractKeys),
	});
}

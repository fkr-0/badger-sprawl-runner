import { normalizeArcadeSpriteManifest } from '../../../vendor/arcade-runtime.mjs';
function canonicalJson(value, seen = new Set()) {
    if (value === null)
        return 'null';
    if (typeof value === 'string')
        return JSON.stringify(value);
    if (typeof value === 'boolean')
        return value ? 'true' : 'false';
    if (typeof value === 'number')
        return Number.isFinite(value) ? JSON.stringify(value) : 'null';
    if (typeof value === 'bigint')
        throw new TypeError('Sprite contracts cannot contain bigint values.');
    if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') {
        return 'null';
    }
    if (typeof value !== 'object')
        return JSON.stringify(String(value));
    if (seen.has(value))
        throw new TypeError('Sprite contracts must not contain circular references.');
    seen.add(value);
    try {
        if (Array.isArray(value)) {
            return `[${value.map((item) => canonicalJson(item, seen)).join(',')}]`;
        }
        const record = value;
        const entries = Object.keys(record)
            .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
            .filter((key) => {
            const item = record[key];
            return (typeof item !== 'undefined' && typeof item !== 'function' && typeof item !== 'symbol');
        })
            .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key], seen)}`);
        return `{${entries.join(',')}}`;
    }
    finally {
        seen.delete(value);
    }
}
function normalizeSheet(sheet) {
    return normalizeArcadeSpriteManifest({ version: '1.0.0', sheets: [sheet] })
        .sheets[0];
}
/**
 * Return a deterministic, order-insensitive key for every JSON-safe field in
 * a normalized sprite-sheet contract, including source revision metadata.
 */
export function createSpriteSheetContractKey(sheet) {
    return canonicalJson(normalizeSheet(sheet));
}
/** Return a deterministic key for a complete normalized manifest. */
export function createSpriteManifestContractKey(manifestSource) {
    return canonicalJson(normalizeArcadeSpriteManifest(manifestSource));
}
/**
 * Compare manifests by sheet id and canonical contract content. Added,
 * changed, and unchanged ids follow next-manifest order; removals follow the
 * previous manifest order.
 */
export function diffSpriteManifests(previousSource, nextSource) {
    const previous = previousSource == null
        ? null
        : normalizeArcadeSpriteManifest(previousSource);
    const next = normalizeArcadeSpriteManifest(nextSource);
    const previousById = new Map(previous?.sheets.map((sheet) => [sheet.id, sheet]) ?? []);
    const nextById = new Map(next.sheets.map((sheet) => [sheet.id, sheet]));
    const previousKeys = new Map(previous?.sheets.map((sheet) => [sheet.id, createSpriteSheetContractKey(sheet)]) ?? []);
    const nextKeys = new Map(next.sheets.map((sheet) => [sheet.id, createSpriteSheetContractKey(sheet)]));
    const addedSheetIds = [];
    const changedSheetIds = [];
    const unchangedSheetIds = [];
    const changes = [];
    for (const sheet of next.sheets) {
        const previousSheet = previousById.get(sheet.id);
        if (!previousSheet) {
            addedSheetIds.push(sheet.id);
            continue;
        }
        const previousKey = previousKeys.get(sheet.id);
        const nextKey = nextKeys.get(sheet.id);
        if (previousKey === nextKey) {
            unchangedSheetIds.push(sheet.id);
            continue;
        }
        changedSheetIds.push(sheet.id);
        changes.push(Object.freeze({
            id: sheet.id,
            previous: previousSheet,
            next: sheet,
            previousKey,
            nextKey,
        }));
    }
    const removedSheetIds = previous?.sheets.filter((sheet) => !nextById.has(sheet.id)).map((sheet) => sheet.id) ?? [];
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
/**
 * Create a side-effect-free reload plan from semantic manifest changes and
 * the decoded sheet ids currently available to a renderer.
 */
export function createSpriteManifestReloadPlan(previousSource, nextSource, options = {}) {
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
        .filter((sheet) => reuseUnchanged &&
        unchanged.has(sheet.id) &&
        available.has(sheet.id) &&
        !forced.has(sheet.id))
        .map((sheet) => sheet.id);
    const reusable = new Set(reusableSheetIds);
    const reloadSheetIds = diff.next.sheets
        .filter((sheet) => !reusable.has(sheet.id))
        .map((sheet) => sheet.id);
    const nextContractKeys = diff.next.sheets.map((sheet) => Object.freeze({ sheetId: sheet.id, key: createSpriteSheetContractKey(sheet) }));
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
//# sourceMappingURL=manifest-diff.js.map
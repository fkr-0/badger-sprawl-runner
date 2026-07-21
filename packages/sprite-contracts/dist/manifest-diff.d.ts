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
/**
 * Return a deterministic, order-insensitive key for every JSON-safe field in
 * a normalized sprite-sheet contract, including source revision metadata.
 */
export declare function createSpriteSheetContractKey(sheet: SpriteSheet): string;
/** Return a deterministic key for a complete normalized manifest. */
export declare function createSpriteManifestContractKey(manifestSource: unknown): string;
/**
 * Compare manifests by sheet id and canonical contract content. Added,
 * changed, and unchanged ids follow next-manifest order; removals follow the
 * previous manifest order.
 */
export declare function diffSpriteManifests(previousSource: unknown | null | undefined, nextSource: unknown): SpriteManifestContractDiff;
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
export declare function createSpriteManifestReloadPlan(previousSource: unknown | null | undefined, nextSource: unknown, options?: SpriteManifestReloadPlanOptions): SpriteManifestReloadPlan;
//# sourceMappingURL=manifest-diff.d.ts.map
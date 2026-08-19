import type { SpriteManifest, SpriteManifestSource } from './types';
/**
 * Compatibility facade over @arcade/runtime's shared sprite-manifest contract.
 * Badger project data is now canonical { version, sheets }; the runtime still
 * accepts legacy { schemaVersion, spriteSheets } callers at migration boundaries.
 * @deprecated Import validateArcadeSpriteManifest from @arcade/runtime/sprites.
 */
export declare function validateSpriteManifest(manifest: unknown): manifest is SpriteManifestSource;
/** @deprecated Import normalizeArcadeSpriteManifest from @arcade/runtime/sprites. */
export declare function normalizeSpriteManifest(manifest: unknown): SpriteManifest;
//# sourceMappingURL=validate.d.ts.map
import type { SpriteManifest, SpriteManifestSource } from './types';
/**
 * Compatibility facade over @arcade/runtime's shared sprite-manifest contract.
 * Accepts both normalized { version, sheets } manifests and Badger's
 * { schemaVersion, spriteSheets } project-data shape.
 */
export declare function validateSpriteManifest(manifest: unknown): manifest is SpriteManifestSource;
export declare function normalizeSpriteManifest(manifest: unknown): SpriteManifest;
//# sourceMappingURL=validate.d.ts.map
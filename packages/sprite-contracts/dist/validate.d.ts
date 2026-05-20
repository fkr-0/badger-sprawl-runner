import type { SpriteManifest, SpriteManifestSource } from './types';
export declare function normalizeSpriteManifest(manifest: unknown): SpriteManifest;
/**
 * Validate sprite manifest structure.
 * Accepts both normalized { version, sheets } manifests and the project runtime
 * data shape { schemaVersion, spriteSheets } used by data/sprites.json.
 */
export declare function validateSpriteManifest(manifest: unknown): manifest is SpriteManifestSource;
//# sourceMappingURL=validate.d.ts.map
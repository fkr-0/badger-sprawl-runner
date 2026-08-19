import {
	normalizeArcadeSpriteManifest,
	validateArcadeSpriteManifest,
} from '@arcade/runtime/sprites';
import type { SpriteManifest, SpriteManifestSource } from './types';

/**
 * Compatibility facade over @arcade/runtime's shared sprite-manifest contract.
 * Badger project data is now canonical { version, sheets }; the runtime still
 * accepts legacy { schemaVersion, spriteSheets } callers at migration boundaries.
 * @deprecated Import validateArcadeSpriteManifest from @arcade/runtime/sprites.
 */
export function validateSpriteManifest(manifest: unknown): manifest is SpriteManifestSource {
	return validateArcadeSpriteManifest(manifest);
}

/** @deprecated Import normalizeArcadeSpriteManifest from @arcade/runtime/sprites. */
export function normalizeSpriteManifest(manifest: unknown): SpriteManifest {
	return normalizeArcadeSpriteManifest(manifest);
}

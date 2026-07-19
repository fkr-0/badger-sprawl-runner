import {
	normalizeArcadeSpriteManifest,
	validateArcadeSpriteManifest,
} from '../../../vendor/arcade-runtime.mjs';
import type { SpriteManifest, SpriteManifestSource } from './types';

/**
 * Compatibility facade over @arcade/runtime's shared sprite-manifest contract.
 * Accepts both normalized { version, sheets } manifests and Badger's
 * { schemaVersion, spriteSheets } project-data shape.
 */
export function validateSpriteManifest(manifest: unknown): manifest is SpriteManifestSource {
	return validateArcadeSpriteManifest(manifest);
}

export function normalizeSpriteManifest(manifest: unknown): SpriteManifest {
	return normalizeArcadeSpriteManifest(manifest);
}

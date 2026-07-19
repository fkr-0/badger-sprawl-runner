import { normalizeArcadeSpriteManifest, validateArcadeSpriteManifest, } from '../../../vendor/arcade-runtime.mjs';
/**
 * Compatibility facade over @arcade/runtime's shared sprite-manifest contract.
 * Accepts both normalized { version, sheets } manifests and Badger's
 * { schemaVersion, spriteSheets } project-data shape.
 */
export function validateSpriteManifest(manifest) {
    return validateArcadeSpriteManifest(manifest);
}
export function normalizeSpriteManifest(manifest) {
    return normalizeArcadeSpriteManifest(manifest);
}
//# sourceMappingURL=validate.js.map
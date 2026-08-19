import { normalizeArcadeSpriteManifest, validateArcadeSpriteManifest, } from '@arcade/runtime/sprites';
/**
 * Compatibility facade over @arcade/runtime's shared sprite-manifest contract.
 * Badger project data is now canonical { version, sheets }; the runtime still
 * accepts legacy { schemaVersion, spriteSheets } callers at migration boundaries.
 * @deprecated Import validateArcadeSpriteManifest from @arcade/runtime/sprites.
 */
export function validateSpriteManifest(manifest) {
    return validateArcadeSpriteManifest(manifest);
}
/** @deprecated Import normalizeArcadeSpriteManifest from @arcade/runtime/sprites. */
export function normalizeSpriteManifest(manifest) {
    return normalizeArcadeSpriteManifest(manifest);
}
//# sourceMappingURL=validate.js.map
/**
 * @badger/sprite-contracts -- Badger-specific sprite loading, playback, inspection,
 * reload planning, and atlas-production tooling layered over @arcade/runtime/sprites.
 * Shared manifest schema/normalization/validation is owned by Arcade Runtime.
 */
export { normalizeArcadeSpriteManifest, validateArcadeSpriteManifest, } from '@arcade/runtime/sprites';
export { validateSpriteManifest, normalizeSpriteManifest } from './validate';
export { bindLoadedSpriteSheet, loadSpriteSheet, SpriteSheetDimensionLoadError } from './loader';
export { advanceSpriteAnimation, createSpriteAnimationPlayback, getSpriteAnimationFrameAddress, getSpriteAnimationProgress, pauseSpriteAnimation, playSpriteAnimation, resumeSpriteAnimation, seekSpriteAnimation, seekSpriteAnimationProgress, setSpriteAnimationSpeed, } from './playback';
export { sampleSpriteAnimation, sampleSpriteAnimationFrame } from './sampling';
export { createSpriteManifestContractKey, createSpriteManifestReloadPlan, createSpriteSheetContractKey, diffSpriteManifests, } from './manifest-diff';
export { createSpriteAnimationTimeline, inspectSpriteAnimation, inspectSpriteSheet, } from './inspection';
export { auditSpriteAtlasDimensions, auditSpriteManifestDimensions, createSpriteAtlasAssemblyPlan, deriveSpriteAtlasLayout, } from './production';
//# sourceMappingURL=index.js.map
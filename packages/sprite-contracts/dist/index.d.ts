/**
 * @badger/sprite-contracts -- Sprite sheet schema, validation, loader
 */
export type { AnimationDef, SpriteAnimationEvent, SpriteBox, SpriteGrid, SpriteSheet, SpriteManifest, SpriteManifestSource, LoadedSheet, } from './types';
export { validateSpriteManifest, normalizeSpriteManifest } from './validate';
export { bindLoadedSpriteSheet, loadSpriteSheet, SpriteSheetDimensionLoadError } from './loader';
export type { SpriteSheetLoadOptions } from './loader';
export { advanceSpriteAnimation, createSpriteAnimationPlayback, getSpriteAnimationFrameAddress, getSpriteAnimationProgress, pauseSpriteAnimation, playSpriteAnimation, resumeSpriteAnimation, seekSpriteAnimation, seekSpriteAnimationProgress, setSpriteAnimationSpeed, } from './playback';
export type { AdvanceSpriteAnimationOptions, PlaySpriteAnimationOptions, SpriteAnimationPlaybackOptions, SpriteAnimationPlaybackState, SpriteAnimationPlaybackStep, SeekSpriteAnimationOptions, } from './playback';
export { sampleSpriteAnimation, sampleSpriteAnimationFrame } from './sampling';
export type { SpriteAnimationSample, SpriteAnimationSampleOptions } from './sampling';
export { createSpriteManifestContractKey, createSpriteManifestReloadPlan, createSpriteSheetContractKey, diffSpriteManifests, } from './manifest-diff';
export type { SpriteManifestContractDiff, SpriteManifestReloadPlan, SpriteManifestReloadPlanOptions, SpriteSheetContractChange, SpriteSheetContractKeyEntry, } from './manifest-diff';
export { createSpriteAnimationTimeline, inspectSpriteAnimation, inspectSpriteSheet, } from './inspection';
export type { SpriteAnimationInspection, SpriteAnimationSummary, SpriteAnimationTimeline, SpriteAnimationTimelineFrame, SpriteSheetInspection, } from './inspection';
export { auditSpriteAtlasDimensions, auditSpriteManifestDimensions, createSpriteAtlasAssemblyPlan, deriveSpriteAtlasLayout, } from './production';
export type { SpriteAtlasAnimationLayout, SpriteAtlasAssemblyPlan, SpriteAtlasCellPlan, SpriteAtlasDiagnostic, SpriteAtlasDiagnosticSeverity, SpriteAtlasDimensionAuditOptions, SpriteAtlasDimensionResolver, SpriteAtlasDimensions, SpriteAtlasFrameReference, SpriteAtlasLayout, SpriteAtlasLayoutMode, SpriteManifestDimensionAudit, SpriteSheetDimensionAudit, } from './production';
//# sourceMappingURL=index.d.ts.map
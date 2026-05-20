/**
 * @badger/sprite-contracts -- Sprite sheet schema, validation, loader
 */

export type {
	AnimationDef,
	SpriteAnimationEvent,
	SpriteBox,
	SpriteGrid,
	SpriteSheet,
	SpriteManifest,
	SpriteManifestSource,
	LoadedSheet,
} from './types';
export { validateSpriteManifest, normalizeSpriteManifest } from './validate';
export { loadSpriteSheet } from './loader';

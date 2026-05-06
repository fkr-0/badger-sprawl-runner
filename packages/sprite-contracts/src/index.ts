/**
 * @badger/sprite-contracts -- Sprite sheet schema, validation, loader
 */

export type { SpriteSheet, SpriteManifest, LoadedSheet, AnimationDef } from './types';
export { validateSpriteManifest } from './validate';
export { loadSpriteSheet } from './loader';

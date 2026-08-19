import type {
	ArcadeSpriteAnimation,
	ArcadeSpriteAnimationEvent,
	ArcadeSpriteBox,
	ArcadeSpriteGrid,
	ArcadeSpriteManifest,
	ArcadeSpriteManifestSource,
	ArcadeSpriteSheet,
} from '@arcade/runtime/sprites';

/** @deprecated Import ArcadeSpriteBox from the shared runtime for new code. */
export type SpriteBox = ArcadeSpriteBox;
/** @deprecated Import ArcadeSpriteAnimationEvent from the shared runtime for new code. */
export type SpriteAnimationEvent = ArcadeSpriteAnimationEvent;
/** @deprecated Import ArcadeSpriteGrid from the shared runtime for new code. */
export type SpriteGrid = ArcadeSpriteGrid;
/** @deprecated Import ArcadeSpriteAnimation from the shared runtime for new code. */
export type AnimationDef = ArcadeSpriteAnimation;
/** @deprecated Import ArcadeSpriteSheet from the shared runtime for new code. */
export type SpriteSheet = ArcadeSpriteSheet;
/** @deprecated Import ArcadeSpriteManifest from the shared runtime for new code. */
export type SpriteManifest = ArcadeSpriteManifest;
/** @deprecated Import ArcadeSpriteManifestSource from the shared runtime for new code. */
export type SpriteManifestSource = ArcadeSpriteManifestSource;

/**
 * Browser-owned image handle retained by Badger while manifest, addressing,
 * clip, and event semantics live in @arcade/runtime.
 */
export interface LoadedSheet {
	sheet: SpriteSheet;
	image: HTMLImageElement;
	drawFrame(
		ctx: CanvasRenderingContext2D,
		animName: string,
		frame: number,
		x: number,
		y: number,
		flipX?: boolean
	): void;
}

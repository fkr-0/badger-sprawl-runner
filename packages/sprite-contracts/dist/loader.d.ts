import type { LoadedSheet, SpriteSheet } from './types';
declare function getOrderedFrame(sheet: SpriteSheet, animName: string, frameIndex: number): number | null;
declare function getFrameSource(sheet: SpriteSheet, animName: string, frameIndex: number): [number, number] | null;
/**
 * Load a sprite sheet from a sheet definition.
 * Supports both row-per-animation sheets and explicit grid/order sheets.
 */
export declare function loadSpriteSheet(sheet: SpriteSheet, ctx: CanvasRenderingContext2D): Promise<LoadedSheet>;
export declare const __spriteLoaderInternals: {
    getFrameSource: typeof getFrameSource;
    getOrderedFrame: typeof getOrderedFrame;
};
export {};
//# sourceMappingURL=loader.d.ts.map
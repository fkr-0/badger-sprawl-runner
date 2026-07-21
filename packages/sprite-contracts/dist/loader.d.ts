import { type SpriteSheetDimensionAudit } from './production';
import type { LoadedSheet, SpriteSheet } from './types';
export interface SpriteSheetLoadOptions {
    signal?: AbortSignal;
    validateDimensions?: boolean;
    imageFactory?: () => HTMLImageElement;
}
export declare class SpriteSheetDimensionLoadError extends Error {
    readonly audit: SpriteSheetDimensionAudit;
    constructor(audit: SpriteSheetDimensionAudit);
}
declare function getOrderedFrame(sheet: SpriteSheet, animName: string, frameIndex: number): number | null;
declare function getFrameSource(sheet: SpriteSheet, animName: string, frameIndex: number): [number, number] | null;
/** Bind an already-decoded image to a normalized sprite-sheet contract. */
export declare function bindLoadedSpriteSheet(sheet: SpriteSheet, image: HTMLImageElement): LoadedSheet;
/**
 * Browser image loading remains consumer-owned for this migration step. Frame
 * addressing is delegated to @arcade/runtime so Canvas and future Pixi paths
 * consume the same sheet/grid/order contract.
 */
export declare function loadSpriteSheet(sheet: SpriteSheet, ctx: CanvasRenderingContext2D, options?: SpriteSheetLoadOptions): Promise<LoadedSheet>;
export declare const __spriteLoaderInternals: {
    getFrameSource: typeof getFrameSource;
    getOrderedFrame: typeof getOrderedFrame;
};
export {};
//# sourceMappingURL=loader.d.ts.map
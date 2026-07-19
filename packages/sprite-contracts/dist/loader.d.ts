import type { LoadedSheet, SpriteSheet } from './types';
declare function getOrderedFrame(sheet: SpriteSheet, animName: string, frameIndex: number): number | null;
declare function getFrameSource(sheet: SpriteSheet, animName: string, frameIndex: number): [number, number] | null;
/**
 * Browser image loading remains consumer-owned for this migration step. Frame
 * addressing is delegated to @arcade/runtime so Canvas and future Pixi paths
 * consume the same sheet/grid/order contract.
 */
export declare function loadSpriteSheet(sheet: SpriteSheet, ctx: CanvasRenderingContext2D): Promise<LoadedSheet>;
export declare const __spriteLoaderInternals: {
    getFrameSource: typeof getFrameSource;
    getOrderedFrame: typeof getOrderedFrame;
};
export {};
//# sourceMappingURL=loader.d.ts.map
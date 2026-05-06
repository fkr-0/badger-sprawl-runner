export interface SpriteSheet {
    id: string;
    file: string;
    frameSize: [number, number];
    animations: Record<string, {
        frames: number;
        fps: number;
    }>;
}
export interface SpriteManifest {
    version: string;
    sheets: SpriteSheet[];
}
export interface LoadedSheet {
    sheet: SpriteSheet;
    image: HTMLImageElement;
    drawFrame(ctx: CanvasRenderingContext2D, animName: string, frame: number, x: number, y: number, flipX?: boolean): void;
}
export type AnimationDef = SpriteSheet['animations'][string];
//# sourceMappingURL=types.d.ts.map
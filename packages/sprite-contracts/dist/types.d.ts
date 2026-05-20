export interface SpriteBox {
    x: number;
    y: number;
    w: number;
    h: number;
    label?: string;
}
export interface SpriteAnimationEvent {
    frame: number;
    kind: string;
    name?: string;
    payload?: Record<string, unknown>;
}
export interface SpriteGrid {
    columns: number;
    rows: number;
}
export interface AnimationDef {
    frames: number;
    fps: number;
    order?: number[];
    loop?: boolean;
    anchor?: [number, number];
    hitboxes?: SpriteBox[];
    hurtboxes?: SpriteBox[];
    events?: SpriteAnimationEvent[];
    tags?: string[];
}
export interface SpriteSheet {
    id: string;
    file: string;
    frameSize: [number, number];
    grid?: SpriteGrid;
    animations: Record<string, AnimationDef>;
    source?: Record<string, unknown>;
}
export interface SpriteManifest {
    version: string;
    sheets: SpriteSheet[];
}
export interface SpriteManifestSource {
    version?: string;
    schemaVersion?: string | number;
    sheets?: SpriteSheet[];
    spriteSheets?: SpriteSheet[];
    baseGrid?: number;
}
export interface LoadedSheet {
    sheet: SpriteSheet;
    image: HTMLImageElement;
    drawFrame(ctx: CanvasRenderingContext2D, animName: string, frame: number, x: number, y: number, flipX?: boolean): void;
}
//# sourceMappingURL=types.d.ts.map
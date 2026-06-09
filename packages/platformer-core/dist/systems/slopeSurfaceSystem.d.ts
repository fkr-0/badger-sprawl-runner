import type { Rect } from '../types';
export interface SlopeSegment {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    materialId: string;
}
export interface SlopeMaterial {
    id: string;
    traction: number;
    slideMultiplier?: number;
}
export interface SlopeSampleInput {
    x: number;
    slopes: ReadonlyArray<SlopeSegment>;
    materials?: ReadonlyArray<SlopeMaterial>;
    gravity?: number;
}
export interface SlopeSample {
    slopeId: string;
    materialId: string;
    y: number;
    normalX: number;
    normalY: number;
    slideForce: number;
    tractionModifier: number;
}
export interface SlopeWalkerState extends Rect {
    vx: number;
    vy: number;
    onGround: boolean;
}
export interface SlopeWalkInput<T extends SlopeWalkerState> {
    body: T;
    slopes: ReadonlyArray<SlopeSegment>;
    materials?: ReadonlyArray<SlopeMaterial>;
    dt: number;
    moveX?: number;
    walkSpeed?: number;
    gravity?: number;
}
export interface SlopeWalkOutput<T extends SlopeWalkerState> {
    body: T;
    sample: SlopeSample | null;
}
export declare function resolveSlopeSurface(input: SlopeSampleInput): SlopeSample | null;
export declare function walkSlopeSurface<T extends SlopeWalkerState>(input: SlopeWalkInput<T>): SlopeWalkOutput<T>;
//# sourceMappingURL=slopeSurfaceSystem.d.ts.map
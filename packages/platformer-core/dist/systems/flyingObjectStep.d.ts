import type { PhysicsParams } from '../PhysicsParams';
export interface FlyingObjectState {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    angularVelocity: number;
    mass?: number;
    radius?: number;
    life?: number;
}
export interface FluidSample {
    density: number;
    flowX: number;
    flowY: number;
    drag: number;
    buoyancy?: number;
    viscosity?: number;
    lift?: number;
}
export interface FluidField {
    readonly id: string;
    sample(x: number, y: number): FluidSample;
}
export interface FluidLayer {
    minY: number;
    maxY: number;
    sample: FluidSample;
}
export interface FlyingObjectStepInput {
    object: FlyingObjectState;
    params: Pick<PhysicsParams, 'gravity' | 'maxFallSpeed'>;
    dt: number;
    gravityScale?: number;
    fluid?: FluidField;
    thrustX?: number;
    thrustY?: number;
    torque?: number;
}
export declare function createUniformFluid(id: string, sample: FluidSample): FluidField;
export declare function createLayeredFluid(id: string, layers: readonly FluidLayer[], fallback?: FluidSample): FluidField;
export declare function combineFluidFields(id: string, fields: readonly FluidField[]): FluidField;
export declare function flyingObjectStep(input: FlyingObjectStepInput): FlyingObjectState;
//# sourceMappingURL=flyingObjectStep.d.ts.map
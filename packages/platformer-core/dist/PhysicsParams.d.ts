export interface PhysicsParams {
    gravity: number;
    jumpVelocity: number;
    maxFallSpeed: number;
    runAccelGround: number;
    runAccelAir: number;
    friction: number;
    maxRunSpeed: number;
    fastFallMultiplier: number;
    coyote: number;
    jumpBuffer: number;
    variableJumpCut: number;
}
export declare const defaultParams: PhysicsParams;
export type { Velocity, MovementState } from './types';
//# sourceMappingURL=PhysicsParams.d.ts.map
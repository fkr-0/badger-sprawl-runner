import type { PhysicsParams } from '../PhysicsParams';
/**
 * Pure function: update velocity and position based on acceleration
 */
export interface MovementStepInput {
    vx: number;
    vy: number;
    x: number;
    y: number;
    onGround: boolean;
    axisInput: number;
    isFastFalling: boolean;
    params: PhysicsParams;
    dt: number;
}
export interface MovementStepOutput {
    vx: number;
    vy: number;
    x: number;
    y: number;
}
export declare function movementStep(input: MovementStepInput): MovementStepOutput;
//# sourceMappingURL=movementStep.d.ts.map
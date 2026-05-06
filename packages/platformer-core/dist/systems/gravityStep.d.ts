import type { PhysicsParams } from '../PhysicsParams';
/**
 * Pure function: apply gravity to velocity
 * Input: current vy, physics params, time delta
 * Output: new vy (capped at maxFallSpeed)
 */
export declare function gravityStep(vy: number, params: Pick<PhysicsParams, 'gravity' | 'maxFallSpeed'>, dt: number): number;
/**
 * Pure function: decay velocity downward and reduce speed
 */
export declare const gravityStepModule: {
    gravityStep: typeof gravityStep;
};
//# sourceMappingURL=gravityStep.d.ts.map
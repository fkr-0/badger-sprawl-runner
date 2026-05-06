import type { PhysicsParams } from '../PhysicsParams';
export interface CoyoteStepInput {
    onGround: boolean;
    coyoteLeft: number;
    jumpBuffered: number;
    params: Pick<PhysicsParams, 'coyote' | 'jumpBuffer'>;
    dt: number;
}
export interface CoyoteStepOutput {
    coyoteLeft: number;
    jumpBuffered: number;
}
/**
 * Pure function: update timers for coyote and jump buffer
 */
export declare function coyoteStep(input: CoyoteStepInput): CoyoteStepOutput;
//# sourceMappingURL=coyoteStep.d.ts.map
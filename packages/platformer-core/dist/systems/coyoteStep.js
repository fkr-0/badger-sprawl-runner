import { createActionGraceState, stepActionGrace, } from '../../../../vendor/arcade-runtime.mjs';
/**
 * Pure function: update timers for coyote and jump buffer
 */
export function coyoteStep(input) {
    const stepped = stepActionGrace(createActionGraceState({
        graceDuration: input.params.coyote,
        bufferDuration: input.params.jumpBuffer,
        graceRemaining: input.coyoteLeft,
        bufferRemaining: input.jumpBuffered,
    }), {
        delta: input.dt,
        available: input.onGround,
        enabled: false,
    });
    return {
        coyoteLeft: stepped.state.graceRemaining,
        jumpBuffered: stepped.state.bufferRemaining,
    };
}
//# sourceMappingURL=coyoteStep.js.map
/**
 * Pure function: update timers for coyote and jump buffer
 */
export function coyoteStep(input) {
    let { onGround, coyoteLeft, jumpBuffered, params, dt } = input;
    // Decrease coyote timer
    coyoteLeft = Math.max(0, coyoteLeft - dt);
    if (onGround) {
        coyoteLeft = params.coyote;
    }
    // Decrease jump buffer
    jumpBuffered = Math.max(0, jumpBuffered - dt);
    return { coyoteLeft, jumpBuffered };
}
//# sourceMappingURL=coyoteStep.js.map
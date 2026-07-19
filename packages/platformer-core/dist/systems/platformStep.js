import { resolveOneWayPlatforms } from '../../../../vendor/arcade-runtime.mjs';
/** Resolve one-way platform landing through the shared arcade collision primitive. */
export function platformStep(input) {
    const { x, y, w, h, vy, prevVy, dt, platforms, coyoteTime } = input;
    const previous = { x, y: y - prevVy * dt, w, h };
    const landing = resolveOneWayPlatforms({
        body: { x, y, w, h, vy },
        previous,
        velocityY: vy,
        tolerance: 6,
        platforms,
    });
    if (!landing)
        return { x, y, onGround: false, coyoteLeft: 0 };
    return {
        x,
        y: landing.y,
        onGround: true,
        coyoteLeft: coyoteTime,
    };
}
//# sourceMappingURL=platformStep.js.map
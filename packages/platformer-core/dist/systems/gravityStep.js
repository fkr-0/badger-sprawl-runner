/**
 * Pure function: apply gravity to velocity
 * Input: current vy, physics params, time delta
 * Output: new vy (capped at maxFallSpeed)
 */
export function gravityStep(vy, params, dt) {
    return Math.min(params.maxFallSpeed, vy + params.gravity * dt);
}
/**
 * Pure function: decay velocity downward and reduce speed
 */
export const gravityStepModule = { gravityStep };
//# sourceMappingURL=gravityStep.js.map
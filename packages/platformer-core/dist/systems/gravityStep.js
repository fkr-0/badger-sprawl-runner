import { integrateAcceleration } from '../../../../vendor/arcade-runtime.mjs';
/** Pure gravity integration delegated to the shared arcade numeric core. */
export function gravityStep(vy, params, dt) {
    return integrateAcceleration(vy, params.gravity, dt, Number.NEGATIVE_INFINITY, params.maxFallSpeed);
}
export const gravityStepModule = { gravityStep };
//# sourceMappingURL=gravityStep.js.map
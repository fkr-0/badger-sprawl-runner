import { integrateAcceleration } from '../../../../vendor/arcade-runtime.mjs';
import type { PhysicsParams } from '../PhysicsParams';

/** Pure gravity integration delegated to the shared arcade numeric core. */
export function gravityStep(
	vy: number,
	params: Pick<PhysicsParams, 'gravity' | 'maxFallSpeed'>,
	dt: number
): number {
	return integrateAcceleration(vy, params.gravity, dt, -Infinity, params.maxFallSpeed);
}

export const gravityStepModule = { gravityStep };

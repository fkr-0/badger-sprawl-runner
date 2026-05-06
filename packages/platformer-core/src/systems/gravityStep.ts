import type { Velocity, PhysicsParams } from '../PhysicsParams';

/**
 * Pure function: apply gravity to velocity
 * Input: current vy, physics params, time delta
 * Output: new vy (capped at maxFallSpeed)
 */
export function gravityStep(
  vy: number,
  params: Pick<PhysicsParams, 'gravity' | 'maxFallSpeed'>,
  dt: number
): number {
  return Math.min(params.maxFallSpeed, vy + params.gravity * dt);
}

/**
 * Pure function: decay velocity downward and reduce speed
 */
export const gravityStepModule = { gravityStep };

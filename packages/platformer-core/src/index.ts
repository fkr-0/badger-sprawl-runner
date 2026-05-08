/**
 * @badger/platformer-core — Pure physics, collision, ECS base
 * Public API: all physics step functions and component types
 */

export { defaultParams, type PhysicsParams } from './PhysicsParams';
export type {
	Transform,
	Velocity,
	MovementState,
	Collider,
	Health,
	HitboxSet,
	ActorFlags,
	Rect,
} from './types';

export { gravityStep } from './systems/gravityStep';
export {
	movementStep,
	type MovementStepInput,
	type MovementStepOutput,
} from './systems/movementStep';
export {
	platformStep,
	type PlatformStepInput,
	type PlatformStepOutput,
} from './systems/platformStep';
export { coyoteStep, type CoyoteStepInput, type CoyoteStepOutput } from './systems/coyoteStep';
export { aabb } from './systems/aabb';

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
export {
	combineFluidFields,
	createLayeredFluid,
	createUniformFluid,
	flyingObjectStep,
	type FluidField,
	type FluidLayer,
	type FluidSample,
	type FlyingObjectState,
	type FlyingObjectStepInput,
} from './systems/flyingObjectStep';
export {
	advanceFixedStep,
	createFixedStepState,
	type FixedStepConfig,
	type FixedStepResult,
	type FixedStepState,
} from './systems/fixedStep';
export {
	createDeterministicRng,
	hashSeed,
	nextRng,
	rngInt,
	rngPick,
	rngRange,
	type DeterministicRngResult,
	type DeterministicRngState,
} from './systems/deterministicRng';
export {
	stepProjectiles,
	type ProjectileHit,
	type ProjectileKind,
	type ProjectileState,
	type ProjectileStepInput,
	type ProjectileStepOutput,
} from './systems/projectileStep';

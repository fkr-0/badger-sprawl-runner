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
	createSeededRandom,
	hashSeed,
	nextRng,
	rngInt,
	rngPick,
	rngRange,
	rngShuffle,
	rngWeightedPick,
	type DeterministicRngResult,
	type DeterministicRngState,
	type SeededRandomSource,
} from './systems/deterministicRng';
export {
	stepProjectiles,
	type ProjectileHit,
	type ProjectileKind,
	type ProjectileState,
	type ProjectileStepInput,
	type ProjectileStepOutput,
} from './systems/projectileStep';
export {
	stepPhysicsWorld,
	type PhysicsActorState,
	type PhysicsMaterialEvent,
	type PhysicsWorldState,
	type PhysicsWorldStepInput,
	type PhysicsWorldStepOutput,
} from './systems/physicsWorldStep';
export {
	DEFAULT_SURFACE_MATERIAL,
	applySurfaceMaterial,
	materialHasTag,
	sampleMaterialContact,
	type MaterialBody,
	type MaterialContact,
	type MaterialStepResult,
	type MaterialZone,
	type SurfaceMaterial,
} from './systems/materialPhysics';
export {
	deterministicHash,
	fnv1a32,
	stableSnapshot,
	stableSnapshotString,
	type SnapshotHashOptions,
	type SnapshotValue,
} from './systems/deterministicSnapshot';
export {
	buildSpatialIndex,
	querySpatialIndex,
	spatialCollisionPairs,
	type SpatialBody,
	type SpatialIndex,
	type SpatialPair,
} from './systems/spatialIndex';
export {
	sweepAabb,
	type SweepHit,
	type SweepInput,
	type SweepResult,
	type SweptObstacle,
} from './systems/sweptAabb';
export {
	solveDistanceConstraints,
	type ConstraintBody,
	type ConstraintStepResult,
	type DistanceConstraint,
} from './systems/physicsConstraints';
export {
	resolveImpulseCollisions,
	type CollisionContact,
	type ImpulseBody,
	type ImpulseEvent,
	type ImpulseResolution,
} from './systems/impulseCollision';
export {
	computeCollisionManifold,
	manifoldsFromSpatialPairs,
	type CollisionManifold,
	type ManifoldBody,
} from './systems/collisionManifold';
export {
	resolveCollisionPipeline,
	type CollisionPipelineBody,
	type CollisionPipelineResult,
} from './systems/physicsCollisionPipeline';
export {
	moveKinematicBody,
	type KinematicBody,
	type KinematicCollision,
	type KinematicMoveInput,
	type KinematicMoveResult,
} from './systems/kinematicMotor';
export {
	hasLineOfSight,
	raycast,
	type RaycastHit,
	type RaycastInput,
	type RaycastObstacle,
} from './systems/raycast';
export {
	stepMovingPlatforms,
	type CarriedBody,
	type MovingPlatformPathPoint,
	type MovingPlatformState,
	type MovingPlatformStepResult,
} from './systems/movingPlatformSystem';
export {
	probeGround,
	type GroundProbeHit,
	type GroundProbeInput,
} from './systems/groundProbe';
export {
	applyWallInteraction,
	detectWallContact,
	type WallContact,
	type WallInteractionParams,
	type WallInteractionResult,
	type WallProbeBody,
} from './systems/wallInteractionSystem';
export {
	resolveLedgeCorrection,
	type LedgeCorrectionEvent,
	type LedgeCorrectionEventKind,
	type LedgeCorrectionInput,
	type LedgeCorrectionOutput,
	type LedgeCorrectionResultKind,
	type LedgeCorrectionVelocity,
} from './systems/ledgeCorrectionSystem';
export {
	resolveSlopeSurface,
	walkSlopeSurface,
	type SlopeMaterial,
	type SlopeSample,
	type SlopeSampleInput,
	type SlopeSegment,
	type SlopeWalkerState,
	type SlopeWalkInput,
	type SlopeWalkOutput,
} from './systems/slopeSurfaceSystem';

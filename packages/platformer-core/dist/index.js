/**
 * @badger/platformer-core — Pure physics, collision, ECS base
 * Public API: all physics step functions and component types
 */
export { defaultParams } from './PhysicsParams';
export { gravityStep } from './systems/gravityStep';
export { movementStep, } from './systems/movementStep';
export { platformStep, } from './systems/platformStep';
export { coyoteStep } from './systems/coyoteStep';
export { aabb } from './systems/aabb';
export { combineFluidFields, createLayeredFluid, createUniformFluid, flyingObjectStep, } from './systems/flyingObjectStep';
export { advanceFixedStep, createFixedStepState, } from './systems/fixedStep';
export { createDeterministicRng, hashSeed, nextRng, rngInt, rngPick, rngRange, } from './systems/deterministicRng';
export { stepProjectiles, } from './systems/projectileStep';
export { stepPhysicsWorld, } from './systems/physicsWorldStep';
export { DEFAULT_SURFACE_MATERIAL, applySurfaceMaterial, materialHasTag, sampleMaterialContact, } from './systems/materialPhysics';
export { deterministicHash, fnv1a32, stableSnapshot, stableSnapshotString, } from './systems/deterministicSnapshot';
export { buildSpatialIndex, querySpatialIndex, spatialCollisionPairs, } from './systems/spatialIndex';
export { sweepAabb, } from './systems/sweptAabb';
export { solveDistanceConstraints, } from './systems/physicsConstraints';
export { resolveImpulseCollisions, } from './systems/impulseCollision';
export { computeCollisionManifold, manifoldsFromSpatialPairs, } from './systems/collisionManifold';
export { resolveCollisionPipeline, } from './systems/physicsCollisionPipeline';
export { moveKinematicBody, } from './systems/kinematicMotor';
export { hasLineOfSight, raycast, } from './systems/raycast';
export { stepMovingPlatforms, } from './systems/movingPlatformSystem';
export { probeGround, } from './systems/groundProbe';
export { applyWallInteraction, detectWallContact, } from './systems/wallInteractionSystem';
export { resolveLedgeCorrection, } from './systems/ledgeCorrectionSystem';
export { resolveSlopeSurface, walkSlopeSurface, } from './systems/slopeSurfaceSystem';
//# sourceMappingURL=index.js.map
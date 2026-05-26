import { buildSpatialIndex, spatialCollisionPairs, type SpatialBody } from './spatialIndex';
import { manifoldsFromSpatialPairs, type CollisionManifold } from './collisionManifold';
import { resolveImpulseCollisions, type ImpulseBody, type ImpulseEvent } from './impulseCollision';

export interface CollisionPipelineBody extends SpatialBody, ImpulseBody {}

export interface CollisionPipelineResult<T extends CollisionPipelineBody> {
	bodies: T[];
	manifolds: CollisionManifold[];
	impulses: ImpulseEvent[];
}

export function resolveCollisionPipeline<T extends CollisionPipelineBody>(
	bodies: readonly T[],
	cellSize: number
): CollisionPipelineResult<T> {
	const index = buildSpatialIndex(bodies, cellSize);
	const pairs = spatialCollisionPairs(index);
	const manifolds = manifoldsFromSpatialPairs(pairs);
	const impulseResult = resolveImpulseCollisions(bodies, manifolds.map((manifold) => ({
		a: manifold.a,
		b: manifold.b,
		normalX: manifold.normalX,
		normalY: manifold.normalY,
		penetration: manifold.penetration,
	})) as Array<{ a: string; b: string; normalX: number; normalY: number; penetration: number }>);

	return {
		bodies: impulseResult.bodies as T[],
		manifolds,
		impulses: impulseResult.events,
	};
}

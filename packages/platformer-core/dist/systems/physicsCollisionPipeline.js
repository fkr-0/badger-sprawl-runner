import { buildSpatialIndex, spatialCollisionPairs } from './spatialIndex';
import { manifoldsFromSpatialPairs } from './collisionManifold';
import { resolveImpulseCollisions } from './impulseCollision';
export function resolveCollisionPipeline(bodies, cellSize) {
    const index = buildSpatialIndex(bodies, cellSize);
    const pairs = spatialCollisionPairs(index);
    const manifolds = manifoldsFromSpatialPairs(pairs);
    const impulseResult = resolveImpulseCollisions(bodies, manifolds.map((manifold) => ({
        a: manifold.a,
        b: manifold.b,
        normalX: manifold.normalX,
        normalY: manifold.normalY,
        penetration: manifold.penetration,
    })));
    return {
        bodies: impulseResult.bodies,
        manifolds,
        impulses: impulseResult.events,
    };
}
//# sourceMappingURL=physicsCollisionPipeline.js.map
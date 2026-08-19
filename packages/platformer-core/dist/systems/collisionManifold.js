import { computeCollisionManifold as computeArcadeCollisionManifold, manifoldsFromSpatialPairs as arcadeManifoldsFromSpatialPairs, } from '@arcade/runtime/core';
/** Shared deterministic manifold implementation with Badger-compatible types. */
export function computeCollisionManifold(aBody, bBody) {
    return computeArcadeCollisionManifold(aBody, bBody);
}
/** Shared deterministic manifold ordering with Badger-compatible types. */
export function manifoldsFromSpatialPairs(pairs) {
    return arcadeManifoldsFromSpatialPairs(pairs);
}
//# sourceMappingURL=collisionManifold.js.map
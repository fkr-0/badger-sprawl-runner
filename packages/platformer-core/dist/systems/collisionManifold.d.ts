import type { Rect } from '../types';
import type { SpatialPair } from './spatialIndex';
export interface CollisionManifold {
    a: string;
    b: string;
    normalX: number;
    normalY: number;
    penetration: number;
    overlapX: number;
    overlapY: number;
}
export interface ManifoldBody extends Rect {
    id: string;
}
/** Shared deterministic manifold implementation with Badger-compatible types. */
export declare function computeCollisionManifold(aBody: ManifoldBody, bBody: ManifoldBody): CollisionManifold | null;
/** Shared deterministic manifold ordering with Badger-compatible types. */
export declare function manifoldsFromSpatialPairs(pairs: readonly SpatialPair[]): CollisionManifold[];
//# sourceMappingURL=collisionManifold.d.ts.map
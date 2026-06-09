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
export declare function computeCollisionManifold(aBody: ManifoldBody, bBody: ManifoldBody): CollisionManifold | null;
export declare function manifoldsFromSpatialPairs(pairs: readonly SpatialPair[]): CollisionManifold[];
//# sourceMappingURL=collisionManifold.d.ts.map
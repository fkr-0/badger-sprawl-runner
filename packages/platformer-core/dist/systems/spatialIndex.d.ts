import type { Rect } from '../types';
export interface SpatialBody extends Rect {
    id: string;
    layer?: string;
    mask?: string[];
}
export interface SpatialIndex {
    cellSize: number;
    cells: Map<string, SpatialBody[]>;
    bodies: SpatialBody[];
}
export interface SpatialPair {
    a: SpatialBody;
    b: SpatialBody;
}
export declare function buildSpatialIndex(bodies: readonly SpatialBody[], cellSize: number): SpatialIndex;
export declare function querySpatialIndex(index: SpatialIndex, rect: Rect): SpatialBody[];
export declare function spatialCollisionPairs(index: SpatialIndex): SpatialPair[];
//# sourceMappingURL=spatialIndex.d.ts.map
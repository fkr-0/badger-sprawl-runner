import type { Rect } from '../types';
export interface SpatialBody extends Rect {
    id: string;
    layer?: string;
    mask?: string[];
}
export interface SpatialIndex {
    readonly cellSize: number;
    readonly cells: Map<string, SpatialBody[]>;
    readonly bodies: readonly SpatialBody[];
}
export interface SpatialPair {
    a: SpatialBody;
    b: SpatialBody;
}
/** Compatibility facade over @arcade/runtime's deterministic spatial hash. */
export declare function buildSpatialIndex(bodies: readonly SpatialBody[], cellSize: number): SpatialIndex;
/** Compatibility facade preserving Badger's exact public result type. */
export declare function querySpatialIndex(index: SpatialIndex, rect: Rect): SpatialBody[];
/** Compatibility facade preserving deterministic pair ordering and masks. */
export declare function spatialCollisionPairs(index: SpatialIndex): SpatialPair[];
//# sourceMappingURL=spatialIndex.d.ts.map
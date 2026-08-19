import { buildSpatialIndex as buildArcadeSpatialIndex, querySpatialIndex as queryArcadeSpatialIndex, spatialCollisionPairs as arcadeSpatialCollisionPairs, } from '@arcade/runtime/core';
/** Compatibility facade over @arcade/runtime's deterministic spatial hash. */
export function buildSpatialIndex(bodies, cellSize) {
    return buildArcadeSpatialIndex(bodies, cellSize);
}
/** Compatibility facade preserving Badger's exact public result type. */
export function querySpatialIndex(index, rect) {
    return queryArcadeSpatialIndex(index, rect);
}
/** Compatibility facade preserving deterministic pair ordering and masks. */
export function spatialCollisionPairs(index) {
    return arcadeSpatialCollisionPairs(index);
}
//# sourceMappingURL=spatialIndex.js.map
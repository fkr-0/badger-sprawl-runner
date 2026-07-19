import {
	buildSpatialIndex as buildArcadeSpatialIndex,
	querySpatialIndex as queryArcadeSpatialIndex,
	spatialCollisionPairs as arcadeSpatialCollisionPairs,
} from '../../../../vendor/arcade-runtime.mjs';
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
export function buildSpatialIndex(bodies: readonly SpatialBody[], cellSize: number): SpatialIndex {
	return buildArcadeSpatialIndex(bodies, cellSize) as SpatialIndex;
}

/** Compatibility facade preserving Badger's exact public result type. */
export function querySpatialIndex(index: SpatialIndex, rect: Rect): SpatialBody[] {
	return queryArcadeSpatialIndex(index, rect) as SpatialBody[];
}

/** Compatibility facade preserving deterministic pair ordering and masks. */
export function spatialCollisionPairs(index: SpatialIndex): SpatialPair[] {
	return arcadeSpatialCollisionPairs(index) as SpatialPair[];
}

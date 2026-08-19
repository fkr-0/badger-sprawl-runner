import {
	computeCollisionManifold as computeArcadeCollisionManifold,
	manifoldsFromSpatialPairs as arcadeManifoldsFromSpatialPairs,
} from '@arcade/runtime/core';
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
export function computeCollisionManifold(
	aBody: ManifoldBody,
	bBody: ManifoldBody
): CollisionManifold | null {
	return computeArcadeCollisionManifold(aBody, bBody) as CollisionManifold | null;
}

/** Shared deterministic manifold ordering with Badger-compatible types. */
export function manifoldsFromSpatialPairs(
	pairs: readonly SpatialPair[]
): CollisionManifold[] {
	return arcadeManifoldsFromSpatialPairs(pairs) as CollisionManifold[];
}

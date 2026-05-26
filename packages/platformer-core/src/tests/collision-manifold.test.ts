import { describe, expect, it } from 'vitest';
import { buildSpatialIndex, computeCollisionManifold, manifoldsFromSpatialPairs, spatialCollisionPairs } from '../index';

describe('collision manifolds', () => {
	it('computes deterministic manifold normals and penetration', () => {
		const manifold = computeCollisionManifold(
			{ id: 'b', x: 8, y: 0, w: 10, h: 10 },
			{ id: 'a', x: 0, y: 0, w: 10, h: 10 }
		);

		expect(manifold).toEqual({
			a: 'a',
			b: 'b',
			normalX: 1,
			normalY: 0,
			penetration: 2,
			overlapX: 2,
			overlapY: 10,
		});
	});

	it('creates stable manifold lists from spatial pairs', () => {
		const index = buildSpatialIndex([
			{ id: 'z', x: 0, y: 0, w: 10, h: 10 },
			{ id: 'a', x: 5, y: 0, w: 10, h: 10 },
			{ id: 'm', x: 100, y: 0, w: 10, h: 10 },
		], 16);
		const manifolds = manifoldsFromSpatialPairs(spatialCollisionPairs(index));

		expect(manifolds.map((manifold) => `${manifold.a}:${manifold.b}:${manifold.penetration}`)).toEqual(['a:z:5']);
	});
});

import { describe, expect, it } from 'vitest';
import { buildSpatialIndex, querySpatialIndex, spatialCollisionPairs, type SpatialBody } from '../index';

const bodies: SpatialBody[] = [
	{ id: 'zombie', x: 8, y: 0, w: 10, h: 10, layer: 'enemy', mask: ['player'] },
	{ id: 'player', x: 0, y: 0, w: 12, h: 12, layer: 'player', mask: ['enemy'] },
	{ id: 'crate', x: 100, y: 0, w: 10, h: 10, layer: 'solid', mask: ['player'] },
	{ id: 'bat', x: 9, y: 1, w: 5, h: 5, layer: 'enemy', mask: ['player'] },
];

describe('spatialIndex', () => {
	it('queries overlapping bodies in deterministic id order', () => {
		const index = buildSpatialIndex([...bodies].reverse(), 16);
		const hits = querySpatialIndex(index, { x: -1, y: -1, w: 20, h: 20 });

		expect(hits.map((body) => body.id)).toEqual(['bat', 'player', 'zombie']);
	});

	it('emits unique collision pairs with stable ordering and layer masks', () => {
		const index = buildSpatialIndex(bodies, 16);
		const pairs = spatialCollisionPairs(index).map((pair) => `${pair.a.id}:${pair.b.id}`);

		expect(pairs).toEqual(['bat:player', 'player:zombie']);
	});

	it('rejects invalid cell sizes', () => {
		expect(() => buildSpatialIndex(bodies, 0)).toThrow('Invalid spatial cell size');
	});
});

import { describe, expect, it } from 'vitest';
import { hasLineOfSight, raycast } from '../index';

describe('raycast', () => {
	it('returns the nearest hit with deterministic id tie breaking', () => {
		const hit = raycast({
			x: 0,
			y: 5,
			dx: 1,
			dy: 0,
			maxDistance: 100,
			obstacles: [
				{ id: 'b', x: 20, y: 0, w: 10, h: 10, layer: 'solid' },
				{ id: 'a', x: 20, y: 0, w: 10, h: 10, layer: 'solid' },
				{ id: 'far', x: 50, y: 0, w: 10, h: 10, layer: 'solid' },
			],
		});

		expect(hit?.obstacle.id).toBe('a');
		expect(hit?.distance).toBe(20);
		expect(hit?.normalX).toBe(-1);
		expect(hit?.x).toBe(20);
		expect(hit?.y).toBe(5);
	});

	it('respects layer filters and line of sight checks', () => {
		const input = {
			x: 0,
			y: 5,
			dx: 1,
			dy: 0,
			maxDistance: 100,
			obstacles: [
				{ id: 'fog', x: 10, y: 0, w: 10, h: 10, layer: 'visual' },
				{ id: 'wall', x: 30, y: 0, w: 10, h: 10, layer: 'solid' },
			],
		};

		expect(raycast({ ...input, includeLayers: ['solid'] })?.obstacle.id).toBe('wall');
		expect(hasLineOfSight({ ...input, maxDistance: 5 })).toBe(true);
		expect(hasLineOfSight(input)).toBe(false);
	});

	it('rejects zero-length ray directions', () => {
		expect(() => raycast({ x: 0, y: 0, dx: 0, dy: 0, maxDistance: 10, obstacles: [] })).toThrow('zero direction');
	});
});

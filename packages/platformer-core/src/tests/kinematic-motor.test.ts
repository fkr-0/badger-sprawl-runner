import { describe, expect, it } from 'vitest';
import { moveKinematicBody } from '../index';

describe('kinematic motor', () => {
	it('moves freely without collisions', () => {
		const result = moveKinematicBody({
			body: { id: 'badger', x: 0, y: 0, w: 10, h: 10, vx: 10, vy: 5, onGround: false },
			obstacles: [],
			dt: 0.5,
		});

		expect(result.body).toMatchObject({ x: 5, y: 2.5, vx: 10, vy: 5, onGround: false });
		expect(result.collisions).toEqual([]);
	});

	it('lands deterministically and reports collision metadata', () => {
		const result = moveKinematicBody({
			body: { id: 'badger', x: 0, y: 0, w: 10, h: 10, vx: 0, vy: 100, onGround: false },
			obstacles: [{ id: 'floor', x: -100, y: 20, w: 200, h: 10 }],
			dt: 1,
		});

		expect(result.body.y).toBeCloseTo(9.9999);
		expect(result.body.vy).toBe(0);
		expect(result.body.onGround).toBe(true);
		expect(result.collisions).toEqual([{ obstacleId: 'floor', normalX: 0, normalY: -1, time: 0.1, remainingTime: 0.9 }]);
	});

	it('uses deterministic slide limits', () => {
		expect(() => moveKinematicBody({
			body: { id: 'badger', x: 0, y: 0, w: 10, h: 10, vx: 1, vy: 1, onGround: false },
			obstacles: [],
			dt: 1,
			maxSlides: 0,
		})).toThrow('Invalid maxSlides');
	});
});

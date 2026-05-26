import { describe, expect, it } from 'vitest';
import { stepMovingPlatforms, type MovingPlatformState } from '../index';

const lift: MovingPlatformState = {
	id: 'lift-a',
	x: 0,
	y: 20,
	w: 40,
	h: 8,
	vx: 0,
	vy: 0,
	time: 0,
	loop: true,
	path: [
		{ x: 0, y: 20, time: 0 },
		{ x: 10, y: 20, time: 1 },
		{ x: 10, y: 10, time: 2 },
	],
};

describe('moving platform system', () => {
	it('samples platform paths and carries grounded bodies deterministically', () => {
		const result = stepMovingPlatforms([lift], [{
			id: 'badger',
			x: 4,
			y: 10,
			w: 10,
			h: 10,
			vx: 0,
			vy: 0,
			onGround: true,
		}], 0.5);

		expect(result.platforms[0]).toMatchObject({ x: 5, y: 20, vx: 10, vy: 0, time: 0.5 });
		expect(result.bodies[0]).toMatchObject({ x: 9, y: 10, standingOnId: 'lift-a' });
		expect(result.carryEvents).toEqual([{ bodyId: 'badger', platformId: 'lift-a', dx: 5, dy: 0 }]);
	});

	it('loops platform paths deterministically', () => {
		const result = stepMovingPlatforms([{ ...lift, time: 1.5, x: 10, y: 15 }], [], 1);

		expect(result.platforms[0]).toMatchObject({ x: 5, y: 20, time: 2.5 });
	});

	it('rejects invalid platform paths', () => {
		expect(() => stepMovingPlatforms([{ ...lift, path: [{ x: 0, y: 0, time: 0 }] }], [], 0.1)).toThrow('needs at least two path points');
	});
});

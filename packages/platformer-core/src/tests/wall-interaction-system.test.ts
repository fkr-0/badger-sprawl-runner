import { describe, expect, it } from 'vitest';
import { applyWallInteraction, detectWallContact } from '../index';

const walls = [
	{ id: 'left-wall', x: -5, y: 0, w: 5, h: 100 },
	{ id: 'right-wall', x: 20, y: 0, w: 5, h: 100 },
];

const params = {
	probeDistance: 4,
	wallSlideMaxSpeed: 60,
	wallJumpVelocityX: 180,
	wallJumpVelocityY: -320,
};

describe('wall interaction system', () => {
	it('detects wall contact deterministically by id and side', () => {
		const contact = detectWallContact({ id: 'badger', x: 0, y: 10, w: 10, h: 20, vx: 0, vy: 10, dir: -1, onGround: false }, walls, 4);

		expect(contact).toEqual({ wallId: 'left-wall', side: 'left' });
	});

	it('caps falling speed while wall sliding', () => {
		const result = applyWallInteraction({ id: 'badger', x: 0, y: 10, w: 10, h: 20, vx: 0, vy: 200, dir: -1, onGround: false }, walls, params);

		expect(result.wallSliding).toBe(true);
		expect(result.wallJumped).toBe(false);
		expect(result.body.vy).toBe(60);
	});

	it('applies deterministic wall jump away from contact side', () => {
		const result = applyWallInteraction(
			{ id: 'badger', x: 10, y: 10, w: 10, h: 20, vx: 0, vy: 80, dir: 1, onGround: false },
			walls,
			params,
			{ jumpPressed: true }
		);

		expect(result.contact).toEqual({ wallId: 'right-wall', side: 'right' });
		expect(result.wallJumped).toBe(true);
		expect(result.body.vx).toBe(-180);
		expect(result.body.vy).toBe(-320);
		expect(result.body.dir).toBe(-1);
	});
});

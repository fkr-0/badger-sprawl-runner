import { describe, expect, it } from 'vitest';
import type { ActionMap } from './InputSystem';
import { type Entity, PhysicsSystem, type Platform } from './PhysicsSystem';

const IDLE_ACTION: ActionMap = {
	moveLeft: false,
	moveRight: false,
	jump: false,
	jumpPressed: false,
	fastFall: false,
	melee: false,
	meleePressed: false,
	shoot: false,
	shootPressed: false,
	item: false,
	itemPressed: false,
	parry: false,
	parryPressed: false,
	dodge: false,
	dodgePressed: false,
	hack: false,
	hackPressed: false,
	hackHeld: false,
	pause: false,
	pausePressed: false,
	debugToggle: false,
};

function groundedPlayer(): Entity {
	return {
		x: 100,
		y: 448,
		w: 34,
		h: 46,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
	};
}

describe('PhysicsSystem grounded support', () => {
	it('keeps a standing entity grounded across consecutive fixed updates', () => {
		const physics = new PhysicsSystem();
		const player = groundedPlayer();
		const platforms: Platform[] = [{ x: 0, y: 494, w: 400, h: 80 }];

		for (let frame = 0; frame < 30; frame += 1) {
			physics.step(player, platforms, IDLE_ACTION, 1 / 60);
			expect(player.onGround).toBe(true);
			expect(player.y).toBe(448);
		}
	});

	it('retains grounded support while moving horizontally along the platform', () => {
		const physics = new PhysicsSystem();
		const player = groundedPlayer();
		const platforms: Platform[] = [{ x: 0, y: 494, w: 400, h: 80 }];
		const moveRight = { ...IDLE_ACTION, moveRight: true };

		for (let frame = 0; frame < 30; frame += 1) {
			physics.step(player, platforms, moveRight, 1 / 60);
			expect(player.onGround).toBe(true);
		}
		expect(player.x).toBeGreaterThan(100);
	});
});

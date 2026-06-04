import { describe, it, expect } from 'vitest';
import { gravityStep } from '../systems/gravityStep';
import { platformStep } from '../systems/platformStep';
import { coyoteStep } from '../systems/coyoteStep';
import { defaultParams } from '../PhysicsParams';

describe('gravityStep', () => {
	it('gravity accumulation over 1 second reaches maxFallSpeed', () => {
		let vy = 0;
		for (let i = 0; i < 60; i++) {
			vy = gravityStep(vy, defaultParams, 1 / 60);
		}
		expect(vy).toBe(defaultParams.maxFallSpeed);
	});

	it('gravity accumulation without cap builds up correctly', () => {
		let vy = 0;
		for (let i = 0; i < 10; i++) {
			vy = gravityStep(vy, defaultParams, 1 / 60);
		}
		expect(vy).toBeGreaterThan(300);
		expect(vy).toBeLessThan(350);
	});
});

describe('platformStep', () => {
	it('landing snaps player to platform y', () => {
		const result = platformStep({
			x: 100,
			y: 449,
			w: 34,
			h: 46,
			vx: 0,
			vy: 100,
			prevVy: 100,
			dt: 1 / 60,
			coyoteTime: defaultParams.coyote,
			platforms: [{ x: 0, y: 494, w: 1900, h: 80 }],
		});

		expect(result.onGround).toBe(true);
		expect(result.y).toBe(448);
		expect(result.coyoteLeft).toBeGreaterThan(0);
	});

	it('uses actual dt when testing whether the player crossed the platform top', () => {
		const result = platformStep({
			x: 100,
			y: 496,
			w: 34,
			h: 46,
			vx: 0,
			vy: 900,
			prevVy: 900,
			dt: 1 / 30,
			coyoteTime: defaultParams.coyote,
			platforms: [{ x: 0, y: 520, w: 1900, h: 80 }],
		});

		expect(result.onGround).toBe(true);
		expect(result.y).toBe(474);
	});
});

describe('coyoteStep', () => {
	it('coyote timer resets when on ground', () => {
		const result = coyoteStep({
			onGround: true,
			coyoteLeft: 0,
			jumpBuffered: 0,
			params: defaultParams,
			dt: 1 / 60,
		});

		expect(result.coyoteLeft).toBe(defaultParams.coyote);
	});

	it('coyote timer expires after exact time', () => {
		let coyoteLeft = defaultParams.coyote;
		const steps = Math.ceil(defaultParams.coyote / (1 / 60));

		for (let i = 0; i < steps + 10; i++) {
			const result = coyoteStep({
				onGround: false,
				coyoteLeft,
				jumpBuffered: 0,
				params: defaultParams,
				dt: 1 / 60,
			});
			coyoteLeft = result.coyoteLeft;
		}

		expect(coyoteLeft).toBe(0);
	});
});

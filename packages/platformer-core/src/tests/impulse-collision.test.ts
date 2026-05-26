import { describe, expect, it } from 'vitest';
import { resolveImpulseCollisions } from '../index';

describe('impulse collision', () => {
	it('resolves head-on collisions deterministically with restitution', () => {
		const result = resolveImpulseCollisions([
			{ id: 'a', x: 0, y: 0, vx: 10, vy: 0, mass: 1, restitution: 1, friction: 0 },
			{ id: 'b', x: 10, y: 0, vx: -10, vy: 0, mass: 1, restitution: 1, friction: 0 },
		], [{ a: 'a', b: 'b', normalX: 1, normalY: 0 }]);

		expect(result.bodies.map((body) => ({ id: body.id, vx: body.vx }))).toEqual([
			{ id: 'a', vx: -10 },
			{ id: 'b', vx: 10 },
		]);
		expect(result.events[0]?.impulse).toBe(20);
	});

	it('applies penetration correction using inverse mass', () => {
		const result = resolveImpulseCollisions([
			{ id: 'heavy', x: 0, y: 0, vx: 0, vy: 0, mass: 10 },
			{ id: 'light', x: 0, y: 0, vx: 0, vy: 0, mass: 1 },
		], [{ a: 'heavy', b: 'light', normalX: 1, normalY: 0, penetration: 1 }]);

		expect(result.bodies.find((body) => body.id === 'heavy')?.x).toBeCloseTo(-0.0726545);
		expect(result.bodies.find((body) => body.id === 'light')?.x).toBeCloseTo(0.726545);
	});
});

import { describe, expect, it } from 'vitest';
import { solveDistanceConstraints } from '../index';

describe('physics constraints', () => {
	it('solves distance constraints deterministically by constraint id', () => {
		const result = solveDistanceConstraints([
			{ id: 'a', x: 0, y: 0, vx: 10, vy: 0, mass: 1 },
			{ id: 'b', x: 20, y: 0, vx: -10, vy: 0, mass: 1 },
		], [
			{ id: 'rope', a: 'a', b: 'b', restLength: 10, stiffness: 1, damping: 1 },
		], 0.5);

		expect(result.bodies.map((body) => ({ id: body.id, x: body.x, y: body.y, vx: body.vx }))).toEqual([
			{ id: 'a', x: 5, y: 0, vx: 5 },
			{ id: 'b', x: 15, y: 0, vx: -5 },
		]);
		expect(result.corrections).toEqual([{ constraintId: 'rope', dx: 10, dy: 0 }]);
	});

	it('respects body mass when distributing corrections', () => {
		const result = solveDistanceConstraints([
			{ id: 'heavy', x: 0, y: 0, vx: 0, vy: 0, mass: 10 },
			{ id: 'light', x: 20, y: 0, vx: 0, vy: 0, mass: 1 },
		], [{ id: 'chain', a: 'heavy', b: 'light', restLength: 10, stiffness: 1 }], 0.016);

		expect(result.bodies.find((body) => body.id === 'heavy')?.x).toBeCloseTo(0.90909);
		expect(result.bodies.find((body) => body.id === 'light')?.x).toBeCloseTo(10.90909);
	});
});

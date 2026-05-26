import { describe, expect, it } from 'vitest';
import { sweepAabb } from '../index';

describe('sweepAabb', () => {
	it('detects the earliest deterministic horizontal collision', () => {
		const result = sweepAabb({
			body: { x: 0, y: 0, w: 10, h: 10 },
			vx: 100,
			vy: 0,
			dt: 1,
			obstacles: [
				{ id: 'far', x: 80, y: 0, w: 10, h: 10 },
				{ id: 'near', x: 20, y: 0, w: 10, h: 10 },
			],
		});

		expect(result.hit?.obstacle.id).toBe('near');
		expect(result.hit?.normalX).toBe(-1);
		expect(result.vx).toBe(0);
		expect(result.x).toBeCloseTo(10);
	});

	it('uses obstacle id as a stable tie breaker', () => {
		const result = sweepAabb({
			body: { x: 0, y: 0, w: 10, h: 10 },
			vx: 100,
			vy: 0,
			dt: 1,
			obstacles: [
				{ id: 'b', x: 20, y: 0, w: 10, h: 10 },
				{ id: 'a', x: 20, y: 0, w: 10, h: 10 },
			],
		});

		expect(result.hit?.obstacle.id).toBe('a');
	});

	it('ignores one-way platforms while moving upward', () => {
		const result = sweepAabb({
			body: { x: 0, y: 10, w: 10, h: 10 },
			vx: 0,
			vy: -100,
			dt: 0.2,
			obstacles: [{ id: 'one-way', x: 0, y: 0, w: 50, h: 4, oneWay: true }],
		});

		expect(result.hit).toBeNull();
		expect(result.y).toBe(-10);
	});
});

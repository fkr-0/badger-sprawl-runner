import { describe, expect, it } from 'vitest';
import { probeGround } from '../index';

describe('ground probe', () => {
	it('detects nearest ground using deterministic probe ordering', () => {
		const result = probeGround({
			body: { x: 0, y: 0, w: 20, h: 20 },
			probeDistance: 10,
			obstacles: [
				{ id: 'far-floor', x: -10, y: 28, w: 80, h: 10 },
				{ id: 'near-floor', x: -10, y: 24, w: 80, h: 10 },
			],
		});

		expect(result).toEqual({ grounded: true, distance: 4, normalX: 0, normalY: -1, obstacleId: 'near-floor' });
	});

	it('reports not grounded when probes miss', () => {
		expect(probeGround({ body: { x: 0, y: 0, w: 20, h: 20 }, probeDistance: 3, obstacles: [] })).toEqual({
			grounded: false,
			distance: 3,
			normalX: 0,
			normalY: 0,
		});
	});
});

import { describe, expect, it } from 'vitest';
import { resolveSlopeSurface, walkSlopeSurface, type SlopeSegment } from '../index';

const slopes: SlopeSegment[] = [
	{ id: 'ramp-a', x1: 0, y1: 100, x2: 100, y2: 50, materialId: 'concrete' },
	{ id: 'ramp-b', x1: 0, y1: 100, x2: 100, y2: 50, materialId: 'steel' },
];

describe('slope surface system', () => {
	it('samples exact ground y and normal', () => {
		const sample = resolveSlopeSurface({ x: 50, slopes });
		expect(sample).toMatchObject({ slopeId: 'ramp-a', y: 75, normalX: -0.447214, normalY: -0.894427 });
	});

	it('walks uphill and downhill deterministically', () => {
		const body = { x: 40, y: 65, w: 10, h: 10, vx: 0, vy: 0, onGround: false };
		const uphill = walkSlopeSurface({ body, slopes, dt: 0.1, moveX: 1, walkSpeed: 20 });
		const downhill = walkSlopeSurface({ body, slopes, dt: 0.1, moveX: -1, walkSpeed: 20 });
		expect(uphill.body.x).toBe(42);
		expect(downhill.body.x).toBe(38);
		expect(uphill.body.onGround).toBe(true);
	});

	it('slides on slippery slopes deterministically', () => {
		const result = walkSlopeSurface({ body: { x: 40, y: 65, w: 10, h: 10, vx: 0, vy: 0, onGround: false }, slopes, materials: [{ id: 'concrete', traction: 0.2, slideMultiplier: 10 }], gravity: 100, dt: 0.1 });
		expect(result.sample?.slideForce).toBe(357.7712);
		expect(result.body.vx).toBe(35.77712);
	});

	it('uses stable slope id tie-breaks', () => {
		const sample = resolveSlopeSurface({ x: 25, slopes: [...slopes].reverse() });
		expect(sample?.slopeId).toBe('ramp-a');
	});
});

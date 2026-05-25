import { describe, expect, it } from 'vitest';
import { createLayeredFluid, createUniformFluid, flyingObjectStep } from '../index';
import { defaultParams } from '../PhysicsParams';

const baseObject = {
	x: 0,
	y: 0,
	vx: 100,
	vy: 0,
	angle: 0,
	angularVelocity: 1,
	mass: 1,
};

describe('flyingObjectStep', () => {
	it('integrates deterministic ballistic motion without fluid', () => {
		const next = flyingObjectStep({ object: baseObject, params: defaultParams, dt: 0.5 });

		expect(next.vx).toBe(100);
		expect(next.vy).toBe(950);
		expect(next.x).toBe(50);
		expect(next.y).toBe(475);
		expect(next.angle).toBe(0.5);
	});

	it('caps fall speed for long-lived projectiles', () => {
		const next = flyingObjectStep({
			object: { ...baseObject, vy: 1000 },
			params: defaultParams,
			dt: 1,
		});

		expect(next.vy).toBe(defaultParams.maxFallSpeed);
	});

	it('lets an extensible fluid field push and damp a flying object', () => {
		const windTunnel = createUniformFluid('wind-tunnel', {
			density: 1,
			flowX: 300,
			flowY: -100,
			drag: 0.5,
			buoyancy: 0.2,
			viscosity: 0.4,
		});

		const next = flyingObjectStep({ object: { ...baseObject, vx: 0 }, params: defaultParams, dt: 0.2, fluid: windTunnel });

		expect(next.vx).toBeGreaterThan(0);
		expect(next.vy).toBeLessThan(defaultParams.gravity * 0.2);
		expect(next.angularVelocity).toBeLessThan(baseObject.angularVelocity);
	});

	it('samples layered fluids by position so water and air can coexist', () => {
		const layered = createLayeredFluid('sprawl-atmosphere', [
			{ minY: -1000, maxY: 100, sample: { density: 0.1, flowX: 80, flowY: 0, drag: 0.1 } },
			{ minY: 100, maxY: 1000, sample: { density: 2, flowX: -200, flowY: 40, drag: 0.8, buoyancy: 0.7 } },
		]);

		const air = flyingObjectStep({ object: { ...baseObject, y: 50, vx: 0 }, params: defaultParams, dt: 0.1, fluid: layered });
		const water = flyingObjectStep({ object: { ...baseObject, y: 150, vx: 0 }, params: defaultParams, dt: 0.1, fluid: layered });

		expect(air.vx).toBeGreaterThan(0);
		expect(water.vx).toBeLessThan(0);
		expect(water.vy).toBeLessThan(air.vy);
	});
});

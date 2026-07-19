import { describe, expect, it } from 'vitest';
import { createUniformFluid, stepProjectiles, type ProjectileState } from '../index';
import { defaultParams } from '../PhysicsParams';

function projectile(overrides: Partial<ProjectileState> = {}): ProjectileState {
	return {
		id: 'p1',
		kind: 'scrap',
		ownerId: 'player',
		x: 0,
		y: 10,
		vx: 100,
		vy: 0,
		angle: 0,
		angularVelocity: 0,
		mass: 1,
		radius: 4,
		life: 1,
		damage: 2,
		pierce: 0,
		active: true,
		bounces: 0,
		maxBounces: 0,
		tags: [],
		...overrides,
	};
}

describe('stepProjectiles', () => {
	it('advances projectiles through flying-object physics and reports target hits', () => {
		const result = stepProjectiles({
			projectiles: [projectile()],
			targets: [{ id: 'drone', x: 5, y: 0, w: 20, h: 40 }],
			bounds: { x: -100, y: -100, w: 400, h: 400 },
			params: defaultParams,
			dt: 0.1,
		});

		expect(result.hits).toEqual([{ projectileId: 'p1', targetId: 'drone', damage: 2, kind: 'scrap' }]);
		expect(result.expiredIds).toEqual(['p1']);
	});

	it('lets rail projectiles pierce multiple targets without gravity drift', () => {
		const result = stepProjectiles({
			projectiles: [projectile({ kind: 'rail', pierce: 1, vx: 400, y: 10 })],
			targets: [
				{ id: 'a', x: 35, y: 0, w: 20, h: 40 },
				{ id: 'b', x: 38, y: 0, w: 20, h: 40 },
			],
			bounds: { x: -100, y: -100, w: 400, h: 400 },
			params: defaultParams,
			dt: 0.1,
		});

		expect(result.hits.map((hit) => hit.targetId)).toEqual(['a', 'b']);
		expect(result.projectiles).toEqual([]);
	});

	it('preserves caller target order while using shared hitbox contacts', () => {
		const result = stepProjectiles({
			projectiles: [projectile({ kind: 'rail', pierce: 1, vx: 400, y: 10 })],
			targets: [
				{ id: 'zulu', x: 35, y: 0, w: 20, h: 40 },
				{ id: 'alpha', x: 38, y: 0, w: 20, h: 40 },
			],
			bounds: { x: -100, y: -100, w: 400, h: 400 },
			params: defaultParams,
			dt: 0.1,
		});

		expect(result.hits.map((hit) => hit.targetId)).toEqual(['zulu', 'alpha']);
	});

	it('bounces from platforms until max bounce budget is spent', () => {
		const result = stepProjectiles({
			projectiles: [projectile({ x: 10, y: 9, vx: 0, vy: 20, maxBounces: 1 })],
			targets: [],
			platforms: [{ x: 0, y: 10, w: 100, h: 10 }],
			bounds: { x: -100, y: -100, w: 400, h: 400 },
			params: defaultParams,
			dt: 0.01,
		});

		expect(result.projectiles[0]?.bounces).toBe(1);
		expect(result.projectiles[0]?.vy).toBeLessThan(0);
	});

	it('samples fluid fields while advancing projectile motion', () => {
		const wind = createUniformFluid('fan', { density: 1, flowX: 300, flowY: 0, drag: 0.5 });
		const result = stepProjectiles({
			projectiles: [projectile({ vx: 0 })],
			targets: [],
			bounds: { x: -100, y: -100, w: 400, h: 400 },
			params: defaultParams,
			dt: 0.1,
			fluid: wind,
		});

		expect(result.projectiles[0]?.vx).toBeGreaterThan(0);
	});
});

import { describe, expect, it } from 'vitest';
import { defaultParams } from '../PhysicsParams';
import { stepPhysicsWorld, type PhysicsActorState, type PhysicsWorldState } from '../index';

function actor(overrides: Partial<PhysicsActorState> = {}): PhysicsActorState {
	return {
		id: 'player',
		x: 0,
		y: 0,
		w: 30,
		h: 40,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: false,
		coyoteLeft: 0,
		jumpBuffered: 0,
		axisInput: 0,
		jumpPressed: false,
		jumpHeld: false,
		fastFall: false,
		...overrides,
	};
}

function world(overrides: Partial<PhysicsWorldState> = {}): PhysicsWorldState {
	return {
		actors: [actor()],
		projectiles: [],
		platforms: [{ x: -100, y: 90, w: 500, h: 20 }],
		bounds: { x: -200, y: -200, w: 800, h: 800 },
		tick: 0,
		time: 0,
		...overrides,
	};
}

describe('stepPhysicsWorld', () => {
	it('replays the same actor inputs into identical world snapshots', () => {
		const initial = world({ actors: [actor({ axisInput: 1, jumpPressed: true, jumpHeld: true, onGround: true })] });
		const first = stepPhysicsWorld({ world: initial, params: defaultParams, dt: 1 / 60 }).world;
		const second = stepPhysicsWorld({ world: initial, params: defaultParams, dt: 1 / 60 }).world;

		expect(first).toEqual(second);
		expect(first.tick).toBe(1);
		expect(first.time).toBeCloseTo(1 / 60);
		expect(first.actors[0]?.vx).toBeGreaterThan(0);
		expect(first.actors[0]?.vy).toBeLessThan(0);
	});

	it('applies runtime item physics modifiers to actor movement', () => {
		const base = stepPhysicsWorld({ world: world({ actors: [actor({ axisInput: 1 })] }), params: defaultParams, dt: 1 / 60 }).world;
		const boosted = stepPhysicsWorld({
			world: world({ actors: [actor({ axisInput: 1, airControlMultiplier: 1.5 })] }),
			params: defaultParams,
			dt: 1 / 60,
		}).world;

		expect(boosted.actors[0]?.vx).toBeGreaterThan(base.actors[0]?.vx ?? 0);
	});

	it('applies material zones while stepping actors', () => {
		const step = stepPhysicsWorld({
			world: world({
				actors: [actor({ y: 48, vx: 10, vy: 120, onGround: false })],
				platforms: [],
				materialZones: [{
					x: -100,
					y: 0,
					w: 400,
					h: 160,
					material: { id: 'bounce-field', friction: 0.1, traction: 1, restitution: 0.5, conveyorX: 300 },
				}],
			}),
			params: defaultParams,
			dt: 0.1,
		});

		expect(step.world.actors[0]?.vy).toBeLessThan(0);
		expect(step.materialEvents[0]).toMatchObject({
			actorId: 'player',
			materialId: 'bounce-field',
			damage: 0,
		});
	});

	it('emits deterministic material hazard damage events', () => {
		const result = stepPhysicsWorld({
			world: world({
				actors: [actor({ y: 20, vy: 0 })],
				materialZones: [{
					x: -20,
					y: 0,
					w: 100,
					h: 100,
					material: { id: 'acid-pool', friction: 1, traction: 1, restitution: 0, damagePerSecond: 8, tags: ['hazard', 'acid'] },
				}],
			}),
			params: defaultParams,
			dt: 0.25,
		});

		expect(result.materialEvents).toEqual([{ actorId: 'player', materialId: 'acid-pool', tags: ['hazard', 'acid'], damage: 2, overlapArea: 1200 }]);
	});

	it('reports projectile hits against stepped actors and removes spent projectiles', () => {
		const result = stepPhysicsWorld({
			world: world({
				actors: [actor({ id: 'drone', x: 10, y: 0 })],
				projectiles: [{
					id: 'shot', kind: 'rail', ownerId: 'player', x: 0, y: 20, vx: 200, vy: 0, angle: 0, angularVelocity: 0,
					mass: 1, radius: 4, life: 1, damage: 3, pierce: 0, active: true, bounces: 0, maxBounces: 0, tags: [],
				}],
			}),
			params: defaultParams,
			dt: 0.05,
		});

		expect(result.projectileHits).toEqual([{ projectileId: 'shot', targetId: 'drone', damage: 3, kind: 'rail' }]);
		expect(result.expiredProjectileIds).toEqual(['shot']);
		expect(result.world.projectiles).toEqual([]);
	});
});

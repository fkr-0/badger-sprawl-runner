import {
	type PhysicsActorState,
	type PhysicsWorldState,
	defaultParams,
} from '@badger/platformer-core';
import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { type DeterministicRunState, stepDeterministicRun } from './DeterministicRunStep';
import { type ItemUseDefinition, createItemUseState } from './ItemUseSystem';

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
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		axisInput: 0,
		jumpPressed: false,
		jumpHeld: false,
		fastFall: false,
		...overrides,
	};
}

function combatant(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player',
		x: 0,
		y: 0,
		w: 30,
		h: 40,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 5,
		maxHp: 5,
		invuln: 0,
		stun: 0,
		faction: 'player',
		...overrides,
	};
}

const heal: ItemUseDefinition = {
	itemId: 'stim_cache',
	cooldown: 0.5,
	maxCharges: 1,
	effects: { heal: 2 },
};

function world(): PhysicsWorldState {
	return {
		actors: [actor({ id: 'player', y: 10 }), actor({ id: 'drone', x: 45, y: 10 })],
		projectiles: [
			{
				id: 'shot',
				kind: 'rail',
				ownerId: 'player',
				x: 40,
				y: 25,
				vx: 200,
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
			},
		],
		platforms: [],
		materialZones: [
			{
				x: -10,
				y: 0,
				w: 50,
				h: 80,
				material: {
					id: 'acid',
					friction: 1,
					traction: 1,
					restitution: 0,
					damagePerSecond: 4,
					tags: ['hazard', 'acid'],
				},
			},
		],
		bounds: { x: -100, y: -100, w: 400, h: 400 },
		tick: 0,
		time: 0,
	};
}

function state(): DeterministicRunState {
	return {
		physics: world(),
		combatants: [
			combatant({ id: 'player', hp: 3 }),
			combatant({ id: 'drone', faction: 'enemy', x: 45, y: 10, hp: 5 }),
		],
		items: [
			{ actorId: 'player', definition: heal, state: createItemUseState(heal), requestedUse: true },
		],
		tick: 0,
		time: 0,
	};
}

describe('DeterministicRunStep', () => {
	it('replays the same integrated frame into the same state hash', () => {
		const first = stepDeterministicRun({
			state: state(),
			params: defaultParams,
			dt: 0.1,
			projectileAttackerId: 'player',
		});
		const second = stepDeterministicRun({
			state: state(),
			params: defaultParams,
			dt: 0.1,
			projectileAttackerId: 'player',
		});

		expect(first.frameHash).toBe(second.frameHash);
		expect(first.state).toEqual(second.state);
		expect(first.itemEvents.map((event) => event.kind)).toEqual(['used']);
	});

	it('applies active item effects, material hazard damage, and projectile combat damage in one deterministic frame', () => {
		const result = stepDeterministicRun({
			state: state(),
			params: defaultParams,
			dt: 0.1,
			projectileAttackerId: 'player',
			statusByMaterialTag: {
				acid: [
					{
						id: 'acid-burn',
						kind: 'burn',
						sourceId: 'acid',
						duration: 1,
						remaining: 1,
						stacks: 1,
						maxStacks: 1,
						tickInterval: 0.5,
						tickTimer: 0.5,
						magnitude: 1,
					},
				],
			},
		});

		const player = result.state.combatants.find((entity) => entity.id === 'player');
		const drone = result.state.combatants.find((entity) => entity.id === 'drone');

		expect(player?.hp).toBeCloseTo(4.6);
		expect(player?.invuln).toBe(0.5);
		expect(player?.statusEffects?.[0]?.kind).toBe('burn');
		expect(drone?.hp).toBe(3);
		expect(result.combatEvents.some((event) => event.moveId === 'projectile:shot')).toBe(true);
		expect(result.state.physics.projectiles).toEqual([]);
	});
});

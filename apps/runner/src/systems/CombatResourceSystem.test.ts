import { describe, expect, it } from 'vitest';
import { canPayResourceCosts, payResourceCosts, stepCombatResources, type CombatResourceState } from './CombatResourceSystem';

const state: CombatResourceState = {
	ownerId: 'player',
	pools: [
		{ kind: 'stamina', value: 2, max: 5, regenPerSecond: 2 },
		{ kind: 'heat', value: 4, max: 10, regenPerSecond: 0, decayPerSecond: 1 },
	],
};

describe('CombatResourceSystem', () => {
	it('regenerates and decays resources deterministically', () => {
		const result = stepCombatResources(state, 0.5);

		expect(result.state.pools).toEqual([
			{ kind: 'stamina', value: 3, max: 5, regenPerSecond: 2 },
			{ kind: 'heat', value: 3.5, max: 10, regenPerSecond: 0, decayPerSecond: 1 },
		]);
		expect(result.events).toEqual([
			{ kind: 'regenerated', ownerId: 'player', resource: 'stamina', amount: 1 },
			{ kind: 'decayed', ownerId: 'player', resource: 'heat', amount: 0.5 },
		]);
	});

	it('pays costs or emits deterministic block events', () => {
		expect(canPayResourceCosts(state, [{ kind: 'stamina', amount: 2 }])).toBe(true);
		const paid = payResourceCosts(state, [{ kind: 'stamina', amount: 2 }, { kind: 'heat', amount: 1 }]);
		expect(paid.ok).toBe(true);
		expect(paid.state.pools.map((pool) => [pool.kind, pool.value])).toEqual([['stamina', 0], ['heat', 3]]);

		const blocked = payResourceCosts(state, [{ kind: 'ammo', amount: 1 }]);
		expect(blocked).toMatchObject({ ok: false, events: [{ kind: 'blocked', ownerId: 'player', resource: 'ammo', amount: 1 }] });
	});
});

import { describe, expect, it } from 'vitest';
import { createCombatActionState, stepCombatActionState, tryStartCombatAction, type CombatActionDefinition } from './CombatActionSystem';
import type { CombatResourceState } from './CombatResourceSystem';

const resources: CombatResourceState = {
	ownerId: 'player',
	pools: [{ kind: 'stamina', value: 3, max: 5, regenPerSecond: 1 }],
};

const slash: CombatActionDefinition = {
	id: 'slash',
	cooldown: 0.5,
	costs: [{ kind: 'stamina', amount: 2 }],
	queueWindow: 0.2,
};

describe('CombatActionSystem', () => {
	it('starts actions by paying resources and setting cooldowns', () => {
		const started = tryStartCombatAction(createCombatActionState('player', resources), slash);

		expect(started.ok).toBe(true);
		expect(started.state.cooldowns.slash).toBe(0.5);
		expect(started.state.resources.pools[0]?.value).toBe(1);
		expect(started.events.map((event) => event.kind)).toEqual(['started', 'resource']);
	});

	it('queues cooldown-blocked actions and expires them deterministically', () => {
		const started = tryStartCombatAction(createCombatActionState('player', resources), slash).state;
		const queued = tryStartCombatAction(started, slash, { queueIfBlocked: true });
		expect(queued.ok).toBe(false);
		expect(queued.events).toEqual([{ kind: 'queued', ownerId: 'player', actionId: 'slash' }]);

		const stepped = stepCombatActionState(queued.state, 0.25);
		expect(stepped.events.some((event) => event.kind === 'queue-expired')).toBe(true);
		expect(stepped.state.queuedActionId).toBeUndefined();
	});

	it('blocks actions when resources are missing', () => {
		const empty = createCombatActionState('player', { ownerId: 'player', pools: [{ kind: 'stamina', value: 0, max: 5, regenPerSecond: 0 }] });
		const result = tryStartCombatAction(empty, slash);

		expect(result.ok).toBe(false);
		expect(result.events[0]).toEqual({ kind: 'blocked', ownerId: 'player', actionId: 'slash' });
		expect(result.events[1]?.resourceEvent?.kind).toBe('blocked');
	});
});

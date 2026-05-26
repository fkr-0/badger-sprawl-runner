import { describe, expect, it } from 'vitest';
import type { CombatEvent } from './CombatSystem';
import {
	createItemProcRng,
	createItemProcRuntime,
	resolveItemProcs,
	type ItemProcDefinition,
} from './ItemProcSystem';

const empProc: ItemProcDefinition = {
	id: 'black-ice-spark',
	itemId: 'black_ice_tooth',
	triggerKinds: ['hit', 'kill'],
	chance: 1,
	cooldown: 0.5,
	effects: { bonusDamage: 1, empPulse: true },
	statusOnProc: [{
		id: 'proc-emp',
		kind: 'emp',
		sourceId: 'black_ice_tooth',
		duration: 1,
		remaining: 1,
		stacks: 1,
		maxStacks: 1,
		tickInterval: 0.5,
		tickTimer: 0.5,
		magnitude: 0.25,
	}],
};

describe('ItemProcSystem', () => {
	it('resolves seeded procs deterministically and starts cooldowns', () => {
		const runtime = [createItemProcRuntime(empProc)];
		const events: CombatEvent[] = [
			{ kind: 'hit', source: 'player', targetId: 'drone', time: 2, moveId: 'claw_jab' },
		];
		const first = resolveItemProcs(runtime, events, createItemProcRng('seed', 'run-a'), 0.016);
		const second = resolveItemProcs(runtime, events, createItemProcRng('seed', 'run-a'), 0.016);

		expect(first).toEqual(second);
		expect(first.events[0]).toMatchObject({
			kind: 'proc',
			procId: 'black-ice-spark',
			itemId: 'black_ice_tooth',
			triggerKind: 'hit',
			effects: { bonusDamage: 1, empPulse: true },
		});
		expect(first.events[0]?.statusOnProc?.[0]?.kind).toBe('emp');
		expect(first.runtime[0]?.state).toEqual({ procId: 'black-ice-spark', cooldownLeft: 0.5, triggers: 1 });
	});

	it('emits cooldown events instead of rolling while proc is cooling down', () => {
		const runtime = [{
			...createItemProcRuntime(empProc),
			state: { procId: 'black-ice-spark', cooldownLeft: 0.25, triggers: 1 },
		}];
		const result = resolveItemProcs(runtime, [{ kind: 'hit', time: 1 }], createItemProcRng('seed', 'run-a'), 0.1);

		expect(result.events).toEqual([{ kind: 'cooldown', procId: 'black-ice-spark', itemId: 'black_ice_tooth', triggerKind: 'hit' }]);
		expect(result.runtime[0]?.state.cooldownLeft).toBe(0.15);
	});

	it('records misses with stable rolls', () => {
		const never: ItemProcDefinition = { ...empProc, id: 'never', chance: 0, cooldown: undefined };
		const result = resolveItemProcs([createItemProcRuntime(never)], [{ kind: 'hit', time: 1 }], createItemProcRng('seed', 'run-b'), 0);

		expect(result.events[0]?.kind).toBe('miss');
		expect(result.events[0]?.roll).toBeGreaterThanOrEqual(0);
		expect(result.events[0]?.roll).toBeLessThanOrEqual(1);
	});
});

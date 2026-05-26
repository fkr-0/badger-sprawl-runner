import { describe, expect, it } from 'vitest';
import { createItemUseState, stepItemUseState, useItem, type ItemUseDefinition } from './ItemUseSystem';

const jammer: ItemUseDefinition = {
	itemId: 'signal_jammer',
	cooldown: 0.5,
	maxCharges: 2,
	rechargeTime: 1,
	effects: { traceReduction: 0.1, empPulse: true },
};

describe('ItemUseSystem', () => {
	it('uses charges, starts cooldown, and blocks reuse during cooldown deterministically', () => {
		const initial = createItemUseState(jammer);
		const used = useItem(jammer, initial, 2);
		const blocked = useItem(jammer, used.state, 2.1);

		expect(used.event).toEqual({ kind: 'used', itemId: 'signal_jammer', time: 2, effects: { traceReduction: 0.1, empPulse: true } });
		expect(used.state).toMatchObject({ charges: 1, cooldownLeft: 0.5, uses: 1 });
		expect(blocked.event).toEqual({ kind: 'cooldown', itemId: 'signal_jammer', time: 2.1 });
	});

	it('recharges spent charges on deterministic ticks', () => {
		const first = useItem(jammer, createItemUseState(jammer), 0).state;
		const stepped = stepItemUseState(jammer, first, 1, 1);

		expect(stepped.events).toEqual([{ kind: 'recharged', itemId: 'signal_jammer', time: 1 }]);
		expect(stepped.state.charges).toBe(2);
		expect(stepped.state.cooldownLeft).toBe(0);
	});

	it('reports empty items without mutating the use counter', () => {
		const single: ItemUseDefinition = { itemId: 'dub_shield', cooldown: 0, maxCharges: 1, effects: { shield: true } };
		const used = useItem(single, createItemUseState(single), 0);
		const empty = useItem(single, used.state, 1);

		expect(empty.event).toEqual({ kind: 'empty', itemId: 'dub_shield', time: 1 });
		expect(empty.state.uses).toBe(1);
	});
});

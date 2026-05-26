import { describe, expect, it } from 'vitest';
import type { CombatEvent } from './CombatSystem';
import type { ItemUseEvent } from './ItemUseSystem';
import { applyItemWearFromEvents, type ItemWearRule } from './ItemWearSystem';

const rules: ItemWearRule[] = [
	{ itemId: 'claws', onCombatKinds: ['hit', 'kill'], moveIdIncludes: 'claw', amount: 2 },
	{ itemId: 'signal_jammer', onItemUseKinds: ['used'], amount: 3 },
];

describe('ItemWearSystem', () => {
	it('applies combat and item-use wear deterministically from sorted events', () => {
		const combatEvents: CombatEvent[] = [
			{ kind: 'hit', moveId: 'claw_jab', time: 2 },
			{ kind: 'damage', moveId: 'acid', time: 1 },
			{ kind: 'kill', moveId: 'claw_cross', time: 3 },
		];
		const itemEvents: ItemUseEvent[] = [{ kind: 'used', itemId: 'signal_jammer', time: 4 }];
		const result = applyItemWearFromEvents([
			{ itemId: 'claws', durability: 5, maxDurability: 10, broken: false },
			{ itemId: 'signal_jammer', durability: 4, maxDurability: 8, broken: false },
		], rules, { combatEvents, itemEvents });

		expect(result.items).toEqual([
			{ itemId: 'claws', durability: 1, maxDurability: 10, broken: false },
			{ itemId: 'signal_jammer', durability: 1, maxDurability: 8, broken: false },
		]);
		expect(result.events).toEqual([
			{ kind: 'damaged', itemId: 'claws', amount: 2 },
			{ kind: 'damaged', itemId: 'claws', amount: 2 },
			{ kind: 'damaged', itemId: 'signal_jammer', amount: 3 },
		]);
	});

	it('does not wear already broken equipment', () => {
		const result = applyItemWearFromEvents([
			{ itemId: 'claws', durability: 0, maxDurability: 10, broken: true },
		], rules, { combatEvents: [{ kind: 'hit', moveId: 'claw_jab' }] });

		expect(result.items[0]?.durability).toBe(0);
		expect(result.events).toEqual([]);
	});
});

import { describe, expect, it } from 'vitest';
import { BASE_BADGER_STATS, aggregateItemStats, applyStatEffects, statDelta } from './ItemStatSystem';
import type { RolledItem } from './ItemAffixSystem';

const affixed: RolledItem = {
	seed: 's1',
	base: { id: 'boots', name: 'Boots', slot: 'movement', rarity: 'rare', tags: ['movement'], effect: 'run' },
	affixes: [],
	effects: { airControlBonus: 0.2, traceReduction: 0.1 },
};

describe('ItemStatSystem', () => {
	it('applies flat stat effects with deterministic clamps', () => {
		const stats = applyStatEffects(BASE_BADGER_STATS, { maxHp: 2, armor: 1, critChance: 2, traceReduction: 2 });

		expect(stats.maxHp).toBe(7);
		expect(stats.armor).toBe(1);
		expect(stats.critChance).toBe(1);
		expect(stats.traceReduction).toBe(1);
	});

	it('aggregates set bonuses, affixes, and flat effects in a stable order', () => {
		const stats = aggregateItemStats(BASE_BADGER_STATS, {
			setBonuses: [{ setId: 'invoice', setName: 'Invoice', pieces: 2, label: 'Audit', effects: { finisherDamageBonus: 1, airControlBonus: 0.1 } }],
			affixedItems: [affixed],
			flatEffects: [{ damage: 0.5, critDamage: 0.25 }],
		});

		expect(stats.damage).toBe(2.5);
		expect(stats.airControl).toBe(1.3);
		expect(stats.traceReduction).toBe(0.1);
		expect(statDelta(BASE_BADGER_STATS, stats).critDamage).toBe(0.25);
	});
});

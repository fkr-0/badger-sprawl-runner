import { describe, expect, it } from 'vitest';
import type { ItemDefinition } from './InventorySystem';
import { rollItemAffixes } from './ItemAffixSystem';

const katana: ItemDefinition = {
	id: 'katana',
	name: 'Katana',
	slot: 'melee_upgrade',
	rarity: 'epic',
	tags: ['melee', 'weapon'],
	effect: 'slash',
};

const boots: ItemDefinition = {
	id: 'bassline_boots',
	name: 'Bassline Boots',
	slot: 'movement',
	rarity: 'rare',
	tags: ['movement', 'beat'],
	effect: 'shockwave',
};

describe('ItemAffixSystem', () => {
	it('rolls the same seed and item into the same affixes and effects', () => {
		const first = rollItemAffixes(katana, 'run-17');
		const second = rollItemAffixes(katana, 'run-17');

		expect(first).toEqual(second);
		expect(first.affixes).toHaveLength(3);
		expect(Object.keys(first.effects).length).toBeGreaterThan(0);
	});

	it('filters affixes by item tags and slot', () => {
		const rolled = rollItemAffixes(boots, 'movement-seed');

		expect(rolled.affixes.length).toBe(2);
		expect(rolled.affixes.every((affix) => affix.tags.some((tag) => boots.tags.includes(tag) || boots.slot === tag))).toBe(true);
	});

	it('returns no affixes when no candidate matches', () => {
		const item: ItemDefinition = {
			id: 'story_relic', name: 'Story Relic', slot: 'meta', rarity: 'rare', tags: ['story'], effect: 'flag',
		};

		expect(rollItemAffixes(item, 'seed')).toMatchObject({ affixes: [], effects: {} });
	});
});

import { describe, expect, it } from 'vitest';
import type { ItemDefinition } from './InventorySystem';
import { equipItem, evaluateEquipment, unequipItem } from './EquipmentSystem';
import { BASE_BADGER_STATS } from './ItemStatSystem';

const claws: ItemDefinition = { id: 'claws', name: 'Claws', slot: 'melee', rarity: 'starter', tags: ['melee'], effect: 'slash' };
const katana: ItemDefinition = { id: 'katana', name: 'Katana', slot: 'melee', rarity: 'rare', tags: ['melee'], effect: 'draw' };
const boots: ItemDefinition = { id: 'boots', name: 'Boots', slot: 'movement', rarity: 'rare', tags: ['move'], effect: 'run' };

describe('EquipmentSystem', () => {
	it('equips items deterministically and replaces over-limit slots', () => {
		let state = { items: [] };
		state = equipItem(state, claws, { effects: { damage: 1 } });
		state = equipItem(state, katana, { effects: { damage: 2 } });
		state = equipItem(state, boots, { effects: { airControlBonus: 0.2 } });

		expect(state.items.map((item) => item.itemId)).toEqual(['katana', 'boots']);
		const report = evaluateEquipment(state, BASE_BADGER_STATS);
		expect(report.valid).toBe(true);
		expect(report.stats.damage).toBe(3);
		expect(report.stats.airControl).toBe(1.2);
	});

	it('reports broken equipped items and excludes their effects', () => {
		const state = equipItem({ items: [] }, claws, {
			durability: { itemId: 'claws', durability: 0, maxDurability: 10, broken: true },
			effects: { damage: 5 },
		});
		const report = evaluateEquipment(state, BASE_BADGER_STATS);

		expect(report.valid).toBe(false);
		expect(report.violations).toEqual(['broken:claws']);
		expect(report.stats.damage).toBe(1);
	});

	it('unequips items immutably', () => {
		const state = equipItem({ items: [] }, boots, { effects: { airControlBonus: 0.2 } });
		const next = unequipItem(state, 'boots');
		expect(next.items).toEqual([]);
		expect(state.items).toHaveLength(1);
	});
});

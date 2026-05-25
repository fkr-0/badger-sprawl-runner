import { describe, expect, it } from 'vitest';
import { InventorySystem, type ItemDefinition } from './InventorySystem';

const catalog: ItemDefinition[] = [
	{ id: 'rocket_backpack', name: 'Rocket Backpack', slot: 'active', rarity: 'core', tags: ['movement'], effect: 'burst' },
	{ id: 'bassline_boots', name: 'Bassline Boots', slot: 'movement', rarity: 'uncommon', tags: ['beat'], effect: 'shockwave' },
	{ id: 'gravity_talisman', name: 'Gravity Talisman', slot: 'boon', rarity: 'rare', tags: ['air'], effect: 'flip' },
	{ id: 'signal_jammer', name: 'Signal Jammer', slot: 'active', rarity: 'uncommon', tags: ['hack'], effect: 'jam' },
	{ id: 'stim_pack', name: 'Stim Pack', slot: 'consumable', rarity: 'core', tags: ['heal'], effect: 'heal', maxStack: 3 },
];

describe('InventorySystem', () => {
	it('caps stacks and supports deterministic add/remove operations', () => {
		const inventory = new InventorySystem(catalog);

		inventory.addItem('stim_pack', 2);
		inventory.addItem('stim_pack', 5);

		expect(inventory.getEntries()).toContainEqual({ itemId: 'stim_pack', quantity: 3, equipped: false });
		expect(inventory.removeItem('stim_pack', 2)).toBe(true);
		expect(inventory.getEntries()).toContainEqual({ itemId: 'stim_pack', quantity: 1, equipped: false });
	});

	it('enforces one equipped item per exclusive slot', () => {
		const inventory = new InventorySystem(catalog);
		inventory.addItem('rocket_backpack');
		inventory.addItem('signal_jammer');

		expect(inventory.equip('rocket_backpack')).toBe(true);
		expect(inventory.equip('signal_jammer')).toBe(true);

		expect(inventory.getEquippedItemIds()).toEqual(['signal_jammer']);
	});

	it('summarizes equipped item set bonuses and missing pieces', () => {
		const inventory = new InventorySystem(catalog);
		for (const item of ['rocket_backpack', 'bassline_boots', 'gravity_talisman']) {
			inventory.addItem(item);
			inventory.equip(item);
		}

		const summary = inventory.buildLoadoutSummary();

		expect(summary.equippedItemIds).toEqual(['bassline_boots', 'gravity_talisman', 'rocket_backpack']);
		expect(summary.activeBonuses.map((bonus) => bonus.label)).toEqual(['Cleaner landings', 'Sprawl flight line']);
		expect(summary.effects.landingShockwave).toBe(true);
		expect(summary.effects.fuelRefundOnCombo).toBe(1);
	});
});

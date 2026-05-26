import { describe, expect, it } from 'vitest';
import type { ItemDefinition, LoadoutSummary } from './InventorySystem';
import { validateLoadoutBudget } from './LoadoutBudgetSystem';

const catalog: ItemDefinition[] = [
	{ id: 'rocket_backpack', name: 'Rocket Backpack', slot: 'active', rarity: 'rare', tags: ['movement'], effect: 'dash' },
	{ id: 'signal_jammer', name: 'Signal Jammer', slot: 'active', rarity: 'uncommon', tags: ['hack'], effect: 'jam' },
	{ id: 'claws', name: 'Claws', slot: 'melee', rarity: 'starter', tags: ['melee'], effect: 'slash' },
	{ id: 'katana', name: 'Katana', slot: 'melee_upgrade', rarity: 'rare', tags: ['weapon'], effect: 'draw' },
	{ id: 'gravity_talisman', name: 'Gravity Talisman', slot: 'boon', rarity: 'epic', tags: ['air'], effect: 'flip' },
];

function summary(equippedItemIds: string[]): LoadoutSummary {
	return { ownedItemIds: equippedItemIds, equippedItemIds, activeBonuses: [], effects: {}, missingSetPieces: [] };
}

describe('LoadoutBudgetSystem', () => {
	it('accepts a valid first-release loadout budget', () => {
		const report = validateLoadoutBudget(summary(['rocket_backpack', 'claws', 'katana']), catalog);

		expect(report.valid).toBe(true);
		expect(report.totalCost).toBe(6);
		expect(report.counts.active).toBe(1);
	});

	it('reports deterministic violations for unknown items, slot caps, and total budget', () => {
		const report = validateLoadoutBudget(
			summary(['rocket_backpack', 'signal_jammer', 'claws', 'katana', 'gravity_talisman', 'missing']),
			catalog,
			{ maxItems: 8, maxActive: 1, maxWeapons: 1, maxBoons: 3, maxBudget: 5, costByRarity: { starter: 0, uncommon: 2, rare: 3, epic: 5 } }
		);

		expect(report.valid).toBe(false);
		expect(report.violations).toEqual(['unknown:missing', 'maxActive:2/1', 'maxWeapons:2/1', 'maxBudget:13/5']);
	});
});

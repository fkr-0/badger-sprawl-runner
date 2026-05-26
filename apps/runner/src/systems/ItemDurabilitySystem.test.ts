import { describe, expect, it } from 'vitest';
import { damageDurability, getRepairCost, repairDurability, repairWithResources, type DurableItemState } from './ItemDurabilitySystem';

const claws: DurableItemState = { itemId: 'claws', durability: 12, maxDurability: 30, broken: false };

describe('ItemDurabilitySystem', () => {
	it('damages and breaks items deterministically', () => {
		const result = damageDurability(claws, 15);

		expect(result.item).toEqual({ itemId: 'claws', durability: 0, maxDurability: 30, broken: true });
		expect(result.events).toEqual([
			{ kind: 'damaged', itemId: 'claws', amount: 12 },
			{ kind: 'broken', itemId: 'claws', amount: 0 },
		]);
	});

	it('repairs items and computes deterministic resource costs', () => {
		const repaired = repairDurability(claws, 8);
		expect(repaired.item.durability).toBe(20);
		expect(getRepairCost(claws)).toEqual({ resourceId: 'scrap', quantity: 2 });

		const withResources = repairWithResources(claws, { scrap: 5 });
		expect(withResources.ok).toBe(true);
		expect(withResources.resources.scrap).toBe(3);
		expect(withResources.item.durability).toBe(30);
	});

	it('refuses repairs when resources are insufficient without mutating state', () => {
		const result = repairWithResources(claws, { scrap: 1 });
		expect(result.ok).toBe(false);
		expect(result.item).toEqual(claws);
		expect(result.resources.scrap).toBe(1);
	});
});

import { describe, expect, it } from 'vitest';
import { BASE_BADGER_STATS } from './ItemStatSystem';
import { applyUpgradeLevel, canUpgradeItem, getUpgradeCost, upgradeItem, type ItemUpgradeCurve } from './ItemUpgradeCurve';

const curve: ItemUpgradeCurve = {
	id: 'claw-edge',
	maxLevel: 3,
	costItemId: 'scrap',
	baseCost: 2,
	costGrowth: 1.5,
	effectsPerLevel: { damage: 0.5, critChance: 0.1 },
};

describe('ItemUpgradeCurve', () => {
	it('computes deterministic upgrade costs and stat levels', () => {
		expect(getUpgradeCost(curve, 0)).toEqual({ itemId: 'scrap', quantity: 2 });
		expect(getUpgradeCost(curve, 2)).toEqual({ itemId: 'scrap', quantity: 5 });
		const stats = applyUpgradeLevel(BASE_BADGER_STATS, curve, 2);
		expect(stats.damage).toBe(2);
		expect(stats.critChance).toBe(0.2);
	});

	it('upgrades items while consuming resources without mutating inputs', () => {
		const state = { itemId: 'claws', curveId: 'claw-edge', level: 0 };
		const resources = { scrap: 3 };
		const result = upgradeItem(state, curve, resources);

		expect(result.ok).toBe(true);
		expect(result.state.level).toBe(1);
		expect(result.resources.scrap).toBe(1);
		expect(state.level).toBe(0);
		expect(resources.scrap).toBe(3);
	});

	it('reports max-level and missing-resource failures deterministically', () => {
		expect(canUpgradeItem({ itemId: 'claws', curveId: 'claw-edge', level: 3 }, curve, { scrap: 99 }).reason).toBe('max-level');
		expect(canUpgradeItem({ itemId: 'claws', curveId: 'claw-edge', level: 1 }, curve, { scrap: 1 }).reason).toBe('missing:scrap');
	});
});

import type { ItemDefinition, LoadoutSummary } from './InventorySystem';

export interface LoadoutBudgetRule {
	maxItems: number;
	maxActive: number;
	maxWeapons: number;
	maxBoons: number;
	maxBudget: number;
	costByRarity: Record<string, number>;
}

export interface LoadoutBudgetReport {
	valid: boolean;
	totalCost: number;
	violations: string[];
	counts: Record<string, number>;
}

export const FIRST_RELEASE_BUDGET_RULE: LoadoutBudgetRule = {
	maxItems: 8,
	maxActive: 1,
	maxWeapons: 2,
	maxBoons: 3,
	maxBudget: 12,
	costByRarity: {
		core: 0,
		starter: 0,
		common: 1,
		uncommon: 2,
		rare: 3,
		epic: 5,
	},
};

function countSlot(slot: string, counts: Record<string, number>): void {
	counts[slot] = (counts[slot] ?? 0) + 1;
}

export function validateLoadoutBudget(
	summary: LoadoutSummary,
	catalog: readonly ItemDefinition[],
	rule: LoadoutBudgetRule = FIRST_RELEASE_BUDGET_RULE
): LoadoutBudgetReport {
	const byId = new Map(catalog.map((item) => [item.id, item]));
	const violations: string[] = [];
	const counts: Record<string, number> = {};
	let totalCost = 0;

	for (const itemId of summary.equippedItemIds) {
		const item = byId.get(itemId);
		if (!item) {
			violations.push(`unknown:${itemId}`);
			continue;
		}
		countSlot(item.slot, counts);
		totalCost += rule.costByRarity[item.rarity] ?? 1;
	}

	const weaponCount = (counts.weapon ?? 0) + (counts.melee ?? 0) + (counts.melee_upgrade ?? 0);
	if (summary.equippedItemIds.length > rule.maxItems) violations.push(`maxItems:${summary.equippedItemIds.length}/${rule.maxItems}`);
	if ((counts.active ?? 0) > rule.maxActive) violations.push(`maxActive:${counts.active}/${rule.maxActive}`);
	if (weaponCount > rule.maxWeapons) violations.push(`maxWeapons:${weaponCount}/${rule.maxWeapons}`);
	if ((counts.boon ?? 0) > rule.maxBoons) violations.push(`maxBoons:${counts.boon}/${rule.maxBoons}`);
	if (totalCost > rule.maxBudget) violations.push(`maxBudget:${totalCost}/${rule.maxBudget}`);

	return {
		valid: violations.length === 0,
		totalCost,
		violations,
		counts,
	};
}

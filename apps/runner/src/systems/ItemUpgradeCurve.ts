import type { StatBlock, StatEffectMap } from './ItemStatSystem';
import { applyStatEffects } from './ItemStatSystem';

export interface ItemUpgradeCurve {
	id: string;
	maxLevel: number;
	costItemId: string;
	baseCost: number;
	costGrowth: number;
	effectsPerLevel: StatEffectMap;
}

export interface ItemUpgradeState {
	itemId: string;
	curveId: string;
	level: number;
}

export interface ItemUpgradeCost {
	itemId: string;
	quantity: number;
}

export function getUpgradeCost(curve: ItemUpgradeCurve, level: number): ItemUpgradeCost {
	if (!Number.isInteger(level) || level < 0) throw new Error(`Invalid upgrade level: ${level}`);
	return {
		itemId: curve.costItemId,
		quantity: Math.ceil(curve.baseCost * curve.costGrowth ** level),
	};
}

export function canUpgradeItem(state: ItemUpgradeState, curve: ItemUpgradeCurve, resources: Record<string, number>): { ok: boolean; reason?: string; cost: ItemUpgradeCost } {
	const cost = getUpgradeCost(curve, state.level);
	if (state.curveId !== curve.id) return { ok: false, reason: `curve-mismatch:${state.curveId}`, cost };
	if (state.level >= curve.maxLevel) return { ok: false, reason: 'max-level', cost };
	if ((resources[cost.itemId] ?? 0) < cost.quantity) return { ok: false, reason: `missing:${cost.itemId}`, cost };
	return { ok: true, cost };
}

export function applyUpgradeLevel(base: StatBlock, curve: ItemUpgradeCurve, level: number): StatBlock {
	let stats = { ...base };
	for (let index = 0; index < level; index += 1) {
		stats = applyStatEffects(stats, curve.effectsPerLevel);
	}
	return stats;
}

export function upgradeItem(state: ItemUpgradeState, curve: ItemUpgradeCurve, resources: Record<string, number>): { ok: boolean; state: ItemUpgradeState; resources: Record<string, number>; reason?: string; cost: ItemUpgradeCost } {
	const check = canUpgradeItem(state, curve, resources);
	if (!check.ok) return { ok: false, state: { ...state }, resources: { ...resources }, reason: check.reason, cost: check.cost };
	return {
		ok: true,
		state: { ...state, level: state.level + 1 },
		resources: { ...resources, [check.cost.itemId]: (resources[check.cost.itemId] ?? 0) - check.cost.quantity },
		cost: check.cost,
	};
}

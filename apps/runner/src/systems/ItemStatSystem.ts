import type { ItemSetBonus } from './ItemSetSystem';
import type { RolledItem } from './ItemAffixSystem';

export interface StatBlock {
	maxHp: number;
	damage: number;
	armor: number;
	airControl: number;
	cooldownRate: number;
	critChance: number;
	critDamage: number;
	traceReduction: number;
}

export const BASE_BADGER_STATS: StatBlock = {
	maxHp: 5,
	damage: 1,
	armor: 0,
	airControl: 1,
	cooldownRate: 1,
	critChance: 0,
	critDamage: 1.5,
	traceReduction: 0,
};

export type StatEffectMap = Partial<Record<keyof StatBlock, number>> & Record<string, number | boolean | string | undefined>;

function asNumber(value: number | boolean | string | undefined): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function applyStatEffects(stats: StatBlock, effects: StatEffectMap): StatBlock {
	return {
		maxHp: Math.max(1, stats.maxHp + asNumber(effects.maxHp)),
		damage: Math.max(0, stats.damage + asNumber(effects.damage) + asNumber(effects.finisherDamageBonus)),
		armor: Math.max(0, stats.armor + asNumber(effects.armor)),
		airControl: Math.max(0, stats.airControl + asNumber(effects.airControl) + asNumber(effects.airControlBonus)),
		cooldownRate: Math.max(0.1, stats.cooldownRate + asNumber(effects.cooldownRate)),
		critChance: Math.max(0, Math.min(1, stats.critChance + asNumber(effects.critChance))),
		critDamage: Math.max(1, stats.critDamage + asNumber(effects.critDamage)),
		traceReduction: Math.max(0, Math.min(1, stats.traceReduction + asNumber(effects.traceReduction))),
	};
}

export function aggregateItemStats(
	base: StatBlock,
	inputs: {
		setBonuses?: readonly ItemSetBonus[];
		affixedItems?: readonly RolledItem[];
		flatEffects?: readonly StatEffectMap[];
	} = {}
): StatBlock {
	let stats = { ...base };
	for (const bonus of inputs.setBonuses ?? []) stats = applyStatEffects(stats, bonus.effects as StatEffectMap);
	for (const item of inputs.affixedItems ?? []) stats = applyStatEffects(stats, item.effects as StatEffectMap);
	for (const effects of inputs.flatEffects ?? []) stats = applyStatEffects(stats, effects);
	return stats;
}

export function statDelta(before: StatBlock, after: StatBlock): StatBlock {
	return {
		maxHp: after.maxHp - before.maxHp,
		damage: after.damage - before.damage,
		armor: after.armor - before.armor,
		airControl: after.airControl - before.airControl,
		cooldownRate: after.cooldownRate - before.cooldownRate,
		critChance: after.critChance - before.critChance,
		critDamage: after.critDamage - before.critDamage,
		traceReduction: after.traceReduction - before.traceReduction,
	};
}

import {
	createDeterministicRng,
	rngInt,
	rngPick,
	rngRange,
	type DeterministicRngState,
} from '@badger/platformer-core';
import type { ItemDefinition } from './InventorySystem';

export interface ItemAffixDefinition {
	id: string;
	label: string;
	tags: string[];
	weight: number;
	effects: Record<string, number | boolean | string>;
}

export interface RolledItemAffix extends ItemAffixDefinition {
	roll: number;
}

export interface RolledItem {
	base: ItemDefinition;
	seed: string;
	affixes: RolledItemAffix[];
	effects: Record<string, number | boolean | string>;
}

export const FIRST_RELEASE_AFFIXES: ItemAffixDefinition[] = [
	{ id: 'quickened', label: 'Quickened', tags: ['movement', 'melee'], weight: 4, effects: { airControlBonus: 0.05 } },
	{ id: 'barbed', label: 'Barbed', tags: ['melee'], weight: 3, effects: { bleedMagnitude: 1 } },
	{ id: 'grounded', label: 'Grounded', tags: ['defense', 'beat'], weight: 3, effects: { damageMitigation: 0.05 } },
	{ id: 'overclocked', label: 'Overclocked', tags: ['hack', 'active'], weight: 2, effects: { traceReduction: 0.08, burnTrailDamage: 1 } },
	{ id: 'weighted', label: 'Weighted', tags: ['weapon', 'melee'], weight: 2, effects: { poiseDamageBonus: 1 } },
];

function mergeEffects(affixes: readonly RolledItemAffix[]): Record<string, number | boolean | string> {
	const merged: Record<string, number | boolean | string> = {};
	for (const affix of affixes) {
		for (const [key, value] of Object.entries(affix.effects)) {
			const previous = merged[key];
			if (typeof value === 'number' && typeof previous === 'number') merged[key] = previous + value * affix.roll;
			else if (typeof value === 'number') merged[key] = value * affix.roll;
			else if (typeof value === 'boolean' && typeof previous === 'boolean') merged[key] = previous || value;
			else merged[key] = value;
		}
	}
	return merged;
}

function matchingAffixes(item: ItemDefinition, affixes: readonly ItemAffixDefinition[]): ItemAffixDefinition[] {
	return affixes.filter((affix) => affix.tags.some((tag) => item.tags.includes(tag) || item.slot === tag));
}

function weightedPick(state: DeterministicRngState, affixes: readonly ItemAffixDefinition[]) {
	const total = affixes.reduce((sum, affix) => sum + affix.weight, 0);
	const roll = rngRange(state, 0, total);
	let cursor = roll.value;
	for (const affix of affixes) {
		cursor -= affix.weight;
		if (cursor <= 0) return { state: roll.state, value: affix };
	}
	return { state: roll.state, value: affixes[affixes.length - 1] as ItemAffixDefinition };
}

export function rollItemAffixes(
	item: ItemDefinition,
	seed: string,
	affixes: readonly ItemAffixDefinition[] = FIRST_RELEASE_AFFIXES
): RolledItem {
	let state = createDeterministicRng(`${seed}:${item.id}`);
	const candidates = matchingAffixes(item, affixes);
	if (candidates.length === 0) return { base: item, seed, affixes: [], effects: {} };

	const rarityAffixCount: Record<string, number> = { core: 0, starter: 0, common: 1, uncommon: 1, rare: 2, epic: 3 };
	const maxCount = Math.min(candidates.length, rarityAffixCount[item.rarity] ?? 1);
	const countRoll = rngInt(state, Math.min(1, maxCount), Math.max(1, maxCount));
	state = countRoll.state;

	const selected: RolledItemAffix[] = [];
	let pool = [...candidates];
	for (let index = 0; index < maxCount; index += 1) {
		const picked = weightedPick(state, pool);
		state = picked.state;
		const roll = rngRange(state, 0.85, 1.15);
		state = roll.state;
		selected.push({ ...picked.value, roll: Number(roll.value.toFixed(3)) });
		pool = pool.filter((candidate) => candidate.id !== picked.value.id);
	}

	return { base: item, seed, affixes: selected, effects: mergeEffects(selected) };
}

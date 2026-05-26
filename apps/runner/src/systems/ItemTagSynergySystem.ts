import type { StatEffectMap } from './ItemStatSystem';

export interface TaggedBuildItem {
	itemId: string;
	tags: string[];
}

export interface TagSynergyDefinition {
	id: string;
	requiredTags: Record<string, number>;
	effects: StatEffectMap;
	label: string;
}

export interface TagSynergyResult {
	activeSynergies: TagSynergyDefinition[];
	tagCounts: Record<string, number>;
	effects: StatEffectMap;
}

export function countBuildTags(items: readonly TaggedBuildItem[]): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const item of [...items].sort((a, b) => a.itemId.localeCompare(b.itemId))) {
		for (const tag of [...item.tags].sort()) counts[tag] = (counts[tag] ?? 0) + 1;
	}
	return counts;
}

function mergeEffects(target: StatEffectMap, source: StatEffectMap): StatEffectMap {
	const next: StatEffectMap = { ...target };
	for (const [key, value] of Object.entries(source).sort(([a], [b]) => a.localeCompare(b))) {
		const previous = next[key];
		if (typeof value === 'number' && typeof previous === 'number') next[key] = previous + value;
		else next[key] = value;
	}
	return next;
}

export function resolveTagSynergies(items: readonly TaggedBuildItem[], synergies: readonly TagSynergyDefinition[]): TagSynergyResult {
	const tagCounts = countBuildTags(items);
	const activeSynergies = [...synergies]
		.sort((a, b) => a.id.localeCompare(b.id))
		.filter((synergy) => Object.entries(synergy.requiredTags).every(([tag, count]) => (tagCounts[tag] ?? 0) >= count));
	let effects: StatEffectMap = {};
	for (const synergy of activeSynergies) effects = mergeEffects(effects, synergy.effects);
	return { activeSynergies, tagCounts, effects };
}

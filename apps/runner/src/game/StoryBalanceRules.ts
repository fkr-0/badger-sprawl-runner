import { ShopEngine } from '@badger/progression';
import type { MetaState, StoryProgress } from './GameFlow';

export interface StoryBalanceRules {
	merchantPriceModifier: number;
	allyAssistLevel: 'none' | 'low' | 'standard' | 'high';
	hazardIntensity: 'low' | 'standard' | 'high' | 'extreme';
	endingTone: 'undecided' | 'mercy' | 'public-tools' | 'collective-control' | 'abolition' | 'heated-supplier';
	activeReasons: string[];
}

export function buildStoryBalanceRules(meta: MetaState, progress: StoryProgress): StoryBalanceRules {
	const merchantPriceModifier = new ShopEngine().getPriceModifier(
		meta.orbitHeat,
		meta.dubFavor,
		getGuileFromSkills(meta.purchasedSkills)
	);
	const activeReasons = getActiveReasons(meta, progress);
	return {
		merchantPriceModifier,
		allyAssistLevel: getAllyAssistLevel(meta, progress),
		hazardIntensity: getHazardIntensity(meta.orbitHeat),
		endingTone: getEndingTone(meta, progress),
		activeReasons,
	};
}

function getGuileFromSkills(purchasedSkills: readonly string[]): number {
	return purchasedSkills.filter((skillId) =>
		['silver_tongue', 'black_market_map', 'merchant_patience'].includes(skillId)
	).length;
}

function getAllyAssistLevel(meta: MetaState, progress: StoryProgress): StoryBalanceRules['allyAssistLevel'] {
	if (progress.resultFlags.includes('lio_baited') || meta.dubFavor < -1) return 'low';
	if (progress.resultFlags.includes('lio_protected') || progress.resultFlags.includes('colony_alignment_chorus')) {
		return meta.dubFavor >= 3 ? 'high' : 'standard';
	}
	return meta.dubFavor > 0 ? 'standard' : 'none';
}

function getHazardIntensity(orbitHeat: number): StoryBalanceRules['hazardIntensity'] {
	if (orbitHeat >= 6) return 'extreme';
	if (orbitHeat >= 3) return 'high';
	if (orbitHeat <= -1) return 'low';
	return 'standard';
}

function getEndingTone(meta: MetaState, progress: StoryProgress): StoryBalanceRules['endingTone'] {
	if (progress.finalBroadcastDoctrine === 'publish-tools') return 'public-tools';
	if (progress.finalBroadcastDoctrine === 'chorus-control') return 'collective-control';
	if (progress.finalBroadcastDoctrine === 'abolish-skylock') return 'abolition';
	if (progress.lioTrust === 'protected') return 'mercy';
	if (progress.colonyAlignment === 'supplier' || (meta.orbitHeat > 3 && meta.dubFavor > 2)) return 'heated-supplier';
	return 'undecided';
}

function getActiveReasons(meta: MetaState, progress: StoryProgress): string[] {
	const reasons = [`heat:${meta.orbitHeat}`, `favor:${meta.dubFavor}`];
	if (progress.lioTrust) reasons.push(`lio:${progress.lioTrust}`);
	if (progress.colonyAlignment) reasons.push(`colony:${progress.colonyAlignment}`);
	if (progress.finalBroadcastDoctrine) reasons.push(`broadcast:${progress.finalBroadcastDoctrine}`);
	if (progress.resultFlags.includes('ledger_public_dump')) reasons.push('ledger:public');
	if (progress.resultFlags.includes('cargo_full_release')) reasons.push('cargo:full-release');
	return reasons;
}

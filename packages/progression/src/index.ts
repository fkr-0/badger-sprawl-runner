/**
 * @badger/progression -- Meta-progression, run aggregation, shop, skill tree
 */

export { RunAggregator, createRunState, finalizeRun } from './RunAggregator';
export { MetaProgression, createMetaState, persistMeta, loadMeta } from './MetaProgression';
export { ShopEngine } from './ShopEngine';
export {
	FIRST_RELEASE_SKILL_NODES,
	FIRST_RELEASE_SKILL_TRACKS,
	SKILL_TRACK_PRESENTATION,
	SkillTree,
	createSkillTree,
	hydrateSkillTree,
	purchaseSkillWithMeta,
	resolveSkillEffects,
} from './SkillTree';
export type { ResolvedSkillEffects, SkillTrackId } from './SkillTree';
export { BoonPool, createBoonPool, PREDEFINED_BOONS } from './BoonPool';

export { computeDerivedStats } from './derivedStats';
export type { SkillPurchaseFailure, SkillPurchaseResult } from './SkillTree';

export type {
	RunState,
	MetaState,
	Currency,
	Boon,
	ShopItem,
	DerivedStats,
	SkillNode,
	RunResult,
} from './types';
export type { ShopOffer } from './ShopEngine';

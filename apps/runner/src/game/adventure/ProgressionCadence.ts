import { FIRST_RELEASE_SKILL_NODES } from '@badger/progression';
import { CAMPAIGN } from '../Campaign';
import { levelForExperience } from './AdventureState';
import { QUEST_CATALOG, type QuestDef, type QuestKind } from './QuestCatalog';
import { calculateResolutionExperience } from './ResolutionRewardDirector';

const STORY_STAGE_IDS = [
	'lower-sprawl',
	'drainmarket',
	'chrome-arcology',
	'mirror-palace',
	'dub-colony',
	'antenna-barrens',
	'orbital-lift',
	'asteroid-redoubt',
] as const;

const QUEST_KIND_BASE_XP: Record<QuestKind, number> = {
	main: 55,
	companion: 45,
	side: 35,
	contract: 20,
};

export interface ProgressionCadenceSnapshot {
	storyStageExperience: number;
	criticalQuestExperience: number;
	optionalQuestExperience: number;
	serviceMasteryExperience: number;
	criticalPathExperience: number;
	completionistExperience: number;
	criticalPathLevel: number;
	completionistLevel: number;
	campaignBlueprintShards: number;
	skillNodeCount: number;
	fullSkillTreeCost: number;
	minimumCapstonePathCost: number;
	supportsFirstCapstone: boolean;
	milestones: Array<{ afterStageId: string; cumulativeExperience: number; level: number }>;
}

export function calculateQuestCompletionExperience(quest: QuestDef): number {
	const structuralDepth = Math.min(8, quest.steps.length) * 5;
	const consequenceWeight = quest.consequences.length > 1 ? 10 : 0;
	return QUEST_KIND_BASE_XP[quest.kind] + structuralDepth + consequenceWeight;
}

export function buildProgressionCadence(): ProgressionCadenceSnapshot {
	const storyStageExperience = STORY_STAGE_IDS.reduce(
		(total, stageId, index) =>
			total +
			calculateResolutionExperience({
				resolutionId: `cadence:${stageId}`,
				stageId,
				threatRank: Math.min(5, index + 1) as 1 | 2 | 3 | 4 | 5,
				majorObjective: true,
				approaches: [],
			}),
		0
	);
	const criticalQuests = QUEST_CATALOG.filter((quest) => quest.kind === 'main');
	const optionalQuests = QUEST_CATALOG.filter((quest) => quest.kind !== 'main');
	const criticalQuestExperience = criticalQuests.reduce(
		(total, quest) => total + calculateQuestCompletionExperience(quest),
		0
	);
	const optionalQuestExperience = optionalQuests.reduce(
		(total, quest) => total + calculateQuestCompletionExperience(quest),
		0
	);
	const serviceMasteryExperience = 15 + 25 + 25 + 20 + 30 + 20 + 30;
	const criticalPathExperience = storyStageExperience + criticalQuestExperience;
	const completionistExperience =
		criticalPathExperience + optionalQuestExperience + serviceMasteryExperience;
	const campaignBlueprintShards = CAMPAIGN.stages.reduce(
		(total, stage) =>
			total +
			(stage.rewards.includes('two_blueprint_shards')
				? 2
				: stage.rewards.includes('blueprint_shard')
					? 1
					: 0),
		0
	);
	const fullSkillTreeCost = FIRST_RELEASE_SKILL_NODES.reduce(
		(total, node) => total + node.cost,
		0
	);
	const minimumCapstonePathCost = Math.min(
		...FIRST_RELEASE_SKILL_NODES.filter((node) => node.tier === 4).map((node) =>
			skillClosureCost(node.id)
		)
	);
	let cumulativeExperience = 0;
	const milestones = STORY_STAGE_IDS.map((stageId, index) => {
		cumulativeExperience += calculateResolutionExperience({
			resolutionId: `cadence:${stageId}`,
			stageId,
			threatRank: Math.min(5, index + 1) as 1 | 2 | 3 | 4 | 5,
			majorObjective: true,
			approaches: [],
		});
		const districtMain = criticalQuests.find(
			(quest) => quest.districtId === stageId && quest.id !== 'main:the-city-moves'
		);
		if (districtMain) cumulativeExperience += calculateQuestCompletionExperience(districtMain);
		if (stageId === 'asteroid-redoubt') {
			const global = criticalQuests.find((quest) => quest.id === 'main:the-city-moves');
			if (global) cumulativeExperience += calculateQuestCompletionExperience(global);
		}
		return {
			afterStageId: stageId,
			cumulativeExperience,
			level: levelForExperience(cumulativeExperience),
		};
	});
	return {
		storyStageExperience,
		criticalQuestExperience,
		optionalQuestExperience,
		serviceMasteryExperience,
		criticalPathExperience,
		completionistExperience,
		criticalPathLevel: levelForExperience(criticalPathExperience),
		completionistLevel: levelForExperience(completionistExperience),
		campaignBlueprintShards,
		skillNodeCount: FIRST_RELEASE_SKILL_NODES.length,
		fullSkillTreeCost,
		minimumCapstonePathCost,
		supportsFirstCapstone: campaignBlueprintShards >= minimumCapstonePathCost,
		milestones,
	};
}

function skillClosureCost(skillId: string): number {
	const byId = new Map(FIRST_RELEASE_SKILL_NODES.map((node) => [node.id, node]));
	const required = new Set<string>();
	const visit = (id: string): void => {
		if (required.has(id)) return;
		const node = byId.get(id);
		if (!node) return;
		required.add(id);
		for (const prereq of node.prereqs) visit(prereq);
	};
	visit(skillId);
	return [...required].reduce((total, id) => total + (byId.get(id)?.cost ?? 0), 0);
}

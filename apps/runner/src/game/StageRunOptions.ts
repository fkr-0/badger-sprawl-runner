import { EncounterGenerator } from '../procgen/EncounterGenerator';
import { SideRoomGenerator } from '../procgen/SideRoomGenerator';
import type { StageRunSceneOptions } from '../scenes/StageRunScene';
import { isRuntimeStageId } from '../world/stageLayoutRegistry';
import type { GameFlow } from './GameFlow';
import { buildStageRuntimeConfig } from './StageRuntimeConfig';
import { buildStoryBalanceRules } from './StoryBalanceRules';

function phaseLabel(value: string): string {
	return value
		.split(/[-_]/)
		.filter(Boolean)
		.map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
		.join(' ');
}

export function buildStageRunSceneOptions(flow: GameFlow): StageRunSceneOptions {
	const stage = flow.getCurrentStage();
	const storyProgress = flow.getStoryProgress();
	const meta = flow.getMeta();
	const balanceRules = buildStoryBalanceRules(meta, storyProgress);
	const runtimeConfig = buildStageRuntimeConfig(stage);
	const branchGameplayHooks = stage
		? flow.getActiveBranchConsequences(stage.id).map((consequence) => consequence.gameplayHook)
		: [];

	const stageId = stage && isRuntimeStageId(stage.id) ? stage.id : undefined;
	const procgenSeed = `${stageId ?? 'lower-sprawl'}:${storyProgress.completedStageIds.length}:${storyProgress.resultFlags.join('|')}`;
	const generatedEnemyPacks = stageId
		? new EncounterGenerator().generatePacks(
				{ stageId, seed: procgenSeed, gameplayHooks: branchGameplayHooks },
				1
			)
		: [];
	const generatedSideRooms = stageId
		? new SideRoomGenerator().generateSideRooms({
				stageId,
				seed: procgenSeed,
				count: 1,
				gameplayHooks: branchGameplayHooks,
			})
		: [];
	const boss = stage?.boss;
	const bossPhases =
		boss?.phases?.map((phase) => ({ ...phase })) ??
		boss?.behavior?.phases.map((phase) => ({
			id: phase.id,
			label: phaseLabel(phase.id),
			mechanic: phase.mechanic,
		})) ??
		boss?.hackDuel?.mechanics.map((mechanic, index) => ({
			id: `hack-duel-${index + 1}`,
			label: `${boss.hackDuel?.label ?? 'Hack Duel'} ${index + 1}`,
			mechanic,
		})) ??
		[];

	return {
		stageId,
		acquiredPayloadIds: storyProgress.acquiredPayloads,
		storyResultFlags: storyProgress.resultFlags,
		branchGameplayHooks,
		balanceRules,
		runtimeConfig,
		procgenSeed,
		unlockedSkills: meta.purchasedSkills,
		skillRanks: meta.skillRanks,
		generatedEnemyPacks,
		generatedSideRooms,
		bossPhases,
		bossPlaceholder: boss
			? {
					id: boss.id,
					name: boss.name,
					argument: boss.argument,
					phaseCount: boss.phaseCount,
				}
			: undefined,
		tutorialBeats: stage?.tutorialBeats?.map((beat) => ({ ...beat })) ?? [],
		onStoryPayloadCollected: undefined,
	};
}

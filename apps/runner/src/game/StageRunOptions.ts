import { EncounterGenerator } from '../procgen/EncounterGenerator';
import { SideRoomGenerator } from '../procgen/SideRoomGenerator';
import type { StageRunSceneOptions } from '../scenes/StageRunScene';
import { isRuntimeStageId } from '../world/stageLayoutRegistry';
import type { GameFlow } from './GameFlow';

export function buildStageRunSceneOptions(flow: GameFlow): StageRunSceneOptions {
	const stage = flow.getCurrentStage();
	const storyProgress = flow.getStoryProgress();
	const branchGameplayHooks = stage
		? flow.getActiveBranchConsequences(stage.id).map((consequence) => consequence.gameplayHook)
		: [];

	const stageId = stage && isRuntimeStageId(stage.id) ? stage.id : undefined;
	const procgenSeed = `${stageId ?? 'lower-sprawl'}:${storyProgress.completedStageIds.length}:${storyProgress.resultFlags.join('|')}`;
	const generatedEnemyPacks = stageId
		? new EncounterGenerator().generatePacks({ stageId, seed: procgenSeed, gameplayHooks: branchGameplayHooks }, 1)
		: [];
	const generatedSideRooms = stageId
		? new SideRoomGenerator().generateSideRooms({
				stageId,
				seed: procgenSeed,
				count: 1,
				gameplayHooks: branchGameplayHooks,
			})
		: [];

	return {
		stageId,
		acquiredPayloadIds: storyProgress.acquiredPayloads,
		branchGameplayHooks,
		procgenSeed,
		generatedEnemyPacks,
		generatedSideRooms,
		bossPhases: stage?.boss?.phases?.map((phase) => ({ ...phase })) ?? [],
		bossPlaceholder: stage?.boss
			? {
					id: stage.boss.id,
					name: stage.boss.name,
					argument: stage.boss.argument,
					phaseCount: stage.boss.phaseCount,
				}
			: undefined,
		tutorialBeats: stage?.tutorialBeats?.map((beat) => ({ ...beat })) ?? [],
		onStoryPayloadCollected: undefined,
	};
}

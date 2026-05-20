import type { StageRunSceneOptions } from '../scenes/StageRunScene';
import type { GameFlow } from './GameFlow';

export function buildStageRunSceneOptions(flow: GameFlow): StageRunSceneOptions {
	const stage = flow.getCurrentStage();
	const storyProgress = flow.getStoryProgress();
	const branchGameplayHooks = stage
		? flow.getActiveBranchConsequences(stage.id).map((consequence) => consequence.gameplayHook)
		: [];

	return {
		acquiredPayloadIds: storyProgress.acquiredPayloads,
		branchGameplayHooks,
		bossPhases: stage?.boss?.phases?.map((phase) => ({ ...phase })) ?? [],
		onStoryPayloadCollected: undefined,
	};
}

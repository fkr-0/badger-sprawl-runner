import type { Scene } from '../engine/SceneManager';
import {
	type GameFlow,
	type MenuOptionId,
	type StageRuntimeResult,
	createGameFlow,
} from '../game/GameFlow';
import { buildEndlessSprawlRun } from '../procgen/EndlessSprawlRun';
import type { AutosaveFeedback, AutosaveReason } from '../storage/AutosaveFeedback';
import { SkillTreeScene } from './SkillTreeScene';
import { StageRunScene } from './StageRunScene';
import { StoryFlowScene } from './StoryFlowScene';
import { TrainingScene } from './TrainingScene';
import { VersusScene } from './VersusScene';

export type ModeSceneFactories = Record<MenuOptionId, () => Scene>;

export interface DefaultModeSceneFactoryOptions {
	onStartStoryStage?: (scene: Scene) => void;
	onCompleteStoryStage?: (result: StageRuntimeResult) => void;
	onReturnToTitle?: () => void;
	storyFlow?: GameFlow;
	onAutosave?: (reason: AutosaveReason) => AutosaveFeedback | undefined;
}

export function createDefaultModeSceneFactories(
	options: DefaultModeSceneFactoryOptions = {}
): ModeSceneFactories {
	const storyFlow = options.storyFlow ?? createGameFlow();
	return {
		story: () =>
			new StoryFlowScene(storyFlow, {
				onAutosave: options.onAutosave,
				onReturnToTitle: options.onReturnToTitle,
				onStartStage: (stageOptions) => {
					const scene = new StageRunScene({
						...stageOptions,
						onStageComplete: options.onCompleteStoryStage,
						onReturnToTitle: options.onReturnToTitle,
					});
					options.onStartStoryStage?.(scene);
				},
			}),
		versus: () => new VersusScene({ onReturnToTitle: options.onReturnToTitle }),
		training: () => new TrainingScene({ onReturnToTitle: options.onReturnToTitle }),
		skills: () =>
			new SkillTreeScene({
				flow: storyFlow,
				onAutosave: options.onAutosave,
				onReturnToTitle: options.onReturnToTitle,
			}),
		endless: () =>
			new StageRunScene({
				...buildEndlessSprawlRun().options,
				onReturnToTitle: options.onReturnToTitle,
			}),
	};
}

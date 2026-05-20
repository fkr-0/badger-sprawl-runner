import type { Scene } from '../engine/SceneManager';
import type { GameFlow, MenuOptionId } from '../game/GameFlow';
import { buildEndlessSprawlRun } from '../procgen/EndlessSprawlRun';
import { SkillTreeScene } from './SkillTreeScene';
import { StageRunScene } from './StageRunScene';
import { StoryFlowScene } from './StoryFlowScene';
import { TrainingScene } from './TrainingScene';
import { VersusScene } from './VersusScene';

export type ModeSceneFactories = Record<MenuOptionId, () => Scene>;

export interface DefaultModeSceneFactoryOptions {
	onStartStoryStage?: (scene: Scene) => void;
	onReturnToTitle?: () => void;
	storyFlow?: GameFlow;
}

export function createDefaultModeSceneFactories(
	options: DefaultModeSceneFactoryOptions = {}
): ModeSceneFactories {
	return {
		story: () =>
			new StoryFlowScene(options.storyFlow, {
				onStartStage: (stageOptions) => {
					const scene = new StageRunScene({ ...stageOptions, onReturnToTitle: options.onReturnToTitle });
					options.onStartStoryStage?.(scene);
				},
			}),
		versus: () => new VersusScene({ onReturnToTitle: options.onReturnToTitle }),
		training: () => new TrainingScene({ onReturnToTitle: options.onReturnToTitle }),
		skills: () => new SkillTreeScene({ onReturnToTitle: options.onReturnToTitle }),
		endless: () => new StageRunScene({ ...buildEndlessSprawlRun().options, onReturnToTitle: options.onReturnToTitle }),
	};
}

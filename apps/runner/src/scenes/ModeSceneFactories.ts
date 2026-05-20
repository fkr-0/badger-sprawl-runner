import type { Scene } from '../engine/SceneManager';
import type { MenuOptionId } from '../game/GameFlow';
import { SkillTreeScene } from './SkillTreeScene';
import { StageRunScene } from './StageRunScene';
import { StoryFlowScene } from './StoryFlowScene';
import { TrainingScene } from './TrainingScene';
import { VersusScene } from './VersusScene';

export type ModeSceneFactories = Record<MenuOptionId, () => Scene>;

export interface DefaultModeSceneFactoryOptions {
	onStartStoryStage?: (scene: Scene) => void;
}

export function createDefaultModeSceneFactories(
	options: DefaultModeSceneFactoryOptions = {}
): ModeSceneFactories {
	return {
		story: () =>
			new StoryFlowScene(undefined, {
				onStartStage: (stageOptions) => {
					const scene = new StageRunScene(stageOptions);
					options.onStartStoryStage?.(scene);
				},
			}),
		versus: () => new VersusScene(),
		training: () => new TrainingScene(),
		skills: () => new SkillTreeScene(),
	};
}

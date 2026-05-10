import type { Scene } from '../engine/SceneManager';
import type { MenuOptionId } from '../game/GameFlow';
import { SkillTreeScene } from './SkillTreeScene';
import { StoryFlowScene } from './StoryFlowScene';
import { TrainingScene } from './TrainingScene';
import { VersusScene } from './VersusScene';

export type ModeSceneFactories = Record<MenuOptionId, () => Scene>;

export function createDefaultModeSceneFactories(): ModeSceneFactories {
	return {
		story: () => new StoryFlowScene(),
		versus: () => new VersusScene(),
		training: () => new TrainingScene(),
		skills: () => new SkillTreeScene(),
	};
}

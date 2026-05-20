import { EventBus } from './engine/EventBus';
import { type Scene, SceneManager } from './engine/SceneManager';
import type { MenuOptionId } from './game/GameFlow';
import { routeModeSelection } from './game/ModeRouter';
import { createDefaultModeSceneFactories } from './scenes/ModeSceneFactories';
import { TitleScene } from './scenes/TitleScene';

export interface RunnerApp {
	start(): void;
	routeMode(modeId: MenuOptionId): void;
	getCurrentScene(): Scene | undefined;
}

export function createRunnerApp(canvas: HTMLCanvasElement): RunnerApp {
	const eventBus = new EventBus();
	const sceneManager = new SceneManager({ eventBus, canvas });
	const factories = createDefaultModeSceneFactories({
		onStartStoryStage: (scene) => sceneManager.replace(scene),
	});

	function routeMode(modeId: MenuOptionId): void {
		routeModeSelection(sceneManager, modeId, factories);
	}

	function createTitleScene(): TitleScene {
		return new TitleScene({ onSelectMode: routeMode });
	}

	return {
		start(): void {
			sceneManager.replace(createTitleScene());
		},
		routeMode,
		getCurrentScene(): Scene | undefined {
			return sceneManager.getCurrent();
		},
	};
}

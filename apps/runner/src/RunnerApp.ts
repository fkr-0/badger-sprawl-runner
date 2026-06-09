import { EventBus } from './engine/EventBus';
import { GameLoop } from './engine/GameLoop';
import { type Scene, SceneManager } from './engine/SceneManager';
import type { MenuOptionId } from './game/GameFlow';
import { Renderer } from './renderer/Renderer';
import { routeModeSelection } from './game/ModeRouter';
import { createDefaultModeSceneFactories } from './scenes/ModeSceneFactories';
import { TitleScene } from './scenes/TitleScene';
import { autosaveGameFlow } from './storage/AutosaveFeedback';
import { createLocalStorageSaveDriver, loadGameFlow } from './storage/SaveStore';

export interface RunnerApp {
	start(): void;
	stop(): void;
	routeMode(modeId: MenuOptionId): void;
	getCurrentScene(): Scene | undefined;
	getRenderer(): Renderer;
}

export function createRunnerApp(canvas: HTMLCanvasElement): RunnerApp {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas context not available');

	const eventBus = new EventBus();
	const renderer = new Renderer(ctx, canvas.width, canvas.height);
	const sceneManager = new SceneManager({ eventBus, canvas, renderer });
	const saveDriver = createLocalStorageSaveDriver(window.localStorage);
	const flow = loadGameFlow(saveDriver);
	const factories = createDefaultModeSceneFactories({
		storyFlow: flow,
		onAutosave: (reason) => autosaveGameFlow(saveDriver, flow, reason),
		onStartStoryStage: (scene) => sceneManager.replace(scene),
		onReturnToTitle: () => sceneManager.replace(createTitleScene()),
	});
	const gameLoop = new GameLoop(
		canvas,
		(dt) => {
			sceneManager.update(dt);
			renderer.updateVFX(dt);
		},
		(alpha) => {
			renderer.clear();
			sceneManager.render(renderer, alpha);
		}
	);

	function routeMode(modeId: MenuOptionId): void {
		routeModeSelection(sceneManager, modeId, factories);
	}

	function createTitleScene(): TitleScene {
		return new TitleScene({ onSelectMode: routeMode, storyProgress: flow.getStoryProgress() });
	}

	return {
		start(): void {
			sceneManager.replace(createTitleScene());
			gameLoop.start();
		},
		stop(): void {
			gameLoop.stop();
		},
		routeMode,
		getCurrentScene(): Scene | undefined {
			return sceneManager.getCurrent();
		},
		getRenderer(): Renderer {
			return renderer;
		},
	};
}

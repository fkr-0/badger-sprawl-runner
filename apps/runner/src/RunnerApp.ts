import { createArcadeFrameProfiler } from '../../../vendor/arcade-pixi-runtime.mjs';
import type { ArcadePerformanceSummary } from '../../../vendor/arcade-pixi-runtime.mjs';
import { EventBus } from './engine/EventBus';
import { GameLoop } from './engine/GameLoop';
import { type Scene, SceneManager } from './engine/SceneManager';
import type { GameFlow, MenuOptionId } from './game/GameFlow';
import { routeModeSelection } from './game/ModeRouter';
import type { BadgerPixiBridgeController } from './renderer/BadgerPixiBridge';
import { Renderer } from './renderer/Renderer';
import { resolveRuntimeAssetUrl } from './runtime/RuntimeEnvironment';
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
	getFlow(): GameFlow;
	setPixiBridge(controller: BadgerPixiBridgeController | null): void;
	getRendererMode(): 'canvas' | 'bridge';
	getRendererPerformance(): ArcadePerformanceSummary;
	getBridgePerformance(): ArcadePerformanceSummary | null;
}

export function createRunnerApp(canvas: HTMLCanvasElement): RunnerApp {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas context not available');

	const eventBus = new EventBus();
	const renderer = new Renderer(ctx, canvas.width, canvas.height);
	const renderProfiler = createArcadeFrameProfiler({ sampleSize: 240 });
	let pixiBridge: BadgerPixiBridgeController | null = null;
	const sceneManager = new SceneManager({ eventBus, canvas, renderer });
	const saveDriver = createLocalStorageSaveDriver(window.localStorage);
	const flow = loadGameFlow(saveDriver);
	const factories = createDefaultModeSceneFactories({
		storyFlow: flow,
		onAutosave: (reason) => autosaveGameFlow(saveDriver, flow, reason),
		onStartStoryStage: (scene) => sceneManager.replace(scene),
		onCompleteStoryStage: (result) => {
			flow.recordStageRuntimeResult(result);
			flow.completeStage();
			autosaveGameFlow(saveDriver, flow, 'stage-complete');
			sceneManager.replace(factories.story());
		},
		onReturnToTitle: () => sceneManager.replace(createTitleScene()),
	});
	const gameLoop = new GameLoop(
		canvas,
		(dt) => {
			sceneManager.update(dt);
			renderer.updateVFX(dt);
		},
		(alpha) => {
			const bridgeActive =
				pixiBridge !== null && sceneManager.getCurrent()?.name === 'StageRunScene';
			renderer.setBridgeSink(bridgeActive ? pixiBridge : null);
			pixiBridge?.beginFrame();
			const startedAt = performance.now();
			renderer.clear();
			sceneManager.render(renderer, alpha);
			pixiBridge?.render(bridgeActive, startedAt);
			if (sceneManager.getCurrent()?.name === 'StageRunScene') {
				renderProfiler.record(
					bridgeActive ? 'bridge:stage' : 'canvas:stage',
					performance.now() - startedAt
				);
			}
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
			renderer
				.loadSprites(resolveRuntimeAssetUrl('data/sprites.json'))
				.then(() => window.dispatchEvent(new CustomEvent('badger:sprites-ready')))
				.catch((error: unknown) => {
					console.error('Sprite manifest failed to load', error);
				});
			sceneManager.replace(createTitleScene());
			gameLoop.start();
		},
		stop(): void {
			gameLoop.stop();
			sceneManager.clear();
			pixiBridge?.destroy();
			pixiBridge = null;
		},
		routeMode,
		getCurrentScene(): Scene | undefined {
			return sceneManager.getCurrent();
		},
		getRenderer(): Renderer {
			return renderer;
		},
		getFlow(): GameFlow {
			return flow;
		},
		setPixiBridge(controller): void {
			pixiBridge?.destroy();
			pixiBridge = controller;
		},
		getRendererMode(): 'canvas' | 'bridge' {
			return pixiBridge ? 'bridge' : 'canvas';
		},
		getRendererPerformance(): ArcadePerformanceSummary {
			return renderProfiler.snapshot(pixiBridge ? 'bridge:stage' : 'canvas:stage');
		},
		getBridgePerformance(): ArcadePerformanceSummary | null {
			return pixiBridge?.performance() ?? null;
		},
	};
}

import type { ArcadePerformanceSummary } from '../../../vendor/arcade-runtime.mjs';
import { EventBus } from './engine/EventBus';
import { GameLoop } from './engine/GameLoop';
import { type Scene, SceneManager } from './engine/SceneManager';
import type { GameFlow, MenuOptionId } from './game/GameFlow';
import { AdventureController } from './game/adventure/AdventureController';
import type { AdventureSaveV2, DistrictStoryPhase } from './game/adventure/AdventureState';
import { WorldDirector, type WorldCommandResult } from './game/adventure/WorldDirector';
import { routeModeSelection } from './game/ModeRouter';
import type { BadgerPixiBridgeController } from './renderer/BadgerPixiBridge';
import { Renderer } from './renderer/Renderer';
import {
	type BadgerRenderBudgetResult,
	createBadgerRenderBudgetMonitor,
	evaluateBadgerRenderBudget,
	getBadgerRenderBudgetName,
} from './renderer/RendererPerformanceBudget';
import { resolveRuntimeAssetUrl } from './runtime/RuntimeEnvironment';
import { createDefaultModeSceneFactories } from './scenes/ModeSceneFactories';
import { TitleScene } from './scenes/TitleScene';
import { autosaveGameFlow } from './storage/AutosaveFeedback';
import {
	clearActiveUndercityExpedition,
	createLocalStorageSaveDriver,
	loadActiveUndercityExpedition,
	loadGameSession,
	saveActiveUndercityExpedition,
} from './storage/SaveStore';

export interface RunnerApp {
	start(): void;
	stop(): void;
	routeMode(modeId: MenuOptionId): void;
	getCurrentScene(): Scene | undefined;
	getRenderer(): Renderer;
	getFlow(): GameFlow;
	getAdventureState(): AdventureSaveV2;
	debugTravelTo(locationId: string, spawnId?: string): WorldCommandResult;
	debugSetDistrictPhase(districtId: string, phase: DistrictStoryPhase): WorldCommandResult;
	setPixiBridge(controller: BadgerPixiBridgeController | null): void;
	getRendererMode(): 'canvas' | 'bridge';
	getRendererPerformance(): ArcadePerformanceSummary;
	getRendererBudget(): BadgerRenderBudgetResult;
	resetRendererPerformance(): void;
	getBridgePerformance(): ArcadePerformanceSummary | null;
	getBridgeHardwareBudget(): Readonly<Record<string, unknown>> | null;
	getBridgeLifecycle(): Readonly<Record<string, unknown>> | null;
	resizeBridge(width: number, height: number): void;
	startBridge(): void;
	pauseBridge(): void;
	resumeBridge(): void;
	simulateBridgeContextLoss(): void;
	simulateBridgeContextRestore(): void;
	destroyBridge(): void;
}

export function createRunnerApp(canvas: HTMLCanvasElement): RunnerApp {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas context not available');

	const eventBus = new EventBus();
	const renderer = new Renderer(ctx, canvas.width, canvas.height);
	const renderBudgetMonitor = createBadgerRenderBudgetMonitor();
	let pixiBridge: BadgerPixiBridgeController | null = null;
	const sceneManager = new SceneManager({ eventBus, canvas, renderer });
	const saveDriver = createLocalStorageSaveDriver(window.localStorage);
	const session = loadGameSession(saveDriver);
	const flow = session.flow;
	const world = new WorldDirector(undefined, session.adventure);
	const adventure = new AdventureController(flow, world);
	const loadedActiveUndercity = loadActiveUndercityExpedition(saveDriver);
	const activeUndercity =
		loadedActiveUndercity?.status === 'active' &&
		!session.adventure.expedition.settledRunIds.includes(
			loadedActiveUndercity.manifest.runId
		)
			? loadedActiveUndercity
			: null;
	if (loadedActiveUndercity && !activeUndercity) {
		clearActiveUndercityExpedition(saveDriver);
	}
	const factories = createDefaultModeSceneFactories({
		storyFlow: flow,
		worldDirector: world,
		onAutosave: (reason) =>
			autosaveGameFlow(saveDriver, flow, reason, adventure.getAdventureState()),
		onOpenStoryFlow: (scene) => sceneManager.replace(scene),
		onOpenWorldMap: (scene) => sceneManager.replace(scene),
		onOpenLocation: (scene) => sceneManager.replace(scene),
		onOpenSkillTree: (scene) => sceneManager.replace(scene),
		onOpenTraining: (scene) => sceneManager.replace(scene),
		onStartStoryStage: (scene) => sceneManager.replace(scene),
		onOpenUndercity: (scene, activeSave) => {
			saveActiveUndercityExpedition(saveDriver, activeSave);
			sceneManager.replace(scene);
		},
		onCompleteUndercity: (result) => {
			adventure.completeOptionalExpedition(result);
			clearActiveUndercityExpedition(saveDriver);
			autosaveGameFlow(saveDriver, flow, 'stage-complete', adventure.getAdventureState());
			sceneManager.replace(factories.story());
		},
		onCompleteStoryStage: (result) => {
			adventure.completeStoryStage(result);
			autosaveGameFlow(saveDriver, flow, 'stage-complete', adventure.getAdventureState());
			sceneManager.replace(factories.storyFlow());
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
				renderBudgetMonitor.record(
					getBadgerRenderBudgetName(bridgeActive ? 'bridge' : 'canvas'),
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
				.loadSprites(resolveRuntimeAssetUrl('data/sprites.json'), {
					maxRetries: 1,
					retryDelayMs: 150,
					onProgress: (progress) =>
						window.dispatchEvent(new CustomEvent('badger:sprites-progress', { detail: progress })),
				})
				.then((report) => {
					const eventName =
						report.committed && !report.stale ? 'badger:sprites-ready' : 'badger:sprites-cancelled';
					window.dispatchEvent(new CustomEvent(eventName, { detail: report }));
				})
				.catch((error: unknown) => {
					console.error('Sprite manifest failed to load', error);
					window.dispatchEvent(new CustomEvent('badger:sprites-error', { detail: error }));
				});
			sceneManager.replace(
				activeUndercity ? factories.resumeUndercity(activeUndercity) : createTitleScene()
			);
			gameLoop.start();
		},
		stop(): void {
			gameLoop.stop();
			sceneManager.clear();
			renderer.resetSprites();
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
		getAdventureState(): AdventureSaveV2 {
			return adventure.getAdventureState();
		},
		debugTravelTo(locationId, spawnId): WorldCommandResult {
			const result = adventure.debugTravelTo(locationId, spawnId);
			if (result.ok) {
				autosaveGameFlow(saveDriver, flow, 'world-travel', adventure.getAdventureState());
			}
			return result;
		},
		debugSetDistrictPhase(districtId, phase): WorldCommandResult {
			const result = adventure.debugSetDistrictPhase(districtId, phase);
			if (result.ok) {
				autosaveGameFlow(saveDriver, flow, 'world-travel', adventure.getAdventureState());
			}
			return result;
		},
		setPixiBridge(controller): void {
			pixiBridge?.destroy();
			pixiBridge = controller;
		},
		getRendererMode(): 'canvas' | 'bridge' {
			return pixiBridge ? 'bridge' : 'canvas';
		},
		getRendererPerformance(): ArcadePerformanceSummary {
			return renderBudgetMonitor.profiler.snapshot(
				getBadgerRenderBudgetName(pixiBridge ? 'bridge' : 'canvas')
			);
		},
		getRendererBudget(): BadgerRenderBudgetResult {
			return evaluateBadgerRenderBudget(renderBudgetMonitor, pixiBridge ? 'bridge' : 'canvas');
		},
		resetRendererPerformance(): void {
			renderBudgetMonitor.profiler.reset(
				getBadgerRenderBudgetName(pixiBridge ? 'bridge' : 'canvas')
			);
			pixiBridge?.resetPerformance();
		},
		getBridgePerformance(): ArcadePerformanceSummary | null {
			return pixiBridge?.performance() ?? null;
		},
		getBridgeHardwareBudget(): Readonly<Record<string, unknown>> | null {
			return pixiBridge?.budget() ?? null;
		},
		getBridgeLifecycle(): Readonly<Record<string, unknown>> | null {
			return pixiBridge?.snapshot() ?? null;
		},
		resizeBridge(width, height): void {
			pixiBridge?.runtime.resize(width, height);
		},
		startBridge(): void {
			pixiBridge?.runtime.start('e2e-lifecycle');
		},
		pauseBridge(): void {
			pixiBridge?.runtime.pause('e2e-lifecycle');
		},
		resumeBridge(): void {
			pixiBridge?.runtime.resume('e2e-lifecycle');
		},
		simulateBridgeContextLoss(): void {
			pixiBridge?.runtime.canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
		},
		simulateBridgeContextRestore(): void {
			pixiBridge?.runtime.canvas.dispatchEvent(new Event('webglcontextrestored'));
		},
		destroyBridge(): void {
			renderer.setBridgeSink(null);
			pixiBridge?.destroy();
			pixiBridge = null;
		},
	};
}

// PixiJS's CSP-safe sync-function fallbacks are required when the bridge runs
// under the strict browser/Electron content-security policy.
import 'pixi.js/unsafe-eval';
import {
	Application,
	Assets,
	Container,
	Graphics,
	Sprite,
	Text,
	Texture,
	TextureStyle,
} from 'pixi.js';
import { createArcadePixiRuntime, type ArcadePixiRuntime } from '@arcade/runtime/pixi';
import {
	createBrowserPerformanceSampler,
	type ArcadePerformanceSummary,
} from '@arcade/runtime/tooling';
import { installBadgerCanvasBridgePasses } from './ArcadeRuntimeAdapter';
import { BADGER_PIXI_LAYERS } from './ArcadeRuntimeContract';
import { createBadgerPixiActors } from './BadgerPixiActors';
import { createBadgerPixiBackdrop } from './BadgerPixiBackdrop';
import { createBadgerPixiHud } from './BadgerPixiHud';
import { createBadgerPixiParallax } from './BadgerPixiParallax';
import { createBadgerPixiProjectiles } from './BadgerPixiProjectiles';
import { createBadgerPixiTerrain } from './BadgerPixiTerrain';
import { createBadgerPixiVfx } from './BadgerPixiVfx';
import type { BadgerBridgePassName, BadgerRendererBridgeSink } from './Renderer';
import {
	BADGER_PRODUCTION_BUNDLE_RESOURCE_PATTERN,
	createBadgerHardwareBudgetMonitor,
	getBadgerBrowserHardwareProfile,
} from './RendererHardwareBudget';

const PIXI = {
	Application,
	Assets,
	Container,
	Graphics,
	Sprite,
	Text,
	Texture,
	TextureStyle,
};

export interface BadgerPixiBridgeController extends BadgerRendererBridgeSink {
	readonly runtime: ArcadePixiRuntime;
	beginFrame(): void;
	render(active: boolean, timeMs?: number): void;
	snapshot(): ReturnType<ArcadePixiRuntime['snapshot']>;
	performance(): ArcadePerformanceSummary;
	budget(): Readonly<Record<string, unknown>>;
	resetPerformance(): void;
	destroy(): void;
}

export async function createBadgerPixiBridge(options: {
	mount: HTMLElement;
	sourceCanvas: HTMLCanvasElement;
	width: number;
	height: number;
}): Promise<BadgerPixiBridgeController> {
	const queued = new Map<BadgerBridgePassName, (ctx: CanvasRenderingContext2D) => void>();
	const runtime = await createArcadePixiRuntime({
		PIXI,
		mount: options.mount,
		logicalWidth: options.width,
		logicalHeight: options.height,
		backgroundAlpha: 0,
		canvasId: 'badger-pixi-bridge',
		layers: BADGER_PIXI_LAYERS,
		autoRender: false,
	});
	const hardwareBudget = createBadgerHardwareBudgetMonitor(getBadgerBrowserHardwareProfile());
	const performanceSampler = createBrowserPerformanceSampler({
		refreshEverySamples: 120,
		resourcePattern: BADGER_PRODUCTION_BUNDLE_RESOURCE_PATTERN,
	});
	let previousActorTextureBytes = 0;
	let previousActorCreated = 0;
	let previousVfxCreated = 0;
	let previousBackdropBytes = 0;
	let previousTerrainBytes = 0;
	const nativeBackdrop = createBadgerPixiBackdrop({
		container: runtime.layer('backdrop'),
		width: options.width,
		height: options.height,
	});
	const nativeActors = createBadgerPixiActors({
		container: runtime.layer('actors'),
		maxActors: 160,
	});
	const nativeProjectiles = createBadgerPixiProjectiles({
		container: runtime.layer('projectiles'),
	});
	const nativeParallax = createBadgerPixiParallax({
		container: runtime.layer('world-back'),
		width: options.width,
		height: options.height,
	});
	const nativeVfx = createBadgerPixiVfx({
		container: runtime.layer('effects'),
		maxCapacity: 320,
	});
	const nativeHud = createBadgerPixiHud({
		container: runtime.layer('hud'),
		width: options.width,
		height: options.height,
	});

	installBadgerCanvasBridgePasses({
		runtime,
		PIXI,
		drawers: {},
	});
	const nativeTerrain = createBadgerPixiTerrain({
		container: runtime.layer('world'),
		width: options.width,
	});

	const canvas = runtime.canvas;
	canvas.hidden = true;
	canvas.dataset.rendererMode = 'bridge';
	canvas.dataset.cameraContract = 'arcade-v0.5';
	canvas.setAttribute('aria-hidden', 'true');
	canvas.style.pointerEvents = 'none';
	options.sourceCanvas.dataset.rendererMode = 'bridge-overlay';

	return {
		runtime,
		syncWorldView(camera, shakeX, shakeY) {
			for (const layerId of [
				'backdrop',
				'world-back',
				'world',
				'actors',
				'projectiles',
				'effects',
				'world-front',
			] as const) {
				const layer = runtime.layer(layerId);
				layer.scale.set(camera.zoom);
				layer.position.set(shakeX, camera.groundAnchorY * (1 - camera.zoom) + shakeY);
			}
			canvas.dataset.cameraZoom = camera.zoom.toFixed(3);
			canvas.dataset.visibleWorldWidth = camera.visibleWorldWidth.toFixed(1);
		},
		beginFrame() {
			queued.clear();
			nativeActors.beginFrame();
		},
		syncNativeTerrain(platforms, cameraX, art, sprites) {
			const snapshot = nativeTerrain.sync(platforms, cameraX, art, sprites);
			canvas.dataset.nativeTerrain = 'true';
			canvas.dataset.terrainPlatforms = String(snapshot.platforms);
			canvas.dataset.terrainTiles = String(snapshot.tiles);
		},
		queuePass(name, draw) {
			queued.set(name, draw);
		},
		syncNativeHud(player) {
			const model = nativeHud.update(player);
			canvas.dataset.nativeHud = 'true';
			canvas.dataset.hudHealth = `${model.health}/${model.maxHealth}`;
		},
		syncNativeVfx(source, cameraX) {
			const snapshot = nativeVfx.render(source, cameraX);
			canvas.dataset.nativeVfx = 'true';
			canvas.dataset.vfxPoolActive = String(snapshot.active);
			canvas.dataset.vfxPoolCapacity = String(snapshot.capacity);
			canvas.dataset.vfxPoolDropped = String(snapshot.dropped);
		},
		syncNativeStageParallax(sheetId, sheet, cameraX) {
			const snapshot = nativeParallax.syncStage(sheetId, sheet, cameraX);
			canvas.dataset.nativeParallax = 'true';
			canvas.dataset.parallaxMode = snapshot.mode;
			canvas.dataset.parallaxSheet = snapshot.sheetId ?? '';
			canvas.dataset.parallaxTextureBuilds = String(snapshot.textureBuilds);
		},
		syncNativeProceduralParallax(layers, cameraX) {
			const snapshot = nativeParallax.syncProcedural(layers, cameraX);
			canvas.dataset.nativeParallax = 'true';
			canvas.dataset.parallaxMode = snapshot.mode;
			canvas.dataset.parallaxSheet = '';
			canvas.dataset.parallaxTextureBuilds = String(snapshot.textureBuilds);
		},
		syncNativeStageBackdrop(sheetId, sheet) {
			const snapshot = nativeBackdrop.sync(sheetId, sheet);
			canvas.dataset.nativeBackdrop = 'true';
			canvas.dataset.backdropTextureBytes = String(snapshot.textureBytes);
		},
		syncNativePlayer(player, cameraX, sprites) {
			nativeActors.syncPlayer(player, cameraX, sprites);
		},
		syncNativeEnemies(enemies, cameraX, sprites) {
			nativeActors.syncEnemies(enemies, cameraX, sprites);
		},
		syncNativeProjectiles(player, cameraX) {
			const snapshot = nativeProjectiles.sync(player, cameraX);
			canvas.dataset.nativeProjectiles = 'true';
			canvas.dataset.projectileCount = String(snapshot.active);
		},
		render(active, timeMs = performance.now()) {
			canvas.hidden = !active;
			if (!active) {
				nativeActors.endFrame();
				return;
			}
			if (active) {
				const frameStartedAt = performance.now();
				const actors = nativeActors.endFrame();
				canvas.dataset.nativeActors = 'true';
				canvas.dataset.actorCount = String(actors.actors);
				canvas.dataset.actorPoolDropped = String(actors.dropped);
				runtime.step(0, timeMs, true);
				const vfx = nativeVfx.snapshot();
				const backdrop = nativeBackdrop.snapshot();
				const terrain = nativeTerrain.snapshot();
				const actorTextureDelta = Math.max(0, actors.textureBytes - previousActorTextureBytes);
				const actorCreatedDelta = Math.max(0, actors.created - previousActorCreated);
				const vfxCreatedDelta = Math.max(0, vfx.created - previousVfxCreated);
				const backdropDelta = Math.max(0, backdrop.textureBytes - previousBackdropBytes);
				const terrainDelta = Math.max(0, terrain.textureBytes - previousTerrainBytes);
				previousActorTextureBytes = actors.textureBytes;
				previousActorCreated = actors.created;
				previousVfxCreated = vfx.created;
				previousBackdropBytes = backdrop.textureBytes;
				previousTerrainBytes = terrain.textureBytes;
				const performanceSample = performanceSampler.sample();
				hardwareBudget.setBundleBytes(performanceSample.bundleBytes);
				hardwareBudget.record({
					frameMs: performance.now() - frameStartedAt,
					allocationBytes:
						actorTextureDelta +
						backdropDelta +
						terrainDelta +
						actorCreatedDelta * 1024 +
						vfxCreatedDelta * 256,
					uploadBytes: 0,
					heapBytes: performanceSample.heapBytes,
				});
				const budget = hardwareBudget.evaluate() as {
					tier: string;
					pass: boolean;
					samples: number;
					budget: { minimumSamples?: number };
					summary: {
						frame: { mean: number; p95: number; max: number };
						upload: { p95: number };
						heap: { max: number };
					};
					violations: readonly { metric: string }[];
				};
				const warmed = budget.samples >= (budget.budget.minimumSamples ?? 0);
				canvas.dataset.hardwareTier = budget.tier;
				canvas.dataset.hardwareBudget = warmed ? (budget.pass ? 'pass' : 'fail') : 'warming';
				canvas.dataset.hardwareSamples = String(budget.samples);
				canvas.dataset.hardwareFrameMeanMs = budget.summary.frame.mean.toFixed(2);
				canvas.dataset.hardwareFrameP95Ms = budget.summary.frame.p95.toFixed(2);
				canvas.dataset.hardwareFrameMaxMs = budget.summary.frame.max.toFixed(2);
				canvas.dataset.hardwareViolations = budget.violations
					.map((entry) => entry.metric)
					.join(',');
				canvas.dataset.uploadP95Bytes = String(Math.round(budget.summary.upload.p95));
				canvas.dataset.heapMaxBytes = String(Math.round(budget.summary.heap.max));
			}
		},
		snapshot: () => runtime.snapshot(),
		performance: () => runtime.performanceSnapshot('frame'),
		budget: () => hardwareBudget.evaluate(),
		resetPerformance: () => {
			// Keep warm-up, shader compilation, texture creation, and browser startup
			// stalls out of the steady-state release benchmark. The strict max-frame
			// budget still applies to every sample collected after this reset.
			runtime.resetPerformance('frame');
			hardwareBudget.reset();
			performanceSampler.reset();
		},
		destroy: () => {
			nativeActors.destroy();
			nativeProjectiles.destroy();
			nativeTerrain.destroy();
			nativeBackdrop.destroy();
			nativeParallax.destroy();
			nativeVfx.destroy();
			nativeHud.destroy();
			runtime.destroy(true);
		},
	};
}

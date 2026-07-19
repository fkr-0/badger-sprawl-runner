import * as PIXI from 'pixi.js';
import { createArcadePixiRuntime } from '../../../../vendor/arcade-runtime.mjs';
import type {
	ArcadePerformanceSummary,
	ArcadePixiRuntime,
} from '../../../../vendor/arcade-runtime.mjs';
import { installBadgerCanvasBridgePasses } from './ArcadeRuntimeAdapter';
import { BADGER_PIXI_LAYERS } from './ArcadeRuntimeContract';
import type { BadgerBridgePassName, BadgerRendererBridgeSink } from './Renderer';

export function isBadgerPixiBridgeRequested(search = globalThis.location?.search ?? ''): boolean {
	const params = new URLSearchParams(search);
	return params.get('renderer') === 'bridge' || params.get('pixiBridge') === '1';
}

export interface BadgerPixiBridgeController extends BadgerRendererBridgeSink {
	readonly runtime: ArcadePixiRuntime;
	beginFrame(): void;
	render(active: boolean, timeMs?: number): void;
	snapshot(): ReturnType<ArcadePixiRuntime['snapshot']>;
	performance(): ArcadePerformanceSummary;
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

	installBadgerCanvasBridgePasses({
		runtime,
		PIXI,
		drawers: {
			'stage-backdrop': (ctx) => queued.get('stage-backdrop')?.(ctx),
			parallax: (ctx) => queued.get('parallax')?.(ctx),
			terrain: (ctx) => queued.get('terrain')?.(ctx),
		},
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
		beginFrame() {
			queued.clear();
		},
		queuePass(name, draw) {
			queued.set(name, draw);
		},
		render(active, timeMs = performance.now()) {
			canvas.hidden = !active;
			if (active) runtime.step(0, timeMs, true);
		},
		snapshot: () => runtime.snapshot(),
		performance: () => runtime.performanceSnapshot('frame'),
		destroy: () => runtime.destroy(true),
	};
}

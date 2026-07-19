import {
	createCanvasTexturePassOptions,
	installArcadeRenderPlan,
} from '../../../../vendor/arcade-runtime.mjs';
import type {
	ArcadePixiFrame,
	ArcadePixiNamespace,
	ArcadePixiRuntime,
} from '../../../../vendor/arcade-runtime.mjs';
import { BADGER_PIXI_BRIDGE_PASSES } from './ArcadeRuntimeContract';

export type BadgerCanvasBridgePassName =
	| 'stage-backdrop'
	| 'parallax'
	| 'terrain'
	| 'foreground'
	| 'runner-hud'
	| 'scene-ui';

export type BadgerCanvasBridgeDrawer = (
	context: CanvasRenderingContext2D,
	frame: ArcadePixiFrame
) => void;

export interface BadgerCanvasBridgeOptions {
	runtime: ArcadePixiRuntime;
	PIXI: ArcadePixiNamespace;
	drawers: Partial<Record<BadgerCanvasBridgePassName, BadgerCanvasBridgeDrawer>>;
	canvasFactory?: (width: number, height: number) => HTMLCanvasElement;
}

/** Install the Canvas passes that already have clean Renderer method boundaries. */
export function installBadgerCanvasBridgePasses(options: BadgerCanvasBridgeOptions) {
	const implementations: Record<string, ReturnType<typeof createCanvasTexturePassOptions>> = {};
	for (const descriptor of BADGER_PIXI_BRIDGE_PASSES) {
		const draw = options.drawers[descriptor.name as BadgerCanvasBridgePassName];
		if (!draw) continue;
		implementations[descriptor.name] = createCanvasTexturePassOptions({
			PIXI: options.PIXI,
			draw: (context, frame) => draw(context, frame),
			...(options.canvasFactory ? { canvasFactory: options.canvasFactory } : {}),
		});
	}
	return installArcadeRenderPlan(options.runtime, BADGER_PIXI_BRIDGE_PASSES, implementations);
}

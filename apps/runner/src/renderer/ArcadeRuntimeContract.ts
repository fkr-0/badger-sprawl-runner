/**
 * Stable mapping from Badger Sprawl Runner's canvas passes to the shared PixiJS runtime.
 *
 * Simulation and sprite contracts remain unchanged while rendering passes migrate.
 */
import {
	ARCADE_RUNTIME_VERSION,
	defineArcadeRenderPlan,
} from '../../../../vendor/arcade-runtime.mjs';

export const BADGER_ARCADE_RUNTIME_VERSION = ARCADE_RUNTIME_VERSION;
/** @deprecated Use BADGER_ARCADE_RUNTIME_VERSION. */
export const BADGER_ARCADE_PIXI_RUNTIME_VERSION = BADGER_ARCADE_RUNTIME_VERSION;

export const BADGER_PIXI_LAYERS = [
	'backdrop',
	'world-back',
	'world',
	'actors',
	'projectiles',
	'effects',
	'world-front',
	'hud',
	'overlay',
] as const;

export const BADGER_CANVAS_PASS_TO_PIXI_LAYER = {
	stageBackdrop: 'backdrop',
	parallax: 'world-back',
	terrain: 'world',
	actors: 'actors',
	projectiles: 'projectiles',
	vfx: 'effects',
	foreground: 'world-front',
	runnerHud: 'hud',
	sceneUi: 'overlay',
} as const;

export const BADGER_PIXI_RENDER_PLAN = defineArcadeRenderPlan(
	[
		{
			name: 'stage-backdrop',
			layer: 'backdrop',
			legacyPass: 'stageBackdrop',
			migration: 'canvas-bridge',
			activation: 'ready',
		},
		{
			name: 'parallax',
			layer: 'world-back',
			legacyPass: 'parallax',
			migration: 'canvas-bridge',
			activation: 'ready',
		},
		{
			name: 'terrain',
			layer: 'world',
			legacyPass: 'terrain',
			migration: 'canvas-bridge',
			activation: 'ready',
		},
		{
			name: 'actors',
			layer: 'actors',
			legacyPass: 'actors',
			migration: 'native',
			activation: 'planned',
			required: true,
		},
		{
			name: 'projectiles',
			layer: 'projectiles',
			legacyPass: 'projectiles',
			migration: 'native',
			activation: 'planned',
		},
		{
			name: 'vfx',
			layer: 'effects',
			legacyPass: 'vfx',
			migration: 'native',
			activation: 'planned',
		},
		{
			name: 'foreground',
			layer: 'world-front',
			legacyPass: 'foreground',
			migration: 'canvas-bridge',
			activation: 'ready',
		},
		{
			name: 'runner-hud',
			layer: 'hud',
			legacyPass: 'runnerHud',
			migration: 'canvas-bridge',
			activation: 'ready',
		},
		{
			name: 'scene-ui',
			layer: 'overlay',
			legacyPass: 'sceneUi',
			migration: 'canvas-bridge',
			activation: 'ready',
		},
	] as const,
	{ layers: BADGER_PIXI_LAYERS }
);

export const BADGER_PIXI_BRIDGE_PASSES = BADGER_PIXI_RENDER_PLAN.filter(
	(pass) => pass.migration === 'canvas-bridge' && pass.activation === 'ready'
);

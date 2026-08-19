/**
 * Stable mapping from Badger Sprawl Runner's canvas passes to the shared PixiJS runtime.
 *
 * Simulation and sprite contracts remain unchanged while rendering passes migrate.
 */
import { ARCADE_RUNTIME_VERSION } from '@arcade/runtime/core';
import { defineArcadeRenderPlan } from '@arcade/runtime/pixi';

export const BADGER_ARCADE_RUNTIME_VERSION = ARCADE_RUNTIME_VERSION;

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
			migration: 'native',
			activation: 'ready',
		},
		{
			name: 'parallax',
			layer: 'world-back',
			legacyPass: 'parallax',
			migration: 'native',
			activation: 'ready',
		},
		{
			name: 'terrain',
			layer: 'world',
			legacyPass: 'terrain',
			migration: 'native',
			activation: 'ready',
		},
		{
			name: 'actors',
			layer: 'actors',
			legacyPass: 'actors',
			migration: 'native',
			activation: 'ready',
			required: true,
		},
		{
			name: 'projectiles',
			layer: 'projectiles',
			legacyPass: 'projectiles',
			migration: 'native',
			activation: 'ready',
		},
		{
			name: 'vfx',
			layer: 'effects',
			legacyPass: 'vfx',
			migration: 'native',
			activation: 'ready',
		},
		{
			name: 'foreground',
			layer: 'world-front',
			legacyPass: 'foreground',
			migration: 'canvas-bridge',
			activation: 'planned',
		},
		{
			name: 'runner-hud',
			layer: 'hud',
			legacyPass: 'runnerHud',
			migration: 'native',
			activation: 'ready',
		},
		{
			name: 'scene-ui',
			layer: 'overlay',
			legacyPass: 'sceneUi',
			migration: 'canvas-bridge',
			activation: 'planned',
		},
	] as const,
	{ layers: BADGER_PIXI_LAYERS }
);

export const BADGER_PIXI_BRIDGE_PASSES = [] as readonly (
	(typeof BADGER_PIXI_RENDER_PLAN)[number]
)[];

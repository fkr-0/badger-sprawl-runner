/**
 * Stable mapping from Badger Sprawl Runner's canvas passes to the shared PixiJS runtime.
 *
 * Simulation and sprite contracts remain unchanged while rendering passes migrate.
 */
export const BADGER_ARCADE_PIXI_RUNTIME_VERSION = '0.2.0';

export const BADGER_PIXI_LAYERS = [
	'backdrop',
	'world-back',
	'world',
	'actors',
	'projectiles',
	'effects',
	'world-front',
	'hud',
	'overlay'
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
	sceneUi: 'overlay'
} as const;

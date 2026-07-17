import { describe, expect, it } from 'vitest';
import {
	BADGER_ARCADE_PIXI_RUNTIME_VERSION,
	BADGER_CANVAS_PASS_TO_PIXI_LAYER,
	BADGER_PIXI_LAYERS
} from './ArcadeRuntimeContract';

describe('shared Pixi runtime contract', () => {
	it('pins the common runtime and preserves deterministic pass order', () => {
		expect(BADGER_ARCADE_PIXI_RUNTIME_VERSION).toBe('0.2.0');
		expect(BADGER_PIXI_LAYERS).toEqual([
			'backdrop',
			'world-back',
			'world',
			'actors',
			'projectiles',
			'effects',
			'world-front',
			'hud',
			'overlay'
		]);
		expect(BADGER_CANVAS_PASS_TO_PIXI_LAYER.parallax).toBe('world-back');
	});
});

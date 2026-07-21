import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';
import { createBadgerPixiTerrain } from './BadgerPixiTerrain';

describe('Badger native Pixi terrain ownership', () => {
	it('retains visible platform nodes without a Canvas upload', () => {
		const terrain = createBadgerPixiTerrain({ container: new Container(), width: 960 });
		const sprites = { getSheet: () => undefined } as never;
		expect(
			terrain.sync(
				[
					{ x: 0, y: 500, w: 480, h: 40 },
					{ x: 1100, y: 420, w: 200, h: 30 },
				],
				0,
				undefined,
				sprites,
				0
			)
		).toMatchObject({ platforms: 1, tiles: 0, createdPlatforms: 2, textureBytes: 0 });
		expect(
			terrain.sync([{ x: 0, y: 500, w: 480, h: 40 }], 0, undefined, sprites, 16)
		).toMatchObject({ platforms: 1, createdPlatforms: 2, updates: 2 });
		terrain.destroy();
	});
});

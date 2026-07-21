import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';
import { createPlayer } from '../actors/MossBadger';
import { createBadgerPixiProjectiles } from './BadgerPixiProjectiles';

describe('Badger native Pixi projectile ownership', () => {
	it('owns and clears the railgun beam from player simulation state', () => {
		const player = createPlayer();
		const renderer = createBadgerPixiProjectiles({ container: new Container() });
		player.railgunFlash = 0.08;
		expect(renderer.sync(player, 0)).toMatchObject({ active: 1, railgunAlpha: 1 });
		player.railgunFlash = 0;
		expect(renderer.sync(player, 0)).toMatchObject({ active: 0, railgunAlpha: 0 });
		renderer.destroy();
	});
});

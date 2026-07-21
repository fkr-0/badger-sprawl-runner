import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { createBadgerPixiActors } from './BadgerPixiActors';

describe('Badger native Pixi actor ownership', () => {
	it('owns player and fallback enemy nodes without Canvas rendering', () => {
		const renderer = createBadgerPixiActors({ container: new Container(), maxActors: 4 });
		const sprites = { getSheet: () => undefined } as never;
		const player = createPlayer();
		renderer.beginFrame();
		renderer.syncPlayer(player, 0, sprites);
		renderer.syncEnemies(
			[
				{
					id: 'enemy-1',
					x: 100,
					y: 100,
					w: 32,
					h: 40,
					vx: 0,
					vy: 0,
					dir: -1,
					onGround: true,
					coyoteLeft: 0,
					jumpBuffered: 0,
					hp: 2,
					maxHp: 2,
					invuln: 0,
					stun: 0,
				},
			],
			0,
			sprites
		);
		expect(renderer.endFrame()).toMatchObject({ actors: 2, created: 2, dropped: 0 });
		renderer.destroy();
	});
});

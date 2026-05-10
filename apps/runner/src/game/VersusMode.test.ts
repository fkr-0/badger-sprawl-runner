import { describe, expect, it } from 'vitest';
import { VersusScene } from '../scenes/VersusScene';

describe('versus mode vertical slice', () => {
	it('uses the duel-yard arena with two spawn points and reset bounds', () => {
		const scene = new VersusScene();
		const arena = scene.getArena();

		expect(arena.id).toBe('duel-yard');
		expect(arena.spawnPoints.player.x).toBeLessThan(arena.spawnPoints.rival.x);
		expect(arena.platforms.length).toBeGreaterThan(0);
		expect(arena.width).toBeGreaterThan(1000);
	});

	it('scores tags, resets rounds, and stops scoring after match-over', () => {
		const scene = new VersusScene();

		expect(scene.scoreTag('player')).toMatchObject({ playerScore: 1, roundState: 'tagged' });
		scene.resetRound();
		expect(scene.getScore()).toMatchObject({ playerScore: 1, roundState: 'ready' });
		scene.scoreTag('player');
		scene.resetRound();
		expect(scene.scoreTag('player')).toMatchObject({
			playerScore: 3,
			winner: 'player',
			roundState: 'match-over',
		});
		expect(scene.scoreTag('rival')).toMatchObject({ playerScore: 3, rivalScore: 0 });
	});

	it('supports rematch by resetting the full match score', () => {
		const scene = new VersusScene();

		scene.scoreTag('rival');
		scene.resetRound();
		scene.scoreTag('rival');
		scene.resetRound();
		scene.scoreTag('rival');
		expect(scene.getScore().winner).toBe('rival');

		scene.resetMatch();
		expect(scene.getScore()).toEqual({
			playerScore: 0,
			rivalScore: 0,
			winScore: 3,
			roundState: 'ready',
		});
	});
});

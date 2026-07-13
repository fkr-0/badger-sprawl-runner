import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { StageCheckpointSystem } from './StageCheckpointSystem';

const CHECKPOINTS = [
	{ id: 'start', label: 'Start', x: 20, y: 100 },
	{ id: 'middle', label: 'Middle', x: 200, y: 120 },
	{ id: 'boss', label: 'Boss', x: 400, y: 140 },
] as const;

describe('StageCheckpointSystem', () => {
	it('activates only the furthest checkpoint crossed', () => {
		const system = new StageCheckpointSystem(CHECKPOINTS);

		expect(system.step(199)).toEqual([]);
		expect(system.step(450)).toEqual([
			{ kind: 'checkpoint-activated', checkpoint: CHECKPOINTS[2] },
		]);
		expect(system.getSnapshot()).toMatchObject({ activeId: 'boss', activeIndex: 2 });
		expect(system.step(500)).toEqual([]);
	});

	it('restores combat and movement state at the active checkpoint', () => {
		const system = new StageCheckpointSystem(CHECKPOINTS);
		const player = createPlayer();
		system.step(250);
		Object.assign(player, { x: 900, y: 900, vx: 200, vy: 500, hp: 0, stun: 1 });

		const event = system.respawn(player);

		expect(event).toEqual({ kind: 'player-respawned', checkpoint: CHECKPOINTS[1] });
		expect(player).toMatchObject({
			x: 200,
			y: 120,
			vx: 0,
			vy: 0,
			hp: player.maxHp,
			stun: 0,
			onGround: true,
		});
		expect(player.invuln).toBeGreaterThanOrEqual(1.2);
	});
});

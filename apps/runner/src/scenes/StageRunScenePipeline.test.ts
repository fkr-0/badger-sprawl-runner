import { describe, expect, it } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene update pipeline', () => {
	it('declares the deterministic gameplay step through shared ordered phases', () => {
		const scene = new StageRunScene({ stageId: 'lower-sprawl' });
		const snapshot = scene.getUpdatePipelineSnapshot();

		expect(snapshot.phases).toEqual([
			'frame',
			'objectives',
			'physics',
			'combat',
			'actors',
			'presentation',
		]);
		expect(snapshot.systems.map((system) => system.name)).toEqual([
			'feedback-timers',
			'stage-objectives',
			'hitstop',
			'screen-shake-decay',
			'player-physics',
			'combat-and-world',
			'companions-and-bosses',
			'camera-and-presentation',
		]);
		expect(snapshot.runs).toBe(0);
	});
});

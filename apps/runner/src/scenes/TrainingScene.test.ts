import { describe, expect, it } from 'vitest';
import { RUNTIME_STAGE_IDS } from '../world/stageLayoutRegistry';
import { TrainingScene } from './TrainingScene';

describe('TrainingScene', () => {
	it('hosts the full training runtime inside a selected campaign stage', () => {
		const scene = new TrainingScene({ seed: 'training-scene-test', stageId: 'mirror-palace' });
		const snapshot = scene.getTrainingState();

		expect(scene.name).toBe('TrainingScene');
		expect(scene.getSelectedStage()).toMatchObject({
			seed: 'training-scene-test',
			stageId: 'mirror-palace',
		});
		expect(snapshot).toMatchObject({
			stageId: 'mirror-palace',
			lessonId: 'movement',
			dummyPresetId: 'idle',
			kitId: 'base',
			dummy: { hp: 'infinite' },
			player: { hp: 5, maxHp: 5, hasRailgun: false, hasRocket: false, stims: 9 },
		});
		expect(RUNTIME_STAGE_IDS).toContain(snapshot?.stageId);
	});

	it('exposes the shared release HUD layout rather than a separate text-screen UI', () => {
		const scene = new TrainingScene({ seed: 'hud-layout-test', stageId: 'lower-sprawl' });
		const layout = scene.getGameplayHudLayoutSnapshot();
		expect(layout.vitals).toMatchObject({ x: 12, y: 12, width: 350, height: 74 });
		expect(layout.context.y + layout.context.height).toBeLessThanOrEqual(540);
	});
});

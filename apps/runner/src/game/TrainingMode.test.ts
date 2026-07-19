import { describe, expect, it } from 'vitest';
import { createGameFlow } from './GameFlow';
import { createTrainingMode } from './TrainingMode';

describe('training mode state', () => {
	it('starts with lesson selector, idle invincible dummy, base kit, and zeroed metrics', () => {
		const training = createTrainingMode();

		expect(training.getState()).toMatchObject({
			lessonId: 'movement',
			dummyPresetId: 'idle',
			kitId: 'base',
			metrics: {
				hitCount: 0,
				damageTotal: 0,
				lastAction: 'none',
				lastHitDamage: 0,
				hitsPerSecond: 0,
			},
			overlays: {
				showHitboxes: true,
				showHurtboxes: true,
				showFrameData: true,
				showDamageNumbers: true,
			},
		});
		expect(training.getDummyPreset().invincible).toBe(true);
	});

	it('switches lessons, dummy presets, and player kit with stable ids', () => {
		const training = createTrainingMode();

		training.selectLesson('parry');
		training.selectDummyPreset('attacking');
		training.selectKit('full');

		expect(training.getState()).toMatchObject({
			lessonId: 'parry',
			dummyPresetId: 'attacking',
			kitId: 'full',
		});
		expect(training.getPlayerKit().unlocks).toEqual(['railgun', 'rocket_pack', 'codegate']);
	});

	it('records hit metrics and resets practice state without changing configuration', () => {
		const training = createTrainingMode();
		training.selectLesson('melee');
		training.selectDummyPreset('armored');

		training.recordHit({ damage: 2, action: 'melee', timeMs: 100 });
		training.recordHit({ damage: 1, action: 'parry', timeMs: 400 });
		expect(training.getState().metrics).toMatchObject({
			hitCount: 2,
			damageTotal: 3,
			lastAction: 'parry',
			lastHitDamage: 1,
			comboDamage: 3,
			hitsPerSecond: 2,
		});
		training.recordMeasurements({ railReloadDeltaMs: 720, parryWindowDeltaMs: 150 });
		expect(training.getState().metrics).toMatchObject({
			railReloadDeltaMs: 720,
			parryWindowDeltaMs: 150,
		});

		training.resetPractice();
		expect(training.getState()).toMatchObject({
			lessonId: 'melee',
			dummyPresetId: 'armored',
			metrics: { hitCount: 0, damageTotal: 0, lastAction: 'none', comboDamage: 0 },
		});
	});

	it('toggles live overlay groups without affecting the selected lesson or kit', () => {
		const training = createTrainingMode();
		training.selectLesson('railgun');
		training.selectKit('full');
		training.toggleAllOverlays();
		expect(training.getState()).toMatchObject({
			lessonId: 'railgun',
			kitId: 'full',
			overlays: {
				showHitboxes: false,
				showHurtboxes: false,
				showFrameData: false,
				showDamageNumbers: false,
			},
		});
	});

	it('does not mutate story progress or economy while practicing', () => {
		const flow = createGameFlow({ blueprintShards: 2 }, { currentStageId: 'chrome-arcology' });
		const beforeMeta = flow.getMeta();
		const beforeProgress = flow.getStoryProgress();
		const training = createTrainingMode();

		training.selectLesson('codegate');
		training.selectKit('full');
		training.recordHit({ damage: 9, action: 'codegate' });
		training.resetPractice();

		expect(flow.getMeta()).toEqual(beforeMeta);
		expect(flow.getStoryProgress()).toEqual(beforeProgress);
	});
});

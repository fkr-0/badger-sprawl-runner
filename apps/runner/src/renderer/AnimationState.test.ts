import { describe, expect, it } from 'vitest';
import type { LoadedSheet } from '@badger/sprite-contracts';
import {
	advanceAnimation,
	advanceAnimationStep,
	createAnimationState,
	getAnimationProgress,
	isAnimationComplete,
	pauseAnimation,
	playAnimation,
	playLoadedAnimation,
	resumeAnimation,
} from './AnimationState';

const sheet = {
	sheet: {
		id: 'test-actor',
		file: 'test-actor.png',
		frameSize: [32, 48],
		animations: {
			idle: {
				frames: 4,
				fps: 10,
				events: [{ frame: 2, kind: 'footstep', name: 'left' }],
			},
			hit: { frames: 3, fps: 10 },
		},
	},
} as LoadedSheet;

describe('AnimationState arcade-runtime clock facade', () => {
	it('reports every advanced frame for render-event dispatch', () => {
		const state = createAnimationState();
		expect(advanceAnimation(state, sheet, 0.25)).toEqual([1, 2]);
		expect(state).toMatchObject({ currentAnim: 'idle', frame: 2 });
		expect(state.timer).toBeCloseTo(0.05);

		playAnimation(state, 'hit', false);
		expect(advanceAnimation(state, sheet, 0.4)).toEqual([1, 2]);
		expect(state.frame).toBe(2);
		expect(isAnimationComplete(state)).toBe(true);
		expect(getAnimationProgress(state, sheet)).toBe(1);
	});

	it('supports shared pause, resume, and explicit same-animation restart semantics', () => {
		const state = createAnimationState();
		advanceAnimation(state, sheet, 0.15);
		pauseAnimation(state);
		expect(advanceAnimation(state, sheet, 1)).toEqual([]);
		expect(state.frame).toBe(1);

		resumeAnimation(state);
		expect(advanceAnimation(state, sheet, 0.06)).toEqual([2]);

		playLoadedAnimation(state, sheet, 'idle', true, true);
		expect(state).toMatchObject({ frame: 0, timer: 0, completed: false, playing: true });
	});

	it('returns shared event and completion metadata from one clock advance', () => {
		const state = createAnimationState();
		const step = advanceAnimationStep(state, sheet, 0.25);

		expect(step).not.toBeNull();
		expect(step?.advancedFrames).toEqual([1, 2]);
		expect(step?.events).toEqual([{ frame: 2, kind: 'footstep', name: 'left' }]);
		expect(step?.address).toMatchObject({ sourceX: 64, sourceY: 0 });
	});
});

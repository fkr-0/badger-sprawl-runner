import { describe, expect, it } from 'vitest';
import type { LoadedSheet } from '@badger/sprite-contracts';
import { advanceAnimation, createAnimationState, playAnimation } from './AnimationState';

const sheet = {
	sheet: {
		animations: {
			idle: { frames: 4, fps: 10 },
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
	});
});

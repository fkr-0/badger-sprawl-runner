import { describe, expect, it } from 'vitest';
import { sampleTraversalRhythm } from '../game/TraversalRhythmProfile';
import { applyTraversalMotionPreference, prefersReducedMotion } from './MotionAccessibility';

describe('MotionAccessibility', () => {
	it('reads the platform preference defensively', () => {
		expect(prefersReducedMotion(undefined)).toBe(false);
		expect(prefersReducedMotion({ matchMedia: () => ({ matches: true }) })).toBe(true);
		expect(
			prefersReducedMotion({
				matchMedia: () => {
					throw new Error('unsupported');
				},
			})
		).toBe(false);
	});

	it('keeps route truth and input timing while removing visual displacement and shake', () => {
		const sample = sampleTraversalRhythm('dub-colony', 0.37);
		const reduced = applyTraversalMotionPreference(sample, true);
		const full = applyTraversalMotionPreference(sample, false);

		expect(reduced).toMatchObject({
			profileId: sample.profileId,
			windowOpen: sample.windowOpen,
			inputDelayMs: 0,
			reducedMotion: true,
			visualPlatformOffset: 0,
			screenShakeEnabled: false,
		});
		expect(full.visualPlatformOffset).toBe(sample.platformOffset);
		expect(full.screenShakeEnabled).toBe(true);
	});
});

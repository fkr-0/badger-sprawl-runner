import { describe, expect, it } from 'vitest';
import {
	getTraversalRhythmProfile,
	sampleTraversalRhythm,
	validateTraversalRhythmProfiles,
} from './TraversalRhythmProfile';

describe('TraversalRhythmProfile', () => {
	it('keeps every authored rhythm inside deterministic traversal bounds', () => {
		expect(validateTraversalRhythmProfiles()).toEqual([]);
	});

	it('never delays input even when traversal windows close', () => {
		const samples = Array.from({ length: 120 }, (_, frame) =>
			sampleTraversalRhythm('dub-colony', frame / 60)
		);
		expect(samples.some((sample) => sample.windowOpen)).toBe(true);
		expect(samples.some((sample) => !sample.windowOpen)).toBe(true);
		expect(samples.every((sample) => sample.inputDelayMs === 0)).toBe(true);
	});

	it('is reproducible from simulation time and uses district-specific cycles', () => {
		expect(sampleTraversalRhythm('antenna-barrens', 12.375)).toEqual(
			sampleTraversalRhythm('antenna-barrens', 12.375)
		);
		expect(getTraversalRhythmProfile('antenna-barrens')).toMatchObject({
			beatsPerCycle: 5,
			openBeatIndices: [0, 2, 4],
		});
		expect(getTraversalRhythmProfile('asteroid-redoubt')).toMatchObject({
			beatsPerCycle: 8,
			openBeatIndices: [1, 2, 4, 6],
		});
	});

	it('leaves city traversal continuously open and motionless', () => {
		for (const time of [0, 0.25, 1, 17.75]) {
			expect(sampleTraversalRhythm('lower-sprawl', time)).toMatchObject({
				enabled: false,
				windowOpen: true,
				platformOffset: 0,
				inputDelayMs: 0,
			});
		}
	});
});

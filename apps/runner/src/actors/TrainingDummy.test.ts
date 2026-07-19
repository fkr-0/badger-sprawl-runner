import { describe, expect, it } from 'vitest';
import {
	configureTrainingDummy,
	createTrainingDummy,
	hitTrainingDummy,
	processTrainingDummy,
} from './TrainingDummy';

describe('TrainingDummy', () => {
	it('never loses infinite integrity and produces a deterministic hit flash', () => {
		const dummy = createTrainingDummy(300, 400);
		dummy.hp = 1;
		hitTrainingDummy(dummy, 1234);
		expect(dummy.hp).toBe(Number.POSITIVE_INFINITY);
		expect(dummy.flashTimer).toBeCloseTo(0.15);
		expect(dummy.lastHitTime).toBe(1234);
	});

	it('implements moving, flying, armored, and attacking presets without leaving its anchor', () => {
		const dummy = createTrainingDummy(300, 400, 'walking');
		processTrainingDummy(dummy, 0.5);
		expect(dummy.x).not.toBe(300);

		configureTrainingDummy(dummy, 'flying');
		processTrainingDummy(dummy, 0.5);
		expect(dummy.y).toBeLessThan(400);

		configureTrainingDummy(dummy, 'armored');
		expect(dummy.armor).toBeGreaterThan(0.5);

		configureTrainingDummy(dummy, 'attacking');
		let fired = false;
		for (let index = 0; index < 100; index += 1) {
			fired ||= processTrainingDummy(dummy, 1 / 60).attackFired;
		}
		expect(fired).toBe(true);
		expect(dummy.hp).toBe(Number.POSITIVE_INFINITY);
	});
});

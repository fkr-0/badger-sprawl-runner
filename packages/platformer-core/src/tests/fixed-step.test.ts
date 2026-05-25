import { describe, expect, it } from 'vitest';
import { advanceFixedStep, createFixedStepState } from '../index';

describe('advanceFixedStep', () => {
	it('accumulates partial frames until one deterministic step is due', () => {
		const config = { stepSeconds: 1 / 60, maxSubSteps: 5 };
		const first = advanceFixedStep(createFixedStepState(0), 1 / 120, config, (value) => value + 1);
		const second = advanceFixedStep(first, 1 / 120, config, (value) => value + 1);

		expect(first.value).toBe(0);
		expect(first.steps).toBe(0);
		expect(first.alpha).toBeCloseTo(0.5);
		expect(second.value).toBe(1);
		expect(second.steps).toBe(1);
		expect(second.alpha).toBeCloseTo(0);
	});

	it('caps catch-up work and reports dropped time instead of spiral-of-death stepping', () => {
		const result = advanceFixedStep(createFixedStepState(0), 1, {
			stepSeconds: 0.1,
			maxSubSteps: 3,
			maxAccumulatedSeconds: 0.3,
		}, (value) => value + 1);

		expect(result.value).toBe(3);
		expect(result.steps).toBe(3);
		expect(result.droppedSeconds).toBeCloseTo(0.7);
		expect(result.accumulatorSeconds).toBeCloseTo(0);
	});

	it('passes stable step indexes into the simulation callback', () => {
		const indexes: number[] = [];
		const result = advanceFixedStep(
			{ ...createFixedStepState(10), steps: 4 },
			0.2,
			{ stepSeconds: 0.1, maxSubSteps: 4 },
			(value, _dt, stepIndex) => {
				indexes.push(stepIndex);
				return value + stepIndex;
			}
		);

		expect(indexes).toEqual([4, 5]);
		expect(result.value).toBe(19);
	});
});

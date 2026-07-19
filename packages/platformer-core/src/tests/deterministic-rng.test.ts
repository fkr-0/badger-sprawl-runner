import { describe, expect, it } from 'vitest';
import {
	createDeterministicRng,
	createSeededRandom,
	nextRng,
	rngInt,
	rngPick,
	rngWeightedPick,
} from '../index';

describe('deterministic RNG', () => {
	it('replays the same numeric seed sequence exactly', () => {
		let a = createDeterministicRng(42);
		let b = createDeterministicRng(42);
		const valuesA: number[] = [];
		const valuesB: number[] = [];

		for (let index = 0; index < 5; index += 1) {
			const nextA = nextRng(a);
			const nextB = nextRng(b);
			valuesA.push(nextA.value);
			valuesB.push(nextB.value);
			a = nextA.state;
			b = nextB.state;
		}

		expect(valuesA).toEqual(valuesB);
		expect(a.calls).toBe(5);
	});

	it('turns string seeds into stable integer and pick sequences', () => {
		let state = createDeterministicRng('lower-sprawl-r0');
		const first = rngInt(state, 1, 3);
		state = first.state;
		const second = rngPick(state, ['scrap', 'rail', 'rocket'] as const);

		expect(first.value).toBeGreaterThanOrEqual(1);
		expect(first.value).toBeLessThanOrEqual(3);
		expect(['scrap', 'rail', 'rocket']).toContain(second.value);
		expect(second.state.calls).toBe(2);
	});

	it('keeps weighted picks and callback adapters reproducible through the shared runtime', () => {
		const values = [
			{ id: 'scrap', weight: 8 },
			{ id: 'rail', weight: 2 },
		] as const;
		const first = rngWeightedPick(createDeterministicRng('drop'), values);
		const second = rngWeightedPick(createDeterministicRng('drop'), values);
		expect(first.value).toBe(second.value);
		expect(first.state).toEqual(second.state);

		const random = createSeededRandom('spawn');
		const snapshot = random.snapshot();
		const value = random();
		random.restore(snapshot);
		expect(random()).toBe(value);
	});
});

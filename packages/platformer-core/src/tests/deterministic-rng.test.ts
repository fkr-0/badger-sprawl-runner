import { describe, expect, it } from 'vitest';
import { createDeterministicRng, nextRng, rngInt, rngPick } from '../index';

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
});

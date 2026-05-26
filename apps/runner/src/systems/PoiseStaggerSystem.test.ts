import { describe, expect, it } from 'vitest';
import { stepPoiseStagger, type PoiseState } from './PoiseStaggerSystem';

const base: PoiseState = { entityId: 'brute', poiseMeter: 0, staggerThreshold: 10, staggerDecay: 1, armorClass: 'none' };

describe('PoiseStaggerSystem', () => {
	it('repeated light attacks eventually stagger', () => {
		const result = stepPoiseStagger(base, [{ attackId: 'a', poiseDamage: 4, time: 1 }, { attackId: 'b', poiseDamage: 4, time: 2 }, { attackId: 'c', poiseDamage: 4, time: 3 }], 0, 0);
		expect(result.events.at(-1)?.kind).toBe('stagger');
	});

	it('heavy attack instantly staggers weak enemy', () => {
		const result = stepPoiseStagger(base, [{ attackId: 'hammer', poiseDamage: 12, time: 1 }], 0, 0);
		expect(result.state.staggeredUntil).toBe(1.8);
	});

	it('boss armor reduces poise damage', () => {
		const result = stepPoiseStagger({ ...base, armorClass: 'boss' }, [{ attackId: 'hammer', poiseDamage: 10, time: 1 }], 0, 0);
		expect(result.events[0]).toMatchObject({ kind: 'poise-damage', amount: 4, meter: 4 });
	});

	it('poise decay is deterministic over time', () => {
		const result = stepPoiseStagger({ ...base, poiseMeter: 5 }, [], 2, 8);
		expect(result).toMatchObject({ state: { poiseMeter: 3 }, events: [{ kind: 'poise-decay', amount: 2, meter: 3, time: 8 }] });
	});
});

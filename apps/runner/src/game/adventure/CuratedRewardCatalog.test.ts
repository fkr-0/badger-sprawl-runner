import { describe, expect, it } from 'vitest';
import { getCuratedStoryRewardTable, rollCuratedStoryRewards } from './CuratedRewardCatalog';

describe('curated story rewards', () => {
	it('keeps authored stage reward tables inspectable', () => {
		expect(getCuratedStoryRewardTable('antenna-barrens')).toMatchObject({
			id: 'story:antenna-barrens',
			entries: expect.arrayContaining([
				expect.objectContaining({ itemId: 'black_ice_tooth' }),
			]),
		});
	});

	it('rolls the same reward for the same stage seed and source', () => {
		const first = rollCuratedStoryRewards('orbital-lift', 'fixed-seed', ['repair']);
		const second = rollCuratedStoryRewards('orbital-lift', 'fixed-seed', ['repair']);

		expect(first).toEqual(second);
		expect(first).toHaveLength(1);
		expect(['gravity_talisman', 'rail_heat_sink']).toContain(first[0]?.itemId);
	});

	it('gives the final story reward a guaranteed public-routing key', () => {
		expect(rollCuratedStoryRewards('asteroid-redoubt', 'ending-seed')).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ itemId: 'contraband_seed_key', quantity: 1 }),
			])
		);
	});
});

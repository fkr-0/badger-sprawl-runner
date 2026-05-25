import { describe, expect, it } from 'vitest';
import { FIRST_RELEASE_ITEM_SETS, getActiveItemSetBonuses, mergeItemSetEffects } from './ItemSetSystem';

describe('ItemSetSystem', () => {
	it('defines first-release item sets for movement, melee, and dub-defense loops', () => {
		expect(FIRST_RELEASE_ITEM_SETS.map((set) => set.id)).toEqual([
			'burrowbreaker-rig',
			'invoice-cutter-kit',
			'dub-safehouse-loop',
		]);
		for (const set of FIRST_RELEASE_ITEM_SETS) {
			expect(set.itemIds.length).toBeGreaterThanOrEqual(3);
			expect(set.bonuses.map((bonus) => bonus.pieces)).toEqual([2, 3]);
		}
	});

	it('activates only bonuses whose piece thresholds are met', () => {
		const onePiece = getActiveItemSetBonuses(['rocket_backpack']);
		const twoPieces = getActiveItemSetBonuses(['rocket_backpack', 'bassline_boots']);
		const threePieces = getActiveItemSetBonuses(['rocket_backpack', 'bassline_boots', 'gravity_talisman']);

		expect(onePiece).toEqual([]);
		expect(twoPieces.map((bonus) => bonus.label)).toEqual(['Cleaner landings']);
		expect(threePieces.map((bonus) => bonus.label)).toEqual(['Cleaner landings', 'Sprawl flight line']);
	});

	it('merges item set effects additively for numbers and permissively for booleans', () => {
		const bonuses = getActiveItemSetBonuses([
			'rocket_backpack',
			'bassline_boots',
			'gravity_talisman',
			'claws',
			'katana',
		]);
		const effects = mergeItemSetEffects(bonuses);

		expect(effects.landingShockwave).toBe(true);
		expect(effects.airControlBonus).toBe(0.1);
		expect(effects.fuelRefundOnCombo).toBe(1);
		expect(effects.meleeStyleBonus).toBe(1);
		expect(effects.parryWindowBonus).toBe(0.03);
	});
});

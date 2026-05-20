import { describe, expect, it } from 'vitest';
import { ShopEngine } from '../ShopEngine';

const catalog = [
	{ id: 'stim_pack', name: 'Stim Pack', rarity: 'common', tags: ['consumable'] },
	{ id: 'rail_upgrade', name: 'Rail Mod: Damage', rarity: 'rare', tags: ['upgrade'] },
];

describe('ShopEngine', () => {
	it('keeps baseline prices when heat, favor, and guile are zero', () => {
		const offer = new ShopEngine().generateOffer('lower-sprawl', 0, 0, 0, catalog);
		expect(offer.priceModifier).toBe(1);
		expect(offer.items.map((item) => item.price)).toEqual([50, 150]);
	});

	it('raises prices with orbit heat and discounts with dub favor plus guile', () => {
		const hot = new ShopEngine().generateOffer('lower-sprawl', 6, 0, 0, catalog);
		const favored = new ShopEngine().generateOffer('lower-sprawl', 6, 5, 4, catalog);
		expect(hot.priceModifier).toBeGreaterThan(1);
		expect(favored.priceModifier).toBeLessThan(hot.priceModifier);
		expect(favored.items[0]?.price).toBeLessThan(hot.items[0]?.price ?? 0);
	});

	it('clamps extreme favor and guile so shops never become free', () => {
		const offer = new ShopEngine().generateOffer('dub-colony', 0, 99, 99, catalog);
		expect(offer.priceModifier).toBeGreaterThanOrEqual(0.5);
		expect(offer.items[0]?.price).toBeGreaterThanOrEqual(25);
	});
});

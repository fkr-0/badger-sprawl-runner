import { describe, expect, it } from 'vitest';
import { canCraftRecipe, craftMany, craftRecipe, type CraftingRecipe } from './ItemCraftingSystem';

const recipes: CraftingRecipe[] = [
	{
		id: 'forge_katana',
		outputItemId: 'katana',
		outputQuantity: 1,
		ingredients: [{ itemId: 'scrap', quantity: 3 }, { itemId: 'tooth', quantity: 1 }],
		requiresTags: ['forge'],
	},
	{
		id: 'ice_tooth',
		outputItemId: 'black_ice_tooth',
		outputQuantity: 1,
		ingredients: [{ itemId: 'katana', quantity: 1 }, { itemId: 'cipher', quantity: 2 }],
	},
];

describe('ItemCraftingSystem', () => {
	it('crafts recipes deterministically and sorts resulting entries', () => {
		const result = craftRecipe(recipes[0]!, {
			knownTags: ['forge'],
			entries: [
				{ itemId: 'tooth', quantity: 1, equipped: false },
				{ itemId: 'scrap', quantity: 5, equipped: false },
			],
		});

		expect(result.ok).toBe(true);
		expect(result.crafted).toEqual({ itemId: 'katana', quantity: 1, recipeId: 'forge_katana' });
		expect(result.entries).toEqual([
			{ itemId: 'katana', quantity: 1, equipped: false },
			{ itemId: 'scrap', quantity: 2, equipped: false },
		]);
	});

	it('reports missing tags and ingredients without mutating inputs', () => {
		const state = { entries: [{ itemId: 'scrap', quantity: 2, equipped: false }] };

		expect(canCraftRecipe(recipes[0]!, state)).toEqual({ ok: false, reason: 'missing-tag:forge' });
		expect(craftRecipe(recipes[0]!, { ...state, knownTags: ['forge'] })).toMatchObject({ ok: false, reason: 'missing:scrap' });
		expect(state.entries).toEqual([{ itemId: 'scrap', quantity: 2, equipped: false }]);
	});

	it('crafts recipe chains in a deterministic sequence', () => {
		const result = craftMany(recipes, {
			knownTags: ['forge'],
			entries: [
				{ itemId: 'scrap', quantity: 3, equipped: false },
				{ itemId: 'tooth', quantity: 1, equipped: false },
				{ itemId: 'cipher', quantity: 2, equipped: false },
			],
		}, ['forge_katana', 'ice_tooth']);

		expect(result.ok).toBe(true);
		expect(result.crafted).toEqual({ itemId: 'black_ice_tooth', quantity: 1, recipeId: 'ice_tooth' });
		expect(result.entries).toEqual([{ itemId: 'black_ice_tooth', quantity: 1, equipped: false }]);
	});
});

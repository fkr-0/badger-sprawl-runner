import type { InventoryEntry } from './InventorySystem';

export interface CraftingIngredient {
	itemId: string;
	quantity: number;
}

export interface CraftingRecipe {
	id: string;
	outputItemId: string;
	outputQuantity: number;
	ingredients: CraftingIngredient[];
	requiresTags?: string[];
}

export interface CraftingInventoryState {
	entries: InventoryEntry[];
	knownTags?: string[];
}

export interface CraftingResult {
	ok: boolean;
	reason?: string;
	entries: InventoryEntry[];
	crafted?: { itemId: string; quantity: number; recipeId: string };
}

function quantityOf(entries: readonly InventoryEntry[], itemId: string): number {
	return entries.find((entry) => entry.itemId === itemId)?.quantity ?? 0;
}

function setQuantity(entries: InventoryEntry[], itemId: string, quantity: number): InventoryEntry[] {
	const existing = entries.find((entry) => entry.itemId === itemId);
	if (quantity <= 0) return entries.filter((entry) => entry.itemId !== itemId);
	if (existing) {
		return entries.map((entry) => entry.itemId === itemId ? { ...entry, quantity } : entry);
	}
	return [...entries, { itemId, quantity, equipped: false }].sort((a, b) => a.itemId.localeCompare(b.itemId));
}

export function canCraftRecipe(recipe: CraftingRecipe, state: CraftingInventoryState): { ok: boolean; reason?: string } {
	for (const tag of recipe.requiresTags ?? []) {
		if (!state.knownTags?.includes(tag)) return { ok: false, reason: `missing-tag:${tag}` };
	}
	for (const ingredient of recipe.ingredients) {
		if (quantityOf(state.entries, ingredient.itemId) < ingredient.quantity) {
			return { ok: false, reason: `missing:${ingredient.itemId}` };
		}
	}
	return { ok: true };
}

export function craftRecipe(recipe: CraftingRecipe, state: CraftingInventoryState): CraftingResult {
	const check = canCraftRecipe(recipe, state);
	if (!check.ok) return { ok: false, reason: check.reason, entries: state.entries.map((entry) => ({ ...entry })) };

	let entries = state.entries.map((entry) => ({ ...entry }));
	for (const ingredient of recipe.ingredients) {
		entries = setQuantity(entries, ingredient.itemId, quantityOf(entries, ingredient.itemId) - ingredient.quantity);
	}
	entries = setQuantity(entries, recipe.outputItemId, quantityOf(entries, recipe.outputItemId) + recipe.outputQuantity);

	return {
		ok: true,
		entries: entries.sort((a, b) => a.itemId.localeCompare(b.itemId)),
		crafted: { itemId: recipe.outputItemId, quantity: recipe.outputQuantity, recipeId: recipe.id },
	};
}

export function craftMany(recipes: readonly CraftingRecipe[], state: CraftingInventoryState, recipeIds: readonly string[]): CraftingResult {
	let entries = state.entries.map((entry) => ({ ...entry }));
	let last: CraftingResult = { ok: true, entries };
	for (const recipeId of recipeIds) {
		const recipe = recipes.find((candidate) => candidate.id === recipeId);
		if (!recipe) return { ok: false, reason: `unknown-recipe:${recipeId}`, entries };
		last = craftRecipe(recipe, { ...state, entries });
		entries = last.entries;
		if (!last.ok) return last;
	}
	return last;
}

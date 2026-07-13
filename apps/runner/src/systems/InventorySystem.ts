import {
	FIRST_RELEASE_ITEM_SETS,
	type ItemSetBonus,
	type ItemSetDefinition,
	getActiveItemSetBonuses,
	mergeItemSetEffects,
} from './ItemSetSystem';

export type ItemSlot =
	| 'active'
	| 'weapon'
	| 'consumable'
	| 'melee'
	| 'melee_upgrade'
	| 'utility'
	| 'defense'
	| 'boon'
	| 'movement'
	| 'passive'
	| 'companion'
	| 'hack_combat'
	| 'meta';

export interface ItemDefinition {
	id: string;
	name: string;
	slot: ItemSlot;
	rarity: string;
	tags: string[];
	effect: string;
	iconAnimation?: string;
	maxStack?: number;
}

export interface InventoryEntry {
	itemId: string;
	quantity: number;
	equipped: boolean;
}

export interface LoadoutSummary {
	ownedItemIds: string[];
	equippedItemIds: string[];
	activeBonuses: ItemSetBonus[];
	effects: Record<string, number | string | boolean>;
	missingSetPieces: Array<{ setId: string; setName: string; missingItemIds: string[] }>;
}

export class InventorySystem {
	private entries = new Map<string, InventoryEntry>();
	private catalog = new Map<string, ItemDefinition>();

	constructor(items: readonly ItemDefinition[] = []) {
		for (const item of items) this.catalog.set(item.id, { ...item, tags: [...item.tags] });
	}

	registerItem(item: ItemDefinition): void {
		this.catalog.set(item.id, { ...item, tags: [...item.tags] });
	}

	addItem(itemId: string, quantity = 1): InventoryEntry {
		if (!Number.isInteger(quantity) || quantity <= 0)
			throw new Error(`Invalid item quantity: ${quantity}`);
		const definition = this.catalog.get(itemId);
		const maxStack = definition?.maxStack ?? (definition?.slot === 'consumable' ? 99 : 1);
		const existing = this.entries.get(itemId) ?? { itemId, quantity: 0, equipped: false };
		const updated = { ...existing, quantity: Math.min(maxStack, existing.quantity + quantity) };
		this.entries.set(itemId, updated);
		return { ...updated };
	}

	removeItem(itemId: string, quantity = 1): boolean {
		const existing = this.entries.get(itemId);
		if (!existing || existing.quantity < quantity) return false;
		const nextQuantity = existing.quantity - quantity;
		if (nextQuantity === 0) this.entries.delete(itemId);
		else this.entries.set(itemId, { ...existing, quantity: nextQuantity });
		return true;
	}

	equip(itemId: string): boolean {
		const entry = this.entries.get(itemId);
		if (!entry || entry.quantity <= 0) return false;
		const definition = this.catalog.get(itemId);
		if (!definition) return false;

		for (const [candidateId, candidate] of this.entries) {
			const candidateDefinition = this.catalog.get(candidateId);
			if (
				candidateDefinition?.slot === definition.slot &&
				!this.canMultiEquipSlot(definition.slot)
			) {
				this.entries.set(candidateId, { ...candidate, equipped: false });
			}
		}

		this.entries.set(itemId, { ...entry, equipped: true });
		return true;
	}

	unequip(itemId: string): boolean {
		const entry = this.entries.get(itemId);
		if (!entry) return false;
		this.entries.set(itemId, { ...entry, equipped: false });
		return true;
	}

	has(itemId: string): boolean {
		return (this.entries.get(itemId)?.quantity ?? 0) > 0;
	}

	getEntries(): InventoryEntry[] {
		return Array.from(this.entries.values()).map((entry) => ({ ...entry }));
	}

	getOwnedItemIds(): string[] {
		return this.getEntries()
			.filter((entry) => entry.quantity > 0)
			.map((entry) => entry.itemId)
			.sort();
	}

	getEquippedItemIds(): string[] {
		return this.getEntries()
			.filter((entry) => entry.equipped && entry.quantity > 0)
			.map((entry) => entry.itemId)
			.sort();
	}

	buildLoadoutSummary(
		sets: readonly ItemSetDefinition[] = FIRST_RELEASE_ITEM_SETS
	): LoadoutSummary {
		const ownedItemIds = this.getOwnedItemIds();
		const equippedItemIds = this.getEquippedItemIds();
		const activeBonuses = getActiveItemSetBonuses(equippedItemIds, sets);
		return {
			ownedItemIds,
			equippedItemIds,
			activeBonuses,
			effects: mergeItemSetEffects(activeBonuses),
			missingSetPieces: this.getMissingSetPieces(equippedItemIds, sets),
		};
	}

	private getMissingSetPieces(
		equippedItemIds: readonly string[],
		sets: readonly ItemSetDefinition[]
	) {
		const equipped = new Set(equippedItemIds);
		return sets
			.map((set) => ({
				setId: set.id,
				setName: set.name,
				missingItemIds: set.itemIds.filter((itemId) => !equipped.has(itemId)),
			}))
			.filter((set) => set.missingItemIds.length > 0 && set.missingItemIds.length < 3);
	}

	private canMultiEquipSlot(slot: ItemSlot): boolean {
		return (
			slot === 'boon' ||
			slot === 'passive' ||
			slot === 'companion' ||
			slot === 'consumable' ||
			slot === 'movement'
		);
	}
}

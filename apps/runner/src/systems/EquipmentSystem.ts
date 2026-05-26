import type { DurableItemState } from './ItemDurabilitySystem';
import type { ItemDefinition, ItemSlot } from './InventorySystem';
import { aggregateItemStats, BASE_BADGER_STATS, type StatBlock, type StatEffectMap } from './ItemStatSystem';

export interface EquipmentSlotRule {
	slot: ItemSlot;
	limit: number;
}

export interface EquippedItemState {
	itemId: string;
	slot: ItemSlot;
	durability?: DurableItemState;
	effects?: StatEffectMap;
}

export interface EquipmentState {
	items: EquippedItemState[];
}

export interface EquipmentReport {
	valid: boolean;
	violations: string[];
	stats: StatBlock;
	brokenItemIds: string[];
}

export const FIRST_RELEASE_SLOT_RULES: EquipmentSlotRule[] = [
	{ slot: 'active', limit: 1 },
	{ slot: 'weapon', limit: 1 },
	{ slot: 'melee', limit: 1 },
	{ slot: 'melee_upgrade', limit: 1 },
	{ slot: 'utility', limit: 2 },
	{ slot: 'defense', limit: 1 },
	{ slot: 'boon', limit: 3 },
	{ slot: 'movement', limit: 1 },
	{ slot: 'passive', limit: 3 },
	{ slot: 'companion', limit: 1 },
	{ slot: 'hack_combat', limit: 1 },
	{ slot: 'meta', limit: 99 },
	{ slot: 'consumable', limit: 3 },
];

function slotLimit(slot: ItemSlot, rules: readonly EquipmentSlotRule[]): number {
	return rules.find((rule) => rule.slot === slot)?.limit ?? 1;
}

export function equipItem(
	state: EquipmentState,
	item: ItemDefinition,
	options: { durability?: DurableItemState; effects?: StatEffectMap } = {},
	rules: readonly EquipmentSlotRule[] = FIRST_RELEASE_SLOT_RULES
): EquipmentState {
	const limit = slotLimit(item.slot, rules);
	const sameSlot = state.items.filter((equipped) => equipped.slot === item.slot);
	const withoutExisting = state.items.filter((equipped) => equipped.itemId !== item.id);
	const trimmed = sameSlot.length >= limit
		? withoutExisting.filter((equipped) => equipped.slot !== item.slot || sameSlot.slice(1).some((kept) => kept.itemId === equipped.itemId))
		: withoutExisting;

	return {
		items: [
			...trimmed,
			{ itemId: item.id, slot: item.slot, durability: options.durability ? { ...options.durability } : undefined, effects: options.effects ? { ...options.effects } : undefined },
		].sort((a, b) => a.slot.localeCompare(b.slot) || a.itemId.localeCompare(b.itemId)),
	};
}

export function unequipItem(state: EquipmentState, itemId: string): EquipmentState {
	return { items: state.items.filter((item) => item.itemId !== itemId).map((item) => ({ ...item, effects: item.effects ? { ...item.effects } : undefined, durability: item.durability ? { ...item.durability } : undefined })) };
}

export function evaluateEquipment(
	state: EquipmentState,
	base: StatBlock = BASE_BADGER_STATS,
	rules: readonly EquipmentSlotRule[] = FIRST_RELEASE_SLOT_RULES
): EquipmentReport {
	const violations: string[] = [];
	const brokenItemIds = state.items.filter((item) => item.durability?.broken).map((item) => item.itemId).sort();
	for (const rule of rules) {
		const count = state.items.filter((item) => item.slot === rule.slot).length;
		if (count > rule.limit) violations.push(`slot:${rule.slot}:${count}/${rule.limit}`);
	}

	const activeEffects = state.items
		.filter((item) => !item.durability?.broken)
		.map((item) => item.effects ?? {});

	return {
		valid: violations.length === 0 && brokenItemIds.length === 0,
		violations: [...violations, ...brokenItemIds.map((itemId) => `broken:${itemId}`)],
		stats: aggregateItemStats(base, { flatEffects: activeEffects }),
		brokenItemIds,
	};
}

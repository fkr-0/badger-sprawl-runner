import type { EquipmentState } from './EquipmentSystem';
import { resolveSocketEffects, type ModChipDefinition, type SocketedItemState } from './ItemSocketSystem';
import type { StatEffectMap } from './ItemStatSystem';

export interface SocketEquipmentBridgeResult {
	equipment: EquipmentState;
	socketEffectsByItemId: Record<string, StatEffectMap>;
}

export function applySocketEffectsToEquipment(
	equipment: EquipmentState,
	socketedItems: readonly SocketedItemState[],
	chips: readonly ModChipDefinition[]
): SocketEquipmentBridgeResult {
	const socketByItem = new Map(socketedItems.map((item) => [item.itemId, item]));
	const socketEffectsByItemId: Record<string, StatEffectMap> = {};
	const items = equipment.items.map((equipped) => {
		const socketed = socketByItem.get(equipped.itemId);
		if (!socketed) return { ...equipped, effects: equipped.effects ? { ...equipped.effects } : undefined, durability: equipped.durability ? { ...equipped.durability } : undefined };
		const socketEffects = resolveSocketEffects(socketed, chips);
		socketEffectsByItemId[equipped.itemId] = socketEffects;
		return {
			...equipped,
			durability: equipped.durability ? { ...equipped.durability } : undefined,
			effects: mergeEffects(equipped.effects ?? {}, socketEffects),
		};
	});
	return { equipment: { items }, socketEffectsByItemId };
}

function mergeEffects(base: StatEffectMap, socketEffects: StatEffectMap): StatEffectMap {
	const merged: StatEffectMap = { ...base };
	for (const [key, value] of Object.entries(socketEffects).sort(([left], [right]) => left.localeCompare(right))) {
		const previous = merged[key];
		if (typeof value === 'number' && typeof previous === 'number') merged[key] = previous + value;
		else merged[key] = value;
	}
	return merged;
}

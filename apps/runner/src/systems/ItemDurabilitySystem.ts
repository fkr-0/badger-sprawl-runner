export interface DurableItemState {
	itemId: string;
	durability: number;
	maxDurability: number;
	broken: boolean;
}

export interface DurabilityEvent {
	kind: 'damaged' | 'repaired' | 'broken';
	itemId: string;
	amount: number;
}

export interface RepairCost {
	resourceId: string;
	quantity: number;
}

export function damageDurability(item: DurableItemState, amount: number): { item: DurableItemState; events: DurabilityEvent[] } {
	if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid durability damage: ${amount}`);
	const before = item.durability;
	const durability = Math.max(0, before - amount);
	const broken = durability <= 0;
	const events: DurabilityEvent[] = [];
	if (durability !== before) events.push({ kind: 'damaged', itemId: item.itemId, amount: Number((before - durability).toFixed(6)) });
	if (broken && !item.broken) events.push({ kind: 'broken', itemId: item.itemId, amount: 0 });
	return { item: { ...item, durability, broken }, events };
}

export function repairDurability(item: DurableItemState, amount: number): { item: DurableItemState; events: DurabilityEvent[] } {
	if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid durability repair: ${amount}`);
	const before = item.durability;
	const durability = Math.min(item.maxDurability, before + amount);
	const repaired = durability - before;
	return {
		item: { ...item, durability, broken: durability <= 0 },
		events: repaired > 0 ? [{ kind: 'repaired', itemId: item.itemId, amount: Number(repaired.toFixed(6)) }] : [],
	};
}

export function getRepairCost(item: DurableItemState, resourceId = 'scrap'): RepairCost {
	const missing = Math.max(0, item.maxDurability - item.durability);
	return { resourceId, quantity: Math.ceil(missing / 10) };
}

export function repairWithResources(
	item: DurableItemState,
	resources: Record<string, number>,
	resourceId = 'scrap'
): { ok: boolean; item: DurableItemState; resources: Record<string, number>; events: DurabilityEvent[]; cost: RepairCost } {
	const cost = getRepairCost(item, resourceId);
	if (cost.quantity <= 0) return { ok: true, item: { ...item }, resources: { ...resources }, events: [], cost };
	if ((resources[resourceId] ?? 0) < cost.quantity) return { ok: false, item: { ...item }, resources: { ...resources }, events: [], cost };
	const repaired = repairDurability(item, cost.quantity * 10);
	return {
		ok: true,
		item: repaired.item,
		resources: { ...resources, [resourceId]: (resources[resourceId] ?? 0) - cost.quantity },
		events: repaired.events,
		cost,
	};
}

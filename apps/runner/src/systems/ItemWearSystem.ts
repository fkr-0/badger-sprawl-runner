import type { CombatEvent } from './CombatSystem';
import type { ItemUseEvent } from './ItemUseSystem';
import { damageDurability, type DurableItemState, type DurabilityEvent } from './ItemDurabilitySystem';

export interface ItemWearRule {
	itemId: string;
	onCombatKinds?: CombatEvent['kind'][];
	onItemUseKinds?: ItemUseEvent['kind'][];
	amount: number;
	moveIdIncludes?: string;
}

export interface ItemWearResult {
	items: DurableItemState[];
	events: DurabilityEvent[];
}

function appliesToCombat(rule: ItemWearRule, event: CombatEvent): boolean {
	if (rule.onCombatKinds && !rule.onCombatKinds.includes(event.kind)) return false;
	if (rule.moveIdIncludes && !event.moveId?.includes(rule.moveIdIncludes)) return false;
	return Boolean(rule.onCombatKinds);
}

function appliesToItem(rule: ItemWearRule, event: ItemUseEvent): boolean {
	if (rule.onItemUseKinds && !rule.onItemUseKinds.includes(event.kind)) return false;
	return Boolean(rule.onItemUseKinds);
}

function applyWear(items: DurableItemState[], rule: ItemWearRule): { items: DurableItemState[]; events: DurabilityEvent[] } {
	const events: DurabilityEvent[] = [];
	const next = items.map((item) => {
		if (item.itemId !== rule.itemId || item.broken) return { ...item };
		const worn = damageDurability(item, rule.amount);
		events.push(...worn.events);
		return worn.item;
	});
	return { items: next, events };
}

export function applyItemWearFromEvents(
	items: readonly DurableItemState[],
	rules: readonly ItemWearRule[],
	input: { combatEvents?: readonly CombatEvent[]; itemEvents?: readonly ItemUseEvent[] }
): ItemWearResult {
	let next = items.map((item) => ({ ...item }));
	const events: DurabilityEvent[] = [];
	const sortedRules = [...rules].sort((a, b) => a.itemId.localeCompare(b.itemId));

	for (const event of [...(input.combatEvents ?? [])].sort((a, b) => (a.time ?? 0) - (b.time ?? 0) || a.kind.localeCompare(b.kind) || (a.moveId ?? '').localeCompare(b.moveId ?? ''))) {
		for (const rule of sortedRules) {
			if (!appliesToCombat(rule, event)) continue;
			const worn = applyWear(next, rule);
			next = worn.items;
			events.push(...worn.events);
		}
	}

	for (const event of input.itemEvents ?? []) {
		for (const rule of sortedRules) {
			if (rule.itemId !== event.itemId || !appliesToItem(rule, event)) continue;
			const worn = applyWear(next, rule);
			next = worn.items;
			events.push(...worn.events);
		}
	}

	return { items: next, events };
}

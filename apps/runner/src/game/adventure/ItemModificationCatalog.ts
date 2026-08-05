import type { AdventureItemState } from './ExpeditionLedger';
import type { ItemDefinition } from '../../systems/InventorySystem';

export interface ItemModificationDef {
	id: string;
	name: string;
	description: string;
	cost: number;
	minimumServiceLevel: number;
	requiresAnyTag: string[];
	effects: Record<string, number | string | boolean>;
}

export const ITEM_MODIFICATION_CATALOG: readonly ItemModificationDef[] = [
	{
		id: 'subharmonic-tuning',
		name: 'Subharmonic Tuning',
		description: 'Auntie tunes timing surfaces and signal contacts without hiding the calibration notes.',
		cost: 90,
		minimumServiceLevel: 0,
		requiresAnyTag: ['beat', 'hack', 'timing', 'movement'],
		effects: { beatGrace: 0.02, traceReduction: 0.04 },
	},
	{
		id: 'cold-chain-insulation',
		name: 'Cold-Chain Insulation',
		description: 'Drainmarket wraps vulnerable systems in repairable rescue insulation.',
		cost: 105,
		minimumServiceLevel: 0,
		requiresAnyTag: ['armor', 'guard', 'air', 'fuel'],
		effects: { damageMitigation: 0.04, fuelRechargeBonus: 0.08 },
	},
	{
		id: 'public-audit-port',
		name: 'Public Audit Port',
		description: 'Rook adds an inspectable maintenance and evidence interface instead of a proprietary diagnostic socket.',
		cost: 125,
		minimumServiceLevel: 1,
		requiresAnyTag: ['evidence', 'heist', 'secret', 'solidarity', 'ranged'],
		effects: { comboWindowBonus: 0.05, traceReduction: 0.05 },
	},
	{
		id: 'chorus-redundancy',
		name: 'Chorus Redundancy',
		description: 'Juno duplicates the component most likely to fail and labels who knows how to replace it.',
		cost: 145,
		minimumServiceLevel: 1,
		requiresAnyTag: ['repair', 'railgun', 'cooldown', 'garden', 'emp'],
		effects: { railCooldownReduction: 0.06, railDamageBonus: 0.06 },
	},
];

export function getItemModification(modificationId: string): ItemModificationDef | undefined {
	return ITEM_MODIFICATION_CATALOG.find((modification) => modification.id === modificationId);
}

export function getAvailableItemModifications(
	item: ItemDefinition,
	serviceLevel: number,
	state?: AdventureItemState
): ItemModificationDef[] {
	return ITEM_MODIFICATION_CATALOG.filter(
		(modification) =>
			modification.minimumServiceLevel <= serviceLevel &&
			modification.id !== state?.modificationId &&
			modification.requiresAnyTag.some((tag) => item.tags.includes(tag))
	);
}

export function resolveItemModificationEffects(
	equippedItemIds: readonly string[],
	itemStates: Readonly<Record<string, AdventureItemState>>
): Record<string, number | string | boolean> {
	const merged: Record<string, number | string | boolean> = {};
	for (const itemId of equippedItemIds) {
		const modification = itemStates[itemId]?.modificationId
			? getItemModification(itemStates[itemId]!.modificationId!)
			: undefined;
		if (!modification) continue;
		for (const [key, value] of Object.entries(modification.effects)) {
			const previous = merged[key];
			if (typeof value === 'number' && typeof previous === 'number') merged[key] = previous + value;
			else if (typeof value === 'boolean' && typeof previous === 'boolean') merged[key] = previous || value;
			else merged[key] = value;
		}
	}
	return merged;
}

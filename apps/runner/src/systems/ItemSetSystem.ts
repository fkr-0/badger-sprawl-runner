export interface ItemSetDefinition {
	id: string;
	name: string;
	itemIds: string[];
	bonuses: Array<{
		pieces: number;
		label: string;
		effects: Record<string, number | string | boolean>;
	}>;
}

export interface ItemSetBonus {
	setId: string;
	setName: string;
	pieces: number;
	label: string;
	effects: Record<string, number | string | boolean>;
}

export const FIRST_RELEASE_ITEM_SETS: ItemSetDefinition[] = [
	{
		id: 'burrowbreaker-rig',
		name: 'Burrowbreaker Rig',
		itemIds: ['rocket_backpack', 'bassline_boots', 'gravity_talisman'],
		bonuses: [
			{ pieces: 2, label: 'Cleaner landings', effects: { landingShockwave: true, airControlBonus: 0.1 } },
			{ pieces: 3, label: 'Sprawl flight line', effects: { fuelRefundOnCombo: 1, maxFallSpeedBonus: 120 } },
		],
	},
	{
		id: 'invoice-cutter-kit',
		name: 'Invoice Cutter Kit',
		itemIds: ['claws', 'katana', 'black_ice_tooth'],
		bonuses: [
			{ pieces: 2, label: 'Combo audit', effects: { meleeStyleBonus: 1, parryWindowBonus: 0.03 } },
			{ pieces: 3, label: 'EMP finisher', effects: { finisherEmp: true, finisherDamageBonus: 1 } },
		],
	},
	{
		id: 'dub-safehouse-loop',
		name: 'Dub Safehouse Loop',
		itemIds: ['dub_shield', 'echo_cassette', 'signal_jammer'],
		bonuses: [
			{ pieces: 2, label: 'Beat shelter', effects: { damageMitigation: 0.15, beatGrace: 0.08 } },
			{ pieces: 3, label: 'Ghost in the bassline', effects: { decoyOnPerfectDodge: true, traceReduction: 0.25 } },
		],
	},
];

export function getActiveItemSetBonuses(
	ownedItemIds: readonly string[],
	sets: readonly ItemSetDefinition[] = FIRST_RELEASE_ITEM_SETS
): ItemSetBonus[] {
	const owned = new Set(ownedItemIds);
	const bonuses: ItemSetBonus[] = [];

	for (const set of sets) {
		const pieces = set.itemIds.filter((itemId) => owned.has(itemId)).length;
		for (const bonus of set.bonuses) {
			if (pieces >= bonus.pieces) {
				bonuses.push({
					setId: set.id,
					setName: set.name,
					pieces: bonus.pieces,
					label: bonus.label,
					effects: { ...bonus.effects },
				});
			}
		}
	}

	return bonuses;
}

export function mergeItemSetEffects(bonuses: readonly ItemSetBonus[]): Record<string, number | string | boolean> {
	const merged: Record<string, number | string | boolean> = {};

	for (const bonus of bonuses) {
		for (const [key, value] of Object.entries(bonus.effects)) {
			const previous = merged[key];
			if (typeof value === 'number' && typeof previous === 'number') {
				merged[key] = previous + value;
			} else if (typeof value === 'boolean' && typeof previous === 'boolean') {
				merged[key] = previous || value;
			} else {
				merged[key] = value;
			}
		}
	}

	return merged;
}

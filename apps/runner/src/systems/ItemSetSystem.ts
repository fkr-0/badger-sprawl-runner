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
			{
				pieces: 2,
				label: 'Cleaner landings',
				effects: { landingShockwave: true, airControlBonus: 0.1 },
			},
			{
				pieces: 3,
				label: 'Sprawl flight line',
				effects: { fuelRefundOnCombo: 1, maxFallSpeedBonus: 120 },
			},
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
			{
				pieces: 3,
				label: 'Ghost in the bassline',
				effects: { decoyOnPerfectDodge: true, traceReduction: 0.25 },
			},
		],
	},
	{
		id: 'arcology-conductor-array',
		name: 'Arcology Conductor Array',
		itemIds: ['capacitor_coil', 'rail_heat_sink', 'mirror_thread'],
		bonuses: [
			{
				pieces: 2,
				label: 'Quiet chamber',
				effects: { railCooldownReduction: 0.08, railRecoilReduction: 0.2 },
			},
			{
				pieces: 3,
				label: 'Public current',
				effects: { empOnChargedShot: true, railPierceBonus: 1, railDamageBonus: 0.2 },
			},
		],
	},
	{
		id: 'service-ghost-kit',
		name: 'Service Ghost Kit',
		itemIds: ['phase_mantle', 'ledger_lens', 'rootkit_badge'],
		bonuses: [
			{
				pieces: 2,
				label: 'Hidden shift',
				effects: { damageMitigation: 0.08, comboWindowBonus: 0.08 },
			},
			{
				pieces: 3,
				label: 'Ghost payroll',
				effects: { decoyOnPerfectDodge: true, traceReduction: 0.2, parryWindowBonus: 0.02 },
			},
		],
	},
	{
		id: 'sporeline-circuit',
		name: 'Sporeline Circuit',
		itemIds: ['echo_spurs', 'shock_fern', 'solder_mite_swarm'],
		bonuses: [
			{
				pieces: 2,
				label: 'Living recharge',
				effects: { fuelRechargeBonus: 0.25, airControlBonus: 0.06 },
			},
			{
				pieces: 3,
				label: 'Garden discharge',
				effects: { empOnChargedShot: true, fuelRefundOnCombo: 0.5 },
			},
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

export function mergeItemSetEffects(
	bonuses: readonly ItemSetBonus[]
): Record<string, number | string | boolean> {
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

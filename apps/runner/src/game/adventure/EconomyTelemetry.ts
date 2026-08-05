import type { GameFlow } from '../GameFlow';
import type { AdventureSaveV2 } from './AdventureState';

export interface EconomyTelemetrySnapshot {
	credchips: number;
	spentCredchips: number;
	serviceSpend: number;
	purchaseCount: number;
	repairCount: number;
	clinicVisits: number;
	rewardItemCount: number;
	inventoryUnits: number;
	equippedItems: number;
	brokenItems: number;
	clinicStrain: number;
	hoardingRisk: boolean;
	softLockRisk: boolean;
	warnings: string[];
}

export function resolveEconomyTelemetry(
	flow: Pick<GameFlow, 'getMeta'>,
	state: AdventureSaveV2
): EconomyTelemetrySnapshot {
	const credchips = flow.getMeta().credchips;
	const inventoryUnits = state.inventory.reduce((total, stack) => total + stack.quantity, 0);
	const brokenItems = Object.values(state.itemStates).filter((item) => item.condition <= 0).length;
	const clinicStrain = Object.values(state.locationStates).reduce(
		(total, location) => total + (location.serviceStrain.clinic ?? 0),
		0
	);
	const stimCount = state.inventory.find((stack) => stack.itemId === 'stim_pack')?.quantity ?? 0;
	const hoardingRisk = inventoryUnits >= 18 && state.equippedItemIds.length <= 2;
	const softLockRisk =
		state.expedition.integrity <= 2 &&
		stimCount === 0 &&
		credchips < 30 &&
		clinicStrain >= 3;
	const warnings: string[] = [];
	if (brokenItems > 0) warnings.push(`${brokenItems} persistent item${brokenItems === 1 ? '' : 's'} broken`);
	if (hoardingRisk) warnings.push('inventory accumulation exceeds active loadout use');
	if (clinicStrain >= 4) warnings.push('clinic network is carrying unsafe supply strain');
	if (softLockRisk) warnings.push('recovery soft-lock risk: low integrity, no stim supply, low funds, strained clinic');
	return {
		credchips,
		spentCredchips: state.economy.spentCredchips,
		serviceSpend: state.economy.serviceSpend,
		purchaseCount: state.economy.purchaseCount,
		repairCount: state.economy.repairCount,
		clinicVisits: state.economy.clinicVisits,
		rewardItemCount: state.economy.rewardItemCount,
		inventoryUnits,
		equippedItems: state.equippedItemIds.length,
		brokenItems,
		clinicStrain,
		hoardingRisk,
		softLockRisk,
		warnings,
	};
}

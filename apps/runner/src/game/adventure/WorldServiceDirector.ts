import type { GameFlow } from '../GameFlow';
import {
	FIRST_RELEASE_ITEM_CATALOG,
	getFirstReleaseItem,
} from '../../systems/FirstReleaseItemCatalog';
import { InventorySystem } from '../../systems/InventorySystem';
import { resolveEconomyTelemetry, type EconomyTelemetrySnapshot } from './EconomyTelemetry';
import { createDefaultItemState } from './ExpeditionLedger';
import {
	getAvailableItemModifications,
	getItemModification,
} from './ItemModificationCatalog';
import { PlaceDirector } from './PlaceDirector';
import type {
	WorldCommand,
	WorldCommandResult,
	WorldDirector,
} from './WorldDirector';

export interface ServiceOfferDef {
	itemId: string;
	basePrice: number;
	stockLimit: number;
	serviceLevel: number;
	flavor: string;
}

export type ExecutableServiceId =
	| 'repair-bench'
	| 'clinic'
	| 'archive'
	| 'legal-aid'
	| 'greenhouse'
	| 'transit-control';

export interface ServiceActionItem {
	id: string;
	serviceId: ExecutableServiceId;
	label: string;
	detail: string;
	suffix: string;
	enabled: boolean;
}

export interface ServiceOfferItem extends ServiceOfferDef {
	name: string;
	price: number;
	owned: number;
	available: number;
	effect: string;
}

export type ServiceTransactionFailure =
	| 'service-unavailable'
	| 'unknown-item'
	| 'item-not-offered'
	| 'out-of-stock'
	| 'invalid-quantity'
	| 'insufficient-credchips'
	| 'insufficient-supplies'
	| 'service-strained'
	| 'action-unavailable'
	| 'item-full-condition'
	| 'modification-unavailable'
	| 'treatment-unnecessary'
	| 'world-write-failed';

export interface ServiceTransactionReceipt {
	ok: boolean;
	changed: boolean;
	locationId: string;
	serviceId: string;
	message: string;
	itemId?: string;
	actionId?: string;
	quantity?: number;
	totalPrice?: number;
	balance?: number;
	failure?: ServiceTransactionFailure;
	worldResult?: WorldCommandResult;
}

const SHOP_OFFERS: Record<string, readonly ServiceOfferDef[]> = {
	'lower-sprawl:settlement': [
		{
			itemId: 'stim_pack',
			basePrice: 35,
			stockLimit: 4,
			serviceLevel: 0,
			flavor: 'Murr calls it medicine with a drum break.',
		},
		{
			itemId: 'signal_jammer',
			basePrice: 115,
			stockLimit: 1,
			serviceLevel: 0,
			flavor: 'Previously owned by somebody who no longer appears in search results.',
		},
		{
			itemId: 'phase_pick',
			basePrice: 90,
			stockLimit: 1,
			serviceLevel: 1,
			flavor: 'For doors that have confused policy with physics.',
		},
	],
	'lower-sprawl:station': [
		{
			itemId: 'stim_pack',
			basePrice: 30,
			stockLimit: 6,
			serviceLevel: 0,
			flavor: 'Public-platform price. Murr complains democracy has ruined his margins.',
		},
	],
	'drainmarket:settlement': [
		{
			itemId: 'stim_pack',
			basePrice: 28,
			stockLimit: 6,
			serviceLevel: 0,
			flavor: 'Clinic-certified, market-argued, rainproof enough.',
		},
		{
			itemId: 'nanofur_weave',
			basePrice: 130,
			stockLimit: 1,
			serviceLevel: 1,
			flavor: 'Sewn from flood-rescue insulation and stubbornness.',
		},
	],
	'chrome-arcology:settlement': [
		{
			itemId: 'phase_pick',
			basePrice: 85,
			stockLimit: 2,
			serviceLevel: 0,
			flavor: 'Velvet calls it a universal courtesy credential. Doors call it an incident.',
		},
		{
			itemId: 'ledger_lens',
			basePrice: 145,
			stockLimit: 1,
			serviceLevel: 0,
			flavor: 'Displays the clause behind the clause and the invoice behind the smile.',
		},
		{
			itemId: 'rootkit_badge',
			basePrice: 190,
			stockLimit: 1,
			serviceLevel: 1,
			flavor: 'A staff badge promoted beyond the concept of staff.',
		},
	],
	'mirror-palace:settlement': [
		{
			itemId: 'mirror_thread',
			basePrice: 155,
			stockLimit: 1,
			serviceLevel: 0,
			flavor: 'Vellum calls it discretion woven at orbital thread count. Orchid calls it a curtain with ambitions.',
		},
		{
			itemId: 'phase_mantle',
			basePrice: 180,
			stockLimit: 1,
			serviceLevel: 0,
			flavor: 'Complimentary invisibility. Renewal terms begin when somebody important notices you.',
		},
		{
			itemId: 'ledger_lens',
			basePrice: 135,
			stockLimit: 1,
			serviceLevel: 1,
			flavor: 'Now pairs harmful clauses with the names of their authors instead of the mood of the room.',
		},
	],
	'dub-colony:safehouse': [
		{
			itemId: 'shock_fern',
			basePrice: 95,
			stockLimit: 2,
			serviceLevel: 0,
			flavor: 'Naya grew it beside a speaker coil. It objects to being called tactical salad.',
		},
		{
			itemId: 'solder_mite_swarm',
			basePrice: 150,
			stockLimit: 1,
			serviceLevel: 0,
			flavor: 'Juno guarantees they repair the urgent thing before decorating the wrong thing. Usually.',
		},
		{
			itemId: 'dub_shield',
			basePrice: 205,
			stockLimit: 1,
			serviceLevel: 1,
			flavor: 'Creates time for somebody else to disagree. Damage reduction is almost incidental.',
		},
	],
	'orbital-lift:settlement': [
		{
			itemId: 'gravity_talisman',
			basePrice: 170,
			stockLimit: 1,
			serviceLevel: 0,
			flavor: 'Ballast calls it a reminder that weight is a relationship, not a personality flaw.',
		},
		{
			itemId: 'capacitor_coil',
			basePrice: 145,
			stockLimit: 2,
			serviceLevel: 0,
			flavor: 'Recovered from a customs gate after the gate was reclassified as scrap with opinions.',
		},
		{
			itemId: 'rail_heat_sink',
			basePrice: 190,
			stockLimit: 1,
			serviceLevel: 1,
			flavor: 'Union-rated for sustained fire, emergency braking, and arguments that run long.',
		},
	],
};

export class WorldServiceDirector {
	private readonly places: PlaceDirector;

	constructor(
		private readonly flow: GameFlow,
		private readonly world: WorldDirector
	) {
		this.places = new PlaceDirector(world, flow);
	}

	getShopOffer(locationId: string): ServiceOfferItem[] {
		const place = this.places.getSnapshot(locationId);
		if (!place?.services.some((service) => service.id === 'field-shop')) return [];
		const serviceLevel = place.services.find((service) => service.id === 'field-shop')
			? this.world.getState().locationStates[locationId]?.serviceLevels['field-shop'] ?? 0
			: -1;
		return (SHOP_OFFERS[locationId] ?? [])
			.filter((offer) => offer.serviceLevel <= serviceLevel)
			.map((offer) => this.projectOffer(locationId, offer))
			.filter((offer): offer is ServiceOfferItem => Boolean(offer));
	}

	purchaseItem(locationId: string, itemId: string, quantity = 1): ServiceTransactionReceipt {
		if (!Number.isInteger(quantity) || quantity <= 0) {
			return failure(locationId, 'field-shop', 'invalid-quantity', 'That quantity has no honest arithmetic.');
		}
		const place = this.places.getSnapshot(locationId);
		if (!place?.services.some((service) => service.id === 'field-shop')) {
			return failure(locationId, 'field-shop', 'service-unavailable', 'No canonical field shop operates at this place.');
		}
		const definition = getFirstReleaseItem(itemId);
		if (!definition) return failure(locationId, 'field-shop', 'unknown-item', 'Unknown stock item.');
		const offer = this.getShopOffer(locationId).find((candidate) => candidate.itemId === itemId);
		if (!offer) return failure(locationId, 'field-shop', 'item-not-offered', 'That item is not on this counter.');
		if (quantity > offer.available) {
			return failure(locationId, 'field-shop', 'out-of-stock', 'The shelf has run out before the city has.');
		}
		const totalPrice = offer.price * quantity;
		const debit = this.flow.spendCredchips(totalPrice);
		if (!debit.ok) {
			return {
				...failure(locationId, 'field-shop', 'insufficient-credchips', 'Murr accepts many arguments. This one still needs credchips.'),
				balance: debit.balance,
			};
		}
		const transaction = this.world.executeTransaction([
			{ type: 'add-inventory-item', itemId, quantity },
			{
				type: 'record-economy-entry',
				entry: {
					id: `purchase:${locationId}:${itemId}:${this.world.getState().transitionSequence}`,
					kind: 'purchase',
					amount: totalPrice,
					locationId,
					itemId,
					note: `${quantity} × ${definition.name} purchased through the canonical world service.`,
				},
			},
		]);
		if (!transaction.ok) {
			this.flow.grantCredchips(totalPrice);
			return {
				...failure(locationId, 'field-shop', 'world-write-failed', 'Transaction rolled back; the ledger refused to remember the item.'),
				balance: this.flow.getMeta().credchips,
				worldResult: { ok: false, reason: transaction.reason, state: transaction.state },
			};
		}
		const worldResult: WorldCommandResult = {
			ok: true,
			events: transaction.events,
			state: transaction.state,
		};
		return {
			ok: true,
			changed: true,
			locationId,
			serviceId: 'field-shop',
			itemId,
			quantity,
			totalPrice,
			balance: debit.balance,
			worldResult,
			message: `${definition.name} added to the persistent loadout. ${offer.flavor}`,
		};
	}

	equipItem(itemId: string): ServiceTransactionReceipt {
		const locationId = this.world.getState().currentLocationId;
		const place = this.places.getSnapshot(locationId);
		if (!place?.services.some((service) => service.id === 'loadout-locker')) {
			return failure(
				locationId,
				'loadout-locker',
				'service-unavailable',
				'Equipment changes require a trusted persistent locker.'
			);
		}
		const definition = getFirstReleaseItem(itemId);
		if (!definition) return failure(locationId, 'loadout-locker', 'unknown-item', 'Unknown loadout item.');
		const state = this.world.getState();
		if (!state.inventory.some((stack) => stack.itemId === itemId && stack.quantity > 0)) {
			return failure(state.currentLocationId, 'loadout-locker', 'world-write-failed', 'That item is not in the persistent inventory.');
		}
		const inventory = hydrateInventory(state.inventory, state.equippedItemIds);
		if (!inventory.equip(itemId)) {
			return failure(state.currentLocationId, 'loadout-locker', 'world-write-failed', 'The loadout rejected that equipment change.');
		}
		const worldResult = this.world.execute({
			type: 'set-equipped-items',
			itemIds: inventory.getEquippedItemIds(),
		});
		return {
			ok: worldResult.ok,
			changed: worldResult.ok,
			locationId: state.currentLocationId,
			serviceId: 'loadout-locker',
			itemId,
			worldResult,
			message: worldResult.ok
				? `${definition.name} equipped from the persistent locker.`
				: 'The loadout change did not persist.',
			failure: worldResult.ok ? undefined : 'world-write-failed',
		};
	}

	getEconomyTelemetry(): EconomyTelemetrySnapshot {
		return resolveEconomyTelemetry(this.flow, this.world.getState());
	}

	getServiceStatusLine(locationId: string, serviceId: string): string {
		const state = this.world.getState();
		if (serviceId === 'clinic') {
			return `INTEGRITY ${state.expedition.integrity}/${state.expedition.maxIntegrity} // INJURIES ${state.expedition.injuries} // STIMS ${inventoryQuantity(state.inventory, 'stim_pack')} // STRAIN ${this.serviceStrain(locationId, 'clinic')}/5`;
		}
		if (serviceId === 'greenhouse') {
			return `STIMS ${inventoryQuantity(state.inventory, 'stim_pack')}/6 // STRAIN ${this.serviceStrain(locationId, 'greenhouse')}/4`;
		}
		if (serviceId === 'repair-bench') {
			const broken = Object.values(state.itemStates).filter((item) => item.condition <= 0).length;
			return `CREDCHIPS ${this.flow.getMeta().credchips} // BROKEN ${broken} // REPAIRS ${state.economy.repairCount}`;
		}
		if (serviceId === 'archive' || serviceId === 'legal-aid' || serviceId === 'transit-control') {
			return `LEVEL ${state.advancement.level} // XP ${state.advancement.experience} // CLAIMS ${state.advancement.claimedRewardIds.length}`;
		}
		return `CREDCHIPS ${this.flow.getMeta().credchips}`;
	}

	getServiceActions(locationId: string, serviceId: string): ServiceActionItem[] {
		if (!isExecutableServiceId(serviceId) || !this.serviceAvailable(locationId, serviceId)) return [];
		switch (serviceId) {
			case 'repair-bench':
				return this.getRepairActions(locationId);
			case 'clinic':
				return this.getClinicActions(locationId);
			case 'greenhouse':
				return this.getGreenhouseActions(locationId);
			case 'archive':
			case 'legal-aid':
				return this.getArchiveActions(locationId, serviceId);
			case 'transit-control':
				return this.getTransitActions(locationId);
		}
	}

	performServiceAction(
		locationId: string,
		serviceId: string,
		actionId: string
	): ServiceTransactionReceipt {
		if (!isExecutableServiceId(serviceId) || !this.serviceAvailable(locationId, serviceId)) {
			return failure(locationId, serviceId, 'service-unavailable', 'That institution is not operating here.');
		}
		const action = this.getServiceActions(locationId, serviceId).find(
			(candidate) => candidate.id === actionId
		);
		if (!action) return failure(locationId, serviceId, 'action-unavailable', 'That action is not available in the current world state.');
		if (!action.enabled) return failure(locationId, serviceId, 'action-unavailable', action.detail);
		if (actionId.startsWith('repair:')) return this.repairItem(locationId, actionId.slice('repair:'.length));
		if (actionId.startsWith('modify:')) {
			const [, itemId, modificationId] = actionId.split(':');
			return this.modifyItem(locationId, itemId ?? '', modificationId ?? '');
		}
		if (actionId === 'clinic:stabilize') return this.treatAtClinic(locationId, false);
		if (actionId === 'clinic:full-recovery') return this.treatAtClinic(locationId, true);
		if (actionId === 'greenhouse:harvest-stim') return this.harvestGreenhouse(locationId, false);
		if (actionId === 'greenhouse:cultivate-shock-fern') return this.harvestGreenhouse(locationId, true);
		if (actionId.startsWith('archive:') || actionId.startsWith('legal-aid:')) {
			return this.performArchiveAction(locationId, serviceId as 'archive' | 'legal-aid', actionId);
		}
		if (actionId.startsWith('transit:')) return this.performTransitAction(locationId, actionId);
		return failure(locationId, serviceId, 'action-unavailable', 'The service has no executable rule for that action.');
	}

	private getRepairActions(locationId: string): ServiceActionItem[] {
		const state = this.world.getState();
		const serviceLevel = this.serviceLevel(locationId, 'repair-bench');
		const actions: ServiceActionItem[] = [];
		for (const stack of state.inventory) {
			const definition = getFirstReleaseItem(stack.itemId);
			if (!definition || definition.slot === 'consumable' || definition.slot === 'meta') continue;
			const itemState = createDefaultItemState(state.itemStates[stack.itemId]);
			if (itemState.condition < itemState.maxCondition) {
				const missing = itemState.maxCondition - itemState.condition;
				const price = repairPrice(missing, serviceLevel);
				actions.push({
					id: `repair:${stack.itemId}`,
					serviceId: 'repair-bench',
					label: `Repair ${definition.name}`,
					detail: `Restore ${missing} condition. Repair history stays attached to the item.`,
					suffix: `${itemState.condition}/${itemState.maxCondition} // ${price} CC`,
					enabled: this.flow.getMeta().credchips >= price,
				});
			}
			for (const modification of getAvailableItemModifications(definition, serviceLevel, itemState)) {
				actions.push({
					id: `modify:${stack.itemId}:${modification.id}`,
					serviceId: 'repair-bench',
					label: `${definition.name} // ${modification.name}`,
					detail: modification.description,
					suffix: `${modification.cost} CC`,
					enabled: this.flow.getMeta().credchips >= modification.cost,
				});
			}
		}
		return actions;
	}

	private getClinicActions(locationId: string): ServiceActionItem[] {
		const state = this.world.getState();
		const strain = this.serviceStrain(locationId, 'clinic');
		const stims = inventoryQuantity(state.inventory, 'stim_pack');
		const treatmentNeeded =
			state.expedition.integrity < state.expedition.maxIntegrity || state.expedition.injuries > 0;
		const level = this.serviceLevel(locationId, 'clinic');
		return [
			{
				id: 'clinic:stabilize',
				serviceId: 'clinic',
				label: 'Stabilize and discharge',
				detail: 'Spend one stim supply, restore two integrity, clear one injury, and add one clinic-strain mark.',
				suffix: `1 STIM // STRAIN ${strain}/5`,
				enabled: treatmentNeeded && stims >= 1 && strain < 5,
			},
			{
				id: 'clinic:full-recovery',
				serviceId: 'clinic',
				label: 'Protected overnight recovery',
				detail: 'Spend two stim supplies, restore full integrity, clear injuries, and add two clinic-strain marks.',
				suffix: `2 STIM // LVL ${level} // STRAIN ${strain}/5`,
				enabled: level >= 1 && treatmentNeeded && stims >= 2 && strain <= 3,
			},
		];
	}

	private getGreenhouseActions(locationId: string): ServiceActionItem[] {
		const state = this.world.getState();
		const strain = this.serviceStrain(locationId, 'greenhouse');
		const level = this.serviceLevel(locationId, 'greenhouse');
		const stims = inventoryQuantity(state.inventory, 'stim_pack');
		const cultivated = state.locationStates[locationId]?.flags.includes('greenhouse:shock-fern-cultivated');
		return [
			{
				id: 'greenhouse:harvest-stim',
				serviceId: 'greenhouse',
				label: 'Harvest clinic cutting',
				detail: 'Produce one stim supply and publish the cultivation strain instead of hiding scarcity.',
				suffix: `+1 STIM // STRAIN ${strain}/4`,
				enabled: strain < 4 && stims < 6,
			},
			{
				id: 'greenhouse:cultivate-shock-fern',
				serviceId: 'greenhouse',
				label: 'Cultivate a Shock Fern',
				detail: 'A one-time rare cutting grown through a visible two-mark strain on the local habitat.',
				suffix: `LVL ${level} // STRAIN ${strain}/4`,
				enabled: level >= 1 && !cultivated && strain <= 2,
			},
		];
	}

	private getArchiveActions(
		locationId: string,
		serviceId: 'archive' | 'legal-aid'
	): ServiceActionItem[] {
		const claimed = new Set(this.world.getState().advancement.claimedRewardIds);
		const prefix = `${serviceId}:${locationId}`;
		return [
			{
				id: `${serviceId}:review-records`,
				serviceId,
				label: serviceId === 'archive' ? 'Review the public record' : 'Review the standing case',
				detail: 'Translate documents into exploration mastery without exposing protected identities.',
				suffix: claimed.has(`${prefix}:review-records`) ? 'RECORDED' : '+20 XP',
				enabled: !claimed.has(`${prefix}:review-records`),
			},
			{
				id: `${serviceId}:protect-sensitive-route`,
				serviceId,
				label: 'Write a protected-route clause',
				detail: 'Record purpose, audience, expiry, refusal, and an emergency challenge path.',
				suffix: claimed.has(`${prefix}:protect-sensitive-route`) ? 'RECORDED' : '+30 XP',
				enabled: !claimed.has(`${prefix}:protect-sensitive-route`),
			},
		];
	}

	private getTransitActions(locationId: string): ServiceActionItem[] {
		const claimed = new Set(this.world.getState().advancement.claimedRewardIds);
		return [
			{
				id: 'transit:publish-delay-reasons',
				serviceId: 'transit-control',
				label: 'Publish delay reasons',
				detail: 'Attach cause, confidence, affected passengers, and an objection path to the timetable.',
				suffix: claimed.has(`transit:${locationId}:delay-reasons`) ? 'PUBLISHED' : '+20 XP',
				enabled: !claimed.has(`transit:${locationId}:delay-reasons`),
			},
			{
				id: 'transit:rotate-maintenance-window',
				serviceId: 'transit-control',
				label: 'Rotate maintenance authority',
				detail: 'Name the crew, scope, expiry, replacement, and who may interrupt the work.',
				suffix: claimed.has(`transit:${locationId}:maintenance-window`) ? 'ROTATED' : '+30 XP',
				enabled: !claimed.has(`transit:${locationId}:maintenance-window`),
			},
		];
	}

	private repairItem(locationId: string, itemId: string): ServiceTransactionReceipt {
		const definition = getFirstReleaseItem(itemId);
		const state = this.world.getState();
		if (!definition) return failure(locationId, 'repair-bench', 'unknown-item', 'Unknown repair item.');
		const itemState = createDefaultItemState(state.itemStates[itemId]);
		if (itemState.condition >= itemState.maxCondition) {
			return failure(locationId, 'repair-bench', 'item-full-condition', 'That item is already fully serviceable.');
		}
		const totalPrice = repairPrice(
			itemState.maxCondition - itemState.condition,
			this.serviceLevel(locationId, 'repair-bench')
		);
		const commands: WorldCommand[] = [
			{ type: 'set-item-condition', itemId, condition: itemState.maxCondition },
			this.economyCommand('repair', totalPrice, locationId, itemId, `${definition.name} restored to full condition.`),
		];
		const firstRepairReward = `service-repair:${itemId}`;
		if (!state.advancement.claimedRewardIds.includes(firstRepairReward)) {
			commands.push({
				type: 'claim-resolution-reward',
				rewardId: firstRepairReward,
				experience: 15,
				approaches: ['repair'],
			});
		}
		return this.performPaidWorldTransaction(
			locationId,
			'repair-bench',
			`repair:${itemId}`,
			totalPrice,
			commands,
			`${definition.name} repaired. The bench records what failed and who can repeat the work.`
		);
	}

	private modifyItem(
		locationId: string,
		itemId: string,
		modificationId: string
	): ServiceTransactionReceipt {
		const definition = getFirstReleaseItem(itemId);
		const modification = getItemModification(modificationId);
		if (!definition || !modification) {
			return failure(locationId, 'repair-bench', 'modification-unavailable', 'That modification is not catalogued.');
		}
		const available = getAvailableItemModifications(
			definition,
			this.serviceLevel(locationId, 'repair-bench'),
			createDefaultItemState(this.world.getState().itemStates[itemId])
		).some((candidate) => candidate.id === modificationId);
		if (!available) {
			return failure(locationId, 'repair-bench', 'modification-unavailable', 'The item, service level, or existing modification rejects that work.');
		}
		const commands: WorldCommand[] = [
			{ type: 'set-item-modification', itemId, modificationId },
			this.economyCommand(
				'modification',
				modification.cost,
				locationId,
				itemId,
				`${modification.name} installed on ${definition.name}.`
			),
		];
		const rewardId = `service-modification:${itemId}:${modificationId}`;
		if (!this.world.getState().advancement.claimedRewardIds.includes(rewardId)) {
			commands.push({
				type: 'claim-resolution-reward',
				rewardId,
				experience: 25,
				approaches: ['repair'],
			});
		}
		return this.performPaidWorldTransaction(
			locationId,
			'repair-bench',
			`modify:${itemId}:${modificationId}`,
			modification.cost,
			commands,
			`${modification.name} installed on ${definition.name}. ${modification.description}`
		);
	}

	private treatAtClinic(locationId: string, fullRecovery: boolean): ServiceTransactionReceipt {
		const state = this.world.getState();
		const strain = this.serviceStrain(locationId, 'clinic');
		const treatmentNeeded =
			state.expedition.integrity < state.expedition.maxIntegrity || state.expedition.injuries > 0;
		if (!treatmentNeeded) return failure(locationId, 'clinic', 'treatment-unnecessary', 'The bed stays free for somebody who needs it.');
		const supplies = fullRecovery ? 2 : 1;
		const strainDelta = fullRecovery ? 2 : 1;
		if (inventoryQuantity(state.inventory, 'stim_pack') < supplies) {
			return failure(locationId, 'clinic', 'insufficient-supplies', 'The clinic will not invent medicine by charging a larger number.');
		}
		if (strain + strainDelta > 5) {
			return failure(locationId, 'clinic', 'service-strained', 'The clinic needs another route or another shift before accepting this treatment.');
		}
		const integrity = fullRecovery
			? state.expedition.maxIntegrity
			: Math.min(state.expedition.maxIntegrity, state.expedition.integrity + 2);
		const injuries = fullRecovery ? 0 : Math.max(0, state.expedition.injuries - 1);
		return this.performFreeWorldTransaction(
			locationId,
			'clinic',
			fullRecovery ? 'clinic:full-recovery' : 'clinic:stabilize',
			[
				{ type: 'remove-inventory-item', itemId: 'stim_pack', quantity: supplies },
				{ type: 'adjust-service-strain', locationId, serviceId: 'clinic', delta: strainDelta },
				{ type: 'set-expedition-vitals', integrity, injuries },
				this.economyCommand('clinic', 0, locationId, 'stim_pack', `${supplies} clinic supply consumed; strain ${strainDelta}.`),
			],
			fullRecovery
				? 'Protected recovery complete. The clinic publishes the supplies and strain it carried.'
				: 'Stabilized and discharged. The clinic did not convert scarcity into debt.'
		);
	}

	private harvestGreenhouse(locationId: string, rareCutting: boolean): ServiceTransactionReceipt {
		const state = this.world.getState();
		const strain = this.serviceStrain(locationId, 'greenhouse');
		const strainDelta = rareCutting ? 2 : 1;
		if (!rareCutting && inventoryQuantity(state.inventory, 'stim_pack') >= 6) {
			return failure(
				locationId,
				'greenhouse',
				'out-of-stock',
				'The persistent stim stack is full; harvest would become waste.'
			);
		}
		if (strain + strainDelta > 4) {
			return failure(locationId, 'greenhouse', 'service-strained', 'The greenhouse needs recovery time before another harvest.');
		}
		if (rareCutting && state.locationStates[locationId]?.flags.includes('greenhouse:shock-fern-cultivated')) {
			return failure(locationId, 'greenhouse', 'action-unavailable', 'The rare cutting is already in circulation.');
		}
		const itemId = rareCutting ? 'shock_fern' : 'stim_pack';
		const commands: WorldCommand[] = [
			{ type: 'add-inventory-item', itemId, quantity: 1 },
			{ type: 'adjust-service-strain', locationId, serviceId: 'greenhouse', delta: strainDelta },
			this.economyCommand('greenhouse', 0, locationId, itemId, `${itemId} cultivated with ${strainDelta} visible strain.`),
		];
		if (rareCutting) {
			commands.push({ type: 'set-location-flag', locationId, flag: 'greenhouse:shock-fern-cultivated' });
			commands.push({
				type: 'claim-resolution-reward',
				rewardId: `greenhouse:${locationId}:shock-fern`,
				experience: 25,
				approaches: ['repair', 'exploration'],
			});
		}
		return this.performFreeWorldTransaction(
			locationId,
			'greenhouse',
			rareCutting ? 'greenhouse:cultivate-shock-fern' : 'greenhouse:harvest-stim',
			commands,
			rareCutting
				? 'Shock Fern cultivated. The habitat ledger shows what the harvest cost.'
				: 'Clinic cutting harvested. Scarcity remains visible in the greenhouse strain ledger.'
		);
	}

	private performArchiveAction(
		locationId: string,
		serviceId: 'archive' | 'legal-aid',
		actionId: string
	): ServiceTransactionReceipt {
		const suffix = actionId.split(':').at(-1) ?? 'review-records';
		const rewardId = `${serviceId}:${locationId}:${suffix}`;
		const protect = suffix === 'protect-sensitive-route';
		return this.performFreeWorldTransaction(
			locationId,
			serviceId,
			actionId,
			[
				{
					type: 'claim-resolution-reward',
					rewardId,
					experience: protect ? 30 : 20,
					approaches: protect ? ['social', 'exploration'] : ['exploration'],
				},
				{ type: 'set-location-flag', locationId, flag: rewardId },
			],
			protect
				? 'Protected-route clause recorded with purpose, expiry, refusal, and a challenge path.'
				: 'Record reviewed without converting protected people into collectible lore.'
		);
	}

	private performTransitAction(locationId: string, actionId: string): ServiceTransactionReceipt {
		const delayReasons = actionId === 'transit:publish-delay-reasons';
		const rewardId = delayReasons
			? `transit:${locationId}:delay-reasons`
			: `transit:${locationId}:maintenance-window`;
		const commands: WorldCommand[] = [
			{
				type: 'claim-resolution-reward',
				rewardId,
				experience: delayReasons ? 20 : 30,
				approaches: delayReasons ? ['exploration'] : ['repair', 'social'],
			},
			{ type: 'set-location-flag', locationId, flag: rewardId },
		];
		if (!delayReasons && this.serviceStrain(locationId, 'transit-control') > 0) {
			commands.push({
				type: 'adjust-service-strain',
				locationId,
				serviceId: 'transit-control',
				delta: -1,
			});
		}
		return this.performFreeWorldTransaction(
			locationId,
			'transit-control',
			actionId,
			commands,
			delayReasons
				? 'Delay reasons published with confidence and an objection path.'
				: 'Maintenance authority rotated with scope, expiry, replacement, and interruption rights.'
		);
	}

	private performPaidWorldTransaction(
		locationId: string,
		serviceId: string,
		actionId: string,
		totalPrice: number,
		commands: WorldCommand[],
		message: string
	): ServiceTransactionReceipt {
		const debit = this.flow.spendCredchips(totalPrice);
		if (!debit.ok) {
			return {
				...failure(locationId, serviceId, 'insufficient-credchips', 'The work has a material cost the current balance cannot cover.'),
				actionId,
				balance: debit.balance,
			};
		}
		const transaction = this.world.executeTransaction(commands);
		if (!transaction.ok) {
			this.flow.grantCredchips(totalPrice);
			return {
				...failure(locationId, serviceId, 'world-write-failed', 'The transaction failed atomically; no supplies or currency were consumed.'),
				actionId,
				balance: this.flow.getMeta().credchips,
				worldResult: { ok: false, reason: transaction.reason, state: transaction.state },
			};
		}
		return {
			ok: true,
			changed: true,
			locationId,
			serviceId,
			actionId,
			totalPrice,
			balance: debit.balance,
			worldResult: { ok: true, events: transaction.events, state: transaction.state },
			message,
		};
	}

	private performFreeWorldTransaction(
		locationId: string,
		serviceId: string,
		actionId: string,
		commands: WorldCommand[],
		message: string
	): ServiceTransactionReceipt {
		const transaction = this.world.executeTransaction(commands);
		if (!transaction.ok) {
			return {
				...failure(locationId, serviceId, 'world-write-failed', 'The service transaction failed atomically.'),
				actionId,
				worldResult: { ok: false, reason: transaction.reason, state: transaction.state },
			};
		}
		return {
			ok: true,
			changed: true,
			locationId,
			serviceId,
			actionId,
			worldResult: { ok: true, events: transaction.events, state: transaction.state },
			message,
		};
	}

	private economyCommand(
		kind: 'repair' | 'modification' | 'clinic' | 'greenhouse',
		amount: number,
		locationId: string,
		itemId: string,
		note: string
	): WorldCommand {
		return {
			type: 'record-economy-entry',
			entry: {
				id: `${kind}:${locationId}:${itemId}:${this.world.getState().transitionSequence}`,
				kind,
				amount,
				locationId,
				itemId,
				note,
			},
		};
	}

	private serviceAvailable(locationId: string, serviceId: string): boolean {
		return Boolean(this.places.getSnapshot(locationId)?.services.some((service) => service.id === serviceId));
	}

	private serviceLevel(locationId: string, serviceId: string): number {
		return this.world.getState().locationStates[locationId]?.serviceLevels[serviceId] ?? 0;
	}

	private serviceStrain(locationId: string, serviceId: string): number {
		return this.world.getState().locationStates[locationId]?.serviceStrain[serviceId] ?? 0;
	}

	private projectOffer(locationId: string, offer: ServiceOfferDef): ServiceOfferItem | null {
		const definition = getFirstReleaseItem(offer.itemId);
		if (!definition) return null;
		const state = this.world.getState();
		const owned = state.inventory.find((stack) => stack.itemId === offer.itemId)?.quantity ?? 0;
		const providerTrust = this.providerTrust(locationId);
		const meta = this.flow.getMeta();
		const pressure = 1 + Math.min(0.35, Math.max(0, meta.orbitHeat) * 0.04);
		const favor = 1 - Math.max(-0.12, Math.min(0.12, meta.dubFavor * 0.02));
		const trust = 1 - Math.max(-0.1, Math.min(0.1, providerTrust * 0.002));
		return {
			...offer,
			name: definition.name,
			price: roundToFive(offer.basePrice * pressure * favor * trust),
			owned,
			available: Math.max(0, offer.stockLimit - owned),
			effect: definition.effect,
		};
	}

	private providerTrust(locationId: string): number {
		const snapshot = this.places.getSnapshot(locationId);
		const providerId = snapshot?.services.find((service) => service.id === 'field-shop')?.providerNpcId;
		return providerId ? this.world.getState().npcStates[providerId]?.trust ?? 0 : 0;
	}
}

function hydrateInventory(
	stacks: readonly { itemId: string; quantity: number }[],
	equippedItemIds: readonly string[]
): InventorySystem {
	const inventory = new InventorySystem(FIRST_RELEASE_ITEM_CATALOG);
	for (const stack of stacks) inventory.addItem(stack.itemId, stack.quantity);
	for (const itemId of equippedItemIds) inventory.equip(itemId);
	return inventory;
}

function roundToFive(value: number): number {
	return Math.max(5, Math.round(value / 5) * 5);
}

function repairPrice(missingCondition: number, serviceLevel: number): number {
	const discount = Math.min(0.3, Math.max(0, serviceLevel) * 0.08);
	return roundToFive((15 + Math.max(0, missingCondition) * 1.2) * (1 - discount));
}

function inventoryQuantity(
	stacks: readonly { itemId: string; quantity: number }[],
	itemId: string
): number {
	return stacks.find((stack) => stack.itemId === itemId)?.quantity ?? 0;
}

function isExecutableServiceId(serviceId: string): serviceId is ExecutableServiceId {
	return [
		'repair-bench',
		'clinic',
		'archive',
		'legal-aid',
		'greenhouse',
		'transit-control',
	].includes(serviceId);
}

function failure(
	locationId: string,
	serviceId: string,
	reason: ServiceTransactionFailure,
	message: string
): ServiceTransactionReceipt {
	return { ok: false, changed: false, locationId, serviceId, failure: reason, message };
}

import {
	createDefaultAdventureSave,
	levelForExperience,
	type AdventureSaveV2,
	type AdventureQuestState,
	type DistrictStoryPhase,
	type QuestStatus,
} from './AdventureState';
import {
	RESOLUTION_APPROACHES,
	type ResolutionApproach,
} from '../ResolutionApproach';
import {
	ADVENTURE_TRAVEL_GRAPH,
	getLocationDef,
	getOtherRouteEndpoint,
	getRoutesForLocation,
	resolveLocationSpawn,
	type TravelGraph,
} from './WorldGraph';
import {
	ECONOMY_JOURNAL_LIMIT,
	createDefaultItemState,
	normalizeOwnedItemStates,
	type AdventureEconomyEntry,
	type AdventureItemState,
	type ExpeditionCommit,
} from './ExpeditionLedger';

export type WorldCommand =
	| { type: 'discover-location'; locationId: string }
	| { type: 'unlock-route'; routeId: string }
	| { type: 'travel'; destinationId: string; spawnId?: string }
	| { type: 'debug-travel'; destinationId: string; spawnId?: string }
	| { type: 'set-respawn'; locationId: string; spawnId?: string }
	| { type: 'respawn' }
	| { type: 'set-district-phase'; districtId: string; phase: DistrictStoryPhase }
	| { type: 'set-quest-state'; questId: string; status: QuestStatus; stepId?: string }
	| { type: 'progress-quest-objective'; questId: string; objectiveId: string; amount: number }
	| {
			type: 'record-conversation';
			npcId: string;
			conversationId: string;
			trustDelta?: number;
			flag?: string;
		}
	| { type: 'relocate-npc'; npcId: string; locationId: string }
	| { type: 'set-location-flag'; locationId: string; flag: string }
	| { type: 'set-service-level'; locationId: string; serviceId: string; level: number }
	| { type: 'adjust-service-strain'; locationId: string; serviceId: string; delta: number }
	| { type: 'add-inventory-item'; itemId: string; quantity: number }
	| { type: 'remove-inventory-item'; itemId: string; quantity: number }
	| { type: 'set-equipped-items'; itemIds: string[] }
	| { type: 'set-item-condition'; itemId: string; condition: number }
	| { type: 'set-item-modification'; itemId: string; modificationId?: string }
	| { type: 'set-expedition-vitals'; integrity: number; maxIntegrity?: number; injuries?: number }
	| { type: 'commit-expedition'; commit: ExpeditionCommit }
	| { type: 'record-economy-entry'; entry: Omit<AdventureEconomyEntry, 'sequence'> }
	| {
			type: 'claim-resolution-reward';
			rewardId: string;
			experience: number;
			approaches: ResolutionApproach[];
		}
	| { type: 'set-world-flag'; flag: string };

export type WorldEvent =
	| { type: 'location-discovered'; locationId: string }
	| { type: 'route-unlocked'; routeId: string }
	| { type: 'location-entered'; locationId: string; spawnId: string; debug: boolean }
	| { type: 'respawn-anchor-set'; locationId: string; spawnId: string }
	| { type: 'district-phase-set'; districtId: string; phase: DistrictStoryPhase }
	| { type: 'quest-state-set'; questId: string; state: AdventureQuestState }
	| { type: 'quest-objective-progressed'; questId: string; objectiveId: string; amount: number }
	| {
			type: 'conversation-recorded';
			npcId: string;
			conversationId: string;
			trustDelta: number;
			flag?: string;
		}
	| { type: 'npc-relocated'; npcId: string; locationId: string }
	| { type: 'location-flag-set'; locationId: string; flag: string }
	| { type: 'service-level-set'; locationId: string; serviceId: string; level: number }
	| { type: 'service-strain-adjusted'; locationId: string; serviceId: string; delta: number }
	| { type: 'inventory-item-added'; itemId: string; quantity: number }
	| { type: 'inventory-item-removed'; itemId: string; quantity: number }
	| { type: 'equipped-items-set'; itemIds: string[] }
	| { type: 'item-condition-set'; itemId: string; condition: number }
	| { type: 'item-modification-set'; itemId: string; modificationId?: string }
	| { type: 'expedition-vitals-set'; integrity: number; maxIntegrity: number; injuries: number }
	| { type: 'expedition-committed'; commit: ExpeditionCommit }
	| { type: 'economy-entry-recorded'; entry: AdventureEconomyEntry }
	| {
			type: 'resolution-reward-claimed';
			rewardId: string;
			experience: number;
			approaches: ResolutionApproach[];
		}
	| { type: 'world-flag-set'; flag: string };

export type WorldCommandFailure =
	| 'unknown-location'
	| 'unknown-route'
	| 'unknown-district'
	| 'location-undiscovered'
	| 'route-locked'
	| 'location-unreachable'
	| 'unknown-spawn'
	| 'invalid-identity'
	| 'invalid-progress'
	| 'invalid-quantity'
	| 'insufficient-item'
	| 'item-not-owned'
	| 'reward-already-claimed'
	| 'invalid-experience'
	| 'invalid-service-level'
	| 'invalid-service-strain'
	| 'invalid-condition'
	| 'invalid-expedition'
	| 'expedition-already-committed'
	| 'invalid-economy-entry'
	| 'invalid-flag';

export type WorldCommandResult =
	| { ok: true; events: WorldEvent[]; state: AdventureSaveV2 }
	| { ok: false; reason: WorldCommandFailure; state: AdventureSaveV2 };

export type WorldTransactionResult =
	| { ok: true; events: WorldEvent[]; state: AdventureSaveV2 }
	| { ok: false; reason: WorldCommandFailure; failedCommandIndex: number; state: AdventureSaveV2 };

const VALID_RESOLUTION_APPROACHES = new Set<ResolutionApproach>(RESOLUTION_APPROACHES);

/**
 * Pure command decision. Commands express intent; events are the only durable
 * world changes. Keeping the decision function pure makes travel replayable,
 * testable, and suitable for future deterministic debug timelines.
 */
export function decideWorldCommand(
	graph: TravelGraph,
	state: AdventureSaveV2,
	command: WorldCommand
): WorldEvent[] | WorldCommandFailure {
	switch (command.type) {
		case 'discover-location':
			if (!getLocationDef(graph, command.locationId)) return 'unknown-location';
			return state.discoveredLocationIds.includes(command.locationId)
				? []
				: [{ type: 'location-discovered', locationId: command.locationId }];
		case 'unlock-route':
			if (!graph.routes.some((route) => route.id === command.routeId)) return 'unknown-route';
			return state.unlockedRouteIds.includes(command.routeId)
				? []
				: [{ type: 'route-unlocked', routeId: command.routeId }];
		case 'travel':
			return decideTravel(graph, state, command.destinationId, command.spawnId, false);
		case 'debug-travel':
			return decideTravel(graph, state, command.destinationId, command.spawnId, true);
		case 'set-respawn': {
			const spawnId = resolveLocationSpawn(graph, command.locationId, command.spawnId);
			if (!getLocationDef(graph, command.locationId)) return 'unknown-location';
			if (!spawnId) return 'unknown-spawn';
			return [{ type: 'respawn-anchor-set', locationId: command.locationId, spawnId }];
		}
		case 'respawn':
			return [
				{
					type: 'location-entered',
					locationId: state.respawnAnchor.locationId,
					spawnId: state.respawnAnchor.spawnId,
					debug: false,
				},
			];
		case 'adjust-service-strain':
			if (!getLocationDef(graph, command.locationId)) return 'unknown-location';
			if (!validIdentity(command.serviceId)) return 'invalid-identity';
			if (!Number.isInteger(command.delta) || command.delta === 0) return 'invalid-service-strain';
			return [
				{
					type: 'service-strain-adjusted',
					locationId: command.locationId,
					serviceId: command.serviceId,
					delta: command.delta,
				},
			];
		case 'progress-quest-objective':
			if (!validIdentity(command.questId) || !validIdentity(command.objectiveId)) {
				return 'invalid-identity';
			}
			if (!Number.isFinite(command.amount) || command.amount <= 0) {
				return 'invalid-progress';
			}
			return [
				{
					type: 'quest-objective-progressed',
					questId: command.questId,
					objectiveId: command.objectiveId,
					amount: command.amount,
				},
			];
		case 'set-district-phase':
			if (!graph.districts.some((district) => district.id === command.districtId)) {
				return 'unknown-district';
			}
			return [{ type: 'district-phase-set', districtId: command.districtId, phase: command.phase }];
		case 'set-quest-state':
			if (!validIdentity(command.questId)) return 'invalid-identity';
			return [
				{
					type: 'quest-state-set',
					questId: command.questId,
					state: { status: command.status, stepId: command.stepId },
				},
			];
		case 'record-conversation':
			if (!validIdentity(command.npcId) || !validIdentity(command.conversationId)) {
				return 'invalid-identity';
			}
			return [
				{
					type: 'conversation-recorded',
					npcId: command.npcId,
					conversationId: command.conversationId,
					trustDelta: Math.trunc(command.trustDelta ?? 0),
					flag: command.flag,
				},
			];
		case 'relocate-npc':
			if (!validIdentity(command.npcId)) return 'invalid-identity';
			if (!getLocationDef(graph, command.locationId)) return 'unknown-location';
			return [{ type: 'npc-relocated', npcId: command.npcId, locationId: command.locationId }];
		case 'set-location-flag':
			if (!getLocationDef(graph, command.locationId)) return 'unknown-location';
			return command.flag.length > 0
				? [{ type: 'location-flag-set', locationId: command.locationId, flag: command.flag }]
				: 'invalid-flag';
		case 'set-service-level':
			if (!getLocationDef(graph, command.locationId)) return 'unknown-location';
			if (!validIdentity(command.serviceId)) return 'invalid-identity';
			if (!Number.isFinite(command.level) || command.level < 0) return 'invalid-service-level';
			return [
				{
					type: 'service-level-set',
					locationId: command.locationId,
					serviceId: command.serviceId,
					level: Math.floor(command.level),
				},
			];
		case 'add-inventory-item':
			if (!validIdentity(command.itemId)) return 'invalid-identity';
			if (!Number.isInteger(command.quantity) || command.quantity <= 0) {
				return 'invalid-quantity';
			}
			return [
				{ type: 'inventory-item-added', itemId: command.itemId, quantity: command.quantity },
			];
		case 'remove-inventory-item': {
			if (!validIdentity(command.itemId)) return 'invalid-identity';
			if (!Number.isInteger(command.quantity) || command.quantity <= 0) {
				return 'invalid-quantity';
			}
			const owned = state.inventory.find((stack) => stack.itemId === command.itemId)?.quantity ?? 0;
			if (owned < command.quantity) return 'insufficient-item';
			return [
				{ type: 'inventory-item-removed', itemId: command.itemId, quantity: command.quantity },
			];
		}
		case 'set-equipped-items': {
			const itemIds = [...new Set(command.itemIds)];
			if (itemIds.some((itemId) => !validIdentity(itemId))) return 'invalid-identity';
			const owned = new Set(state.inventory.filter((stack) => stack.quantity > 0).map((stack) => stack.itemId));
			if (itemIds.some((itemId) => !owned.has(itemId))) return 'item-not-owned';
			return [{ type: 'equipped-items-set', itemIds }];
		}
		case 'set-item-condition': {
			if (!validIdentity(command.itemId)) return 'invalid-identity';
			if (!state.inventory.some((stack) => stack.itemId === command.itemId && stack.quantity > 0)) {
				return 'item-not-owned';
			}
			const itemState = createDefaultItemState(state.itemStates[command.itemId]);
			if (!Number.isFinite(command.condition) || command.condition < 0) return 'invalid-condition';
			return [
				{
					type: 'item-condition-set',
					itemId: command.itemId,
					condition: Math.min(itemState.maxCondition, Math.floor(command.condition)),
				},
			];
		}
		case 'set-item-modification':
			if (!validIdentity(command.itemId)) return 'invalid-identity';
			if (!state.inventory.some((stack) => stack.itemId === command.itemId && stack.quantity > 0)) {
				return 'item-not-owned';
			}
			if (command.modificationId && !validIdentity(command.modificationId)) return 'invalid-identity';
			return [
				{
					type: 'item-modification-set',
					itemId: command.itemId,
					modificationId: command.modificationId,
				},
			];
		case 'set-expedition-vitals': {
			const maxIntegrity = command.maxIntegrity ?? state.expedition.maxIntegrity;
			const injuries = command.injuries ?? state.expedition.injuries;
			if (
				!Number.isInteger(maxIntegrity) ||
				maxIntegrity <= 0 ||
				!Number.isInteger(command.integrity) ||
				command.integrity < 1 ||
				command.integrity > maxIntegrity ||
				!Number.isInteger(injuries) ||
				injuries < 0
			) {
				return 'invalid-expedition';
			}
			return [
				{
					type: 'expedition-vitals-set',
					integrity: command.integrity,
					maxIntegrity,
					injuries,
				},
			];
		}
		case 'commit-expedition': {
			const commit = sanitizeExpeditionCommit(command.commit);
			if (!commit) return 'invalid-expedition';
			if (state.expedition.settledRunIds.includes(commit.runId)) {
				return 'expedition-already-committed';
			}
			return [{ type: 'expedition-committed', commit }];
		}
		case 'record-economy-entry': {
			const entry = command.entry;
			if (state.economy.journal.some((candidate) => candidate.id === entry.id)) return [];
			if (
				!validIdentity(entry.id) ||
				!Number.isInteger(entry.amount) ||
				entry.amount < 0 ||
				entry.note.length === 0
			) {
				return 'invalid-economy-entry';
			}
			return [
				{
					type: 'economy-entry-recorded',
					entry: { ...entry, sequence: state.transitionSequence + 1 },
				},
			];
		}
		case 'claim-resolution-reward': {
			if (!validIdentity(command.rewardId)) return 'invalid-identity';
			if (!Number.isInteger(command.experience) || command.experience <= 0) {
				return 'invalid-experience';
			}
			if (state.advancement.claimedRewardIds.includes(command.rewardId)) {
				return 'reward-already-claimed';
			}
			if (command.approaches.some((approach) => !VALID_RESOLUTION_APPROACHES.has(approach))) {
				return 'invalid-identity';
			}
			return [
				{
					type: 'resolution-reward-claimed',
					rewardId: command.rewardId,
					experience: command.experience,
					approaches: [...new Set(command.approaches)],
				},
			];
		}
		case 'set-world-flag':
			return command.flag.length > 0
				? [{ type: 'world-flag-set', flag: command.flag }]
				: 'invalid-flag';
	}
}

function decideTravel(
	graph: TravelGraph,
	state: AdventureSaveV2,
	destinationId: string,
	spawnId: string | undefined,
	debug: boolean
): WorldEvent[] | WorldCommandFailure {
	if (!getLocationDef(graph, destinationId)) return 'unknown-location';
	const resolvedSpawn = resolveLocationSpawn(graph, destinationId, spawnId);
	if (!resolvedSpawn) return 'unknown-spawn';
	if (!debug && !state.discoveredLocationIds.includes(destinationId)) {
		return 'location-undiscovered';
	}
	if (!debug && destinationId !== state.currentLocationId) {
		const connecting = getRoutesForLocation(graph, state.currentLocationId).filter(
			(route) => getOtherRouteEndpoint(route, state.currentLocationId) === destinationId
		);
		if (connecting.length === 0) return 'location-unreachable';
		if (!connecting.some((route) => state.unlockedRouteIds.includes(route.id))) {
			return 'route-locked';
		}
	}
	const events: WorldEvent[] = [];
	if (!state.discoveredLocationIds.includes(destinationId)) {
		events.push({ type: 'location-discovered', locationId: destinationId });
	}
	events.push({
		type: 'location-entered',
		locationId: destinationId,
		spawnId: resolvedSpawn,
		debug,
	});
	return events;
}

export function evolveWorldState(state: AdventureSaveV2, event: WorldEvent): AdventureSaveV2 {
	const next = structuredClone(state) as AdventureSaveV2;
	next.transitionSequence += 1;
	switch (event.type) {
		case 'location-discovered':
			next.discoveredLocationIds = appendUnique(next.discoveredLocationIds, event.locationId);
			break;
		case 'route-unlocked':
			next.unlockedRouteIds = appendUnique(next.unlockedRouteIds, event.routeId);
			break;
		case 'location-entered':
			next.currentLocationId = event.locationId;
			next.currentSpawnId = event.spawnId;
			next.discoveredLocationIds = appendUnique(next.discoveredLocationIds, event.locationId);
			next.visitedLocationIds = appendUnique(next.visitedLocationIds, event.locationId);
			next.locationStates[event.locationId] = {
				visitCount: (next.locationStates[event.locationId]?.visitCount ?? 0) + 1,
				flags: [...(next.locationStates[event.locationId]?.flags ?? [])],
				serviceLevels: { ...(next.locationStates[event.locationId]?.serviceLevels ?? {}) },
				serviceStrain: { ...(next.locationStates[event.locationId]?.serviceStrain ?? {}) },
			};
			break;
		case 'respawn-anchor-set':
			next.respawnAnchor = { locationId: event.locationId, spawnId: event.spawnId };
			break;
		case 'district-phase-set':
			next.districtPhases[event.districtId] = event.phase;
			break;
		case 'quest-state-set':
			next.questStates[event.questId] = {
				...(next.questStates[event.questId] ?? { status: 'hidden' as const }),
				...event.state,
				objectiveProgress:
					event.state.objectiveProgress ?? next.questStates[event.questId]?.objectiveProgress,
			};
			break;
		case 'quest-objective-progressed': {
			const current = next.questStates[event.questId] ?? { status: 'active' as const };
			next.questStates[event.questId] = {
				...current,
				objectiveProgress: {
					...(current.objectiveProgress ?? {}),
					[event.objectiveId]:
						(current.objectiveProgress?.[event.objectiveId] ?? 0) + event.amount,
				},
			};
			break;
		}
		case 'conversation-recorded': {
			const current = next.npcStates[event.npcId] ?? {
				met: false,
				trust: 0,
				conversationIds: [],
				flags: [],
			};
			next.npcStates[event.npcId] = {
				...current,
				met: true,
				trust: Math.min(100, Math.max(-100, current.trust + event.trustDelta)),
				conversationIds: appendUnique(current.conversationIds, event.conversationId),
				flags: event.flag ? appendUnique(current.flags, event.flag) : [...current.flags],
			};
			break;
		}
		case 'npc-relocated': {
			const current = next.npcStates[event.npcId] ?? {
				met: false,
				trust: 0,
				conversationIds: [],
				flags: [],
			};
			next.npcStates[event.npcId] = { ...current, currentLocationId: event.locationId };
			break;
		}
		case 'location-flag-set': {
			const current = next.locationStates[event.locationId] ?? {
				visitCount: 0,
				flags: [],
				serviceLevels: {},
				serviceStrain: {},
			};
			next.locationStates[event.locationId] = {
				...current,
				flags: appendUnique(current.flags, event.flag),
			};
			break;
		}
		case 'service-level-set': {
			const current = next.locationStates[event.locationId] ?? {
				visitCount: 0,
				flags: [],
				serviceLevels: {},
				serviceStrain: {},
			};
			next.locationStates[event.locationId] = {
				...current,
				serviceLevels: { ...current.serviceLevels, [event.serviceId]: event.level },
			};
			break;
		}
		case 'service-strain-adjusted': {
			const current = next.locationStates[event.locationId] ?? {
				visitCount: 0,
				flags: [],
				serviceLevels: {},
				serviceStrain: {},
			};
			next.locationStates[event.locationId] = {
				...current,
				serviceStrain: {
					...current.serviceStrain,
					[event.serviceId]: Math.max(0, (current.serviceStrain[event.serviceId] ?? 0) + event.delta),
				},
			};
			break;
		}
		case 'inventory-item-added': {
			const current = next.inventory.find((stack) => stack.itemId === event.itemId);
			if (current) current.quantity += event.quantity;
			else next.inventory.push({ itemId: event.itemId, quantity: event.quantity });
			next.itemStates[event.itemId] = createDefaultItemState(next.itemStates[event.itemId]);
			next.inventory.sort((a, b) => a.itemId.localeCompare(b.itemId));
			break;
		}
		case 'inventory-item-removed': {
			const current = next.inventory.find((stack) => stack.itemId === event.itemId);
			if (!current) break;
			current.quantity -= event.quantity;
			if (current.quantity <= 0) {
				next.inventory = next.inventory.filter((stack) => stack.itemId !== event.itemId);
				next.equippedItemIds = next.equippedItemIds.filter((itemId) => itemId !== event.itemId);
				delete next.itemStates[event.itemId];
			}
			break;
		}
		case 'equipped-items-set':
			next.equippedItemIds = [...event.itemIds];
			break;
		case 'item-condition-set': {
			const current = createDefaultItemState(next.itemStates[event.itemId]);
			next.itemStates[event.itemId] = {
				...current,
				condition: Math.min(current.maxCondition, event.condition),
				repairCount: event.condition > current.condition ? current.repairCount + 1 : current.repairCount,
			};
			if (event.condition <= 0) {
				next.equippedItemIds = next.equippedItemIds.filter((itemId) => itemId !== event.itemId);
			}
			break;
		}
		case 'item-modification-set': {
			const current = createDefaultItemState(next.itemStates[event.itemId]);
			next.itemStates[event.itemId] = { ...current, modificationId: event.modificationId };
			break;
		}
		case 'expedition-vitals-set':
			next.expedition = {
				...next.expedition,
				integrity: event.integrity,
				maxIntegrity: event.maxIntegrity,
				injuries: event.injuries,
			};
			break;
		case 'expedition-committed':
			next.inventory = event.commit.inventory.map((stack) => ({ ...stack }));
			next.equippedItemIds = [...event.commit.equippedItemIds];
			next.itemStates = normalizeOwnedItemStates(event.commit.inventory, event.commit.itemStates);
			next.expedition = {
				...next.expedition,
				integrity: event.commit.integrity,
				maxIntegrity: event.commit.maxIntegrity,
				injuries: event.commit.injuries,
				completedRuns: next.expedition.completedRuns + 1,
				lastStageId: event.commit.stageId,
				settledRunIds: appendUnique(next.expedition.settledRunIds, event.commit.runId),
			};
			for (const location of Object.values(next.locationStates)) {
				location.serviceStrain = Object.fromEntries(
					Object.entries(location.serviceStrain).map(([serviceId, strain]) => [
						serviceId,
						Math.max(0, strain - 1),
					])
				);
			}
			break;
		case 'economy-entry-recorded': {
			const entry = event.entry;
			next.economy.journal = [...next.economy.journal, { ...entry }].slice(-ECONOMY_JOURNAL_LIMIT);
			if (['purchase', 'repair', 'modification', 'clinic', 'greenhouse'].includes(entry.kind)) {
				next.economy.spentCredchips += entry.amount;
			}
			if (['repair', 'modification', 'clinic', 'greenhouse'].includes(entry.kind)) {
				next.economy.serviceSpend += entry.amount;
			}
			if (entry.kind === 'purchase') next.economy.purchaseCount += 1;
			if (entry.kind === 'repair' || entry.kind === 'modification') next.economy.repairCount += 1;
			if (entry.kind === 'clinic') next.economy.clinicVisits += 1;
			if (entry.kind === 'salvage') next.economy.earnedCredchips += entry.amount;
			if (entry.kind === 'reward') next.economy.rewardItemCount += 1;
			break;
		}
		case 'resolution-reward-claimed': {
			next.advancement.experience += event.experience;
			next.advancement.level = levelForExperience(next.advancement.experience);
			next.advancement.claimedRewardIds = appendUnique(
				next.advancement.claimedRewardIds,
				event.rewardId
			);
			for (const approach of event.approaches) {
				next.advancement.mastery[approach] += 1;
			}
			break;
		}
		case 'world-flag-set':
			next.worldFlags = appendUnique(next.worldFlags, event.flag);
			break;
	}
	return next;
}

export class WorldDirector {
	private state: AdventureSaveV2;

	constructor(
		private readonly graph: TravelGraph = ADVENTURE_TRAVEL_GRAPH,
		initialState: AdventureSaveV2 = createDefaultAdventureSave()
	) {
		this.state = repairAdventureState(graph, initialState);
	}

	getState(): AdventureSaveV2 {
		return structuredClone(this.state) as AdventureSaveV2;
	}

	getGraph(): TravelGraph {
		return structuredClone(this.graph) as TravelGraph;
	}

	execute(command: WorldCommand): WorldCommandResult {
		const decision = decideWorldCommand(this.graph, this.state, command);
		if (typeof decision === 'string') {
			return { ok: false, reason: decision, state: this.getState() };
		}
		for (const event of decision) this.state = evolveWorldState(this.state, event);
		return { ok: true, events: decision.map((event) => ({ ...event })), state: this.getState() };
	}

	executeTransaction(commands: readonly WorldCommand[]): WorldTransactionResult {
		let candidate = this.state;
		const events: WorldEvent[] = [];
		for (const [index, command] of commands.entries()) {
			const decision = decideWorldCommand(this.graph, candidate, command);
			if (typeof decision === 'string') {
				return {
					ok: false,
					reason: decision,
					failedCommandIndex: index,
					state: this.getState(),
				};
			}
			for (const event of decision) {
				candidate = evolveWorldState(candidate, event);
				events.push(event);
			}
		}
		this.state = candidate;
		return { ok: true, events: events.map((event) => ({ ...event })), state: this.getState() };
	}

	getReachableLocationIds(): string[] {
		return getRoutesForLocation(this.graph, this.state.currentLocationId)
			.filter((route) => this.state.unlockedRouteIds.includes(route.id))
			.map((route) => getOtherRouteEndpoint(route, this.state.currentLocationId))
			.filter((id): id is string => Boolean(id && this.state.discoveredLocationIds.includes(id)));
	}

	debugTravelTo(locationId: string, spawnId?: string): WorldCommandResult {
		return this.execute({ type: 'debug-travel', destinationId: locationId, spawnId });
	}
}

function sanitizeExpeditionCommit(value: ExpeditionCommit): ExpeditionCommit | null {
	if (!value || !validIdentity(value.runId) || !validIdentity(value.stageId)) return null;
	if (
		!Number.isInteger(value.maxIntegrity) ||
		value.maxIntegrity <= 0 ||
		!Number.isInteger(value.integrity) ||
		value.integrity < 1 ||
		value.integrity > value.maxIntegrity ||
		!Number.isInteger(value.injuries) ||
		value.injuries < 0 ||
		!Number.isInteger(value.bankedSalvage) ||
		value.bankedSalvage < 0 ||
		!Array.isArray(value.inventory) ||
		!Array.isArray(value.equippedItemIds)
	) {
		return null;
	}
	const quantities = new Map<string, number>();
	for (const stack of value.inventory) {
		if (!validIdentity(stack.itemId) || !Number.isInteger(stack.quantity) || stack.quantity <= 0) {
			return null;
		}
		quantities.set(stack.itemId, (quantities.get(stack.itemId) ?? 0) + stack.quantity);
	}
	const inventory = [...quantities.entries()]
		.map(([itemId, quantity]) => ({ itemId, quantity }))
		.sort((a, b) => a.itemId.localeCompare(b.itemId));
	const owned = new Set(inventory.map((stack) => stack.itemId));
	const equippedItemIds = [...new Set(value.equippedItemIds)];
	if (equippedItemIds.some((itemId) => !owned.has(itemId))) return null;
	const itemStates: Record<string, AdventureItemState> = {};
	for (const stack of inventory) {
		itemStates[stack.itemId] = createDefaultItemState(value.itemStates?.[stack.itemId]);
	}
	return {
		runId: value.runId,
		stageId: value.stageId,
		inventory,
		equippedItemIds,
		itemStates,
		integrity: value.integrity,
		maxIntegrity: value.maxIntegrity,
		injuries: value.injuries,
		bankedSalvage: value.bankedSalvage,
	};
}

function repairAdventureState(graph: TravelGraph, state: AdventureSaveV2): AdventureSaveV2 {
	const fallback = createDefaultAdventureSave();
	const normalized = createDefaultAdventureSave(state);
	const current = getLocationDef(graph, normalized.currentLocationId)
		? normalized.currentLocationId
		: fallback.currentLocationId;
	const spawn =
		resolveLocationSpawn(graph, current, normalized.currentSpawnId) ?? fallback.currentSpawnId;
	const respawnLocation = getLocationDef(graph, normalized.respawnAnchor.locationId)
		? normalized.respawnAnchor.locationId
		: current;
	const respawnSpawn =
		resolveLocationSpawn(graph, respawnLocation, normalized.respawnAnchor.spawnId) ?? spawn;
	return {
		...normalized,
		worldRevision: graph.revision,
		currentLocationId: current,
		currentSpawnId: spawn,
		respawnAnchor: { locationId: respawnLocation, spawnId: respawnSpawn },
		discoveredLocationIds: [...new Set([...normalized.discoveredLocationIds, current])].filter((id) =>
			Boolean(getLocationDef(graph, id))
		),
		visitedLocationIds: [...new Set([...normalized.visitedLocationIds, current])].filter((id) =>
			Boolean(getLocationDef(graph, id))
		),
		unlockedRouteIds: [...new Set(normalized.unlockedRouteIds)].filter((id) =>
			graph.routes.some((route) => route.id === id)
		),
	};
}

function appendUnique(values: readonly string[], value: string): string[] {
	return values.includes(value) ? [...values] : [...values, value];
}

function validIdentity(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0 && /^[a-z0-9][a-z0-9:_-]*$/i.test(value);
}

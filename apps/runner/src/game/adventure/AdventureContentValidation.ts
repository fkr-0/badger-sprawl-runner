import { NPC_CATALOG, NPC_CONVERSATIONS } from './NpcCatalog';
import {
	INFRASTRUCTURE_LINKS,
	INFRASTRUCTURE_NODES,
	validateInfrastructureNetwork,
} from './InfrastructureNetwork';
import { PLACE_LEDGER, validatePlaceLedger } from './PlaceLedger';
import { QUEST_CATALOG, validateQuestCatalog } from './QuestCatalog';
import { SOCIAL_SPACE_CATALOG, validateSocialSpaceCatalog } from './SocialSpaceCatalog';
import { NPC_SCHEDULE_RULES, validateWorldSchedule } from './WorldSchedule';
import { ADVENTURE_TRAVEL_GRAPH, validateWorldGraph } from './WorldGraph';
import { validateEncounterTopology } from '../../world/EncounterTopology';
import { getStageEncounterTopology } from '../../world/EncounterTopologyCatalog';
import { RUNTIME_STAGE_IDS } from '../../world/stageLayoutRegistry';

export interface AdventureContentValidationReport {
	valid: boolean;
	errors: string[];
	summary: {
		districts: number;
		locations: number;
		routes: number;
		places: number;
		socialLayouts: number;
		infrastructureNodes: number;
		infrastructureLinks: number;
		scheduleRules: number;
		npcs: number;
		conversations: number;
		quests: number;
		encounterTopologies: number;
		encounterZones: number;
		encounterPortals: number;
		encounterTraps: number;
		encounterApproachPlans: number;
	};
}

/**
 * Cross-catalog foreign-key validation for narrative production.
 *
 * Individual catalogs validate their local shape; this validator checks the
 * references between world, place, NPC, conversation, quest, and consequence
 * data so content growth remains safe without central hard-coded registries.
 */
export function validateAdventureContent(): AdventureContentValidationReport {
	const errors = [
		...validateWorldGraph(ADVENTURE_TRAVEL_GRAPH).errors,
		...validatePlaceLedger(),
		...validateQuestCatalog(),
		...validateSocialSpaceCatalog(),
		...validateInfrastructureNetwork(),
		...validateWorldSchedule(),
	];
	const encounterTopologies = RUNTIME_STAGE_IDS.map((stageId) =>
		getStageEncounterTopology(stageId)
	);
	for (const topology of encounterTopologies) {
		for (const issue of validateEncounterTopology(topology)) {
			errors.push(`${topology.stageId}:${issue.refId}: ${issue.message}`);
		}
	}
	const locationIds = new Set(ADVENTURE_TRAVEL_GRAPH.locations.map((location) => location.id));
	const districtIds = new Set(ADVENTURE_TRAVEL_GRAPH.districts.map((district) => district.id));
	const npcIds = new Set<string>();
	const questIds = new Set(QUEST_CATALOG.map((quest) => quest.id));
	const placeIds = new Set(PLACE_LEDGER.map((place) => place.locationId));
	for (const node of INFRASTRUCTURE_NODES) {
		if (!districtIds.has(node.districtId)) {
			errors.push(`${node.id}: infrastructure node has unknown district ${node.districtId}`);
		}
	}
	for (const rule of NPC_SCHEDULE_RULES) {
		if (!locationIds.has(rule.locationId)) {
			errors.push(`${rule.npcId}: schedule has unknown location ${rule.locationId}`);
		}
	}

	for (const npc of NPC_CATALOG) {
		if (npcIds.has(npc.id)) errors.push(`duplicate npc: ${npc.id}`);
		npcIds.add(npc.id);
		if (!locationIds.has(npc.homeLocationId)) {
			errors.push(`${npc.id}: unknown home location ${npc.homeLocationId}`);
		}
	}
	for (const rule of NPC_SCHEDULE_RULES) {
		if (!npcIds.has(rule.npcId)) errors.push(`schedule has unknown npc ${rule.npcId}`);
	}

	const layoutIds = new Set(SOCIAL_SPACE_CATALOG.map((layout) => layout.locationId));
	for (const place of PLACE_LEDGER) {
		if (!layoutIds.has(place.locationId)) {
			errors.push(`${place.locationId}: missing walkable social-space layout`);
		}
	}
	for (const layout of SOCIAL_SPACE_CATALOG) {
		const place = PLACE_LEDGER.find((candidate) => candidate.locationId === layout.locationId);
		if (!place) {
			errors.push(`${layout.locationId}: social layout has no place-ledger entry`);
			continue;
		}
		const residentIds = new Set(place.variants.flatMap((variant) => variant.npcIds));
		const scheduledIds = new Set(
			NPC_SCHEDULE_RULES.filter((rule) => rule.locationId === layout.locationId).map(
				(rule) => rule.npcId
			)
		);
		const serviceIds = new Set<string>(place.services.map((service) => service.id));
		for (const anchor of layout.anchors) {
			if (anchor.kind === 'npc' && !residentIds.has(anchor.id) && !scheduledIds.has(anchor.id)) {
				errors.push(`${layout.locationId}: spatial anchor has unknown resident ${anchor.id}`);
			}
			if (anchor.kind === 'service' && !serviceIds.has(anchor.id)) {
				errors.push(`${layout.locationId}: spatial anchor has unknown service ${anchor.id}`);
			}
		}
	}

	const conversationIds = new Set<string>();
	for (const conversation of NPC_CONVERSATIONS) {
		if (conversationIds.has(conversation.id)) {
			errors.push(`duplicate conversation: ${conversation.id}`);
		}
		conversationIds.add(conversation.id);
		if (!npcIds.has(conversation.npcId)) {
			errors.push(`${conversation.id}: unknown npc ${conversation.npcId}`);
		}
		if (!locationIds.has(conversation.locationId)) {
			errors.push(`${conversation.id}: unknown location ${conversation.locationId}`);
		}
		if (conversation.startsQuestId && !questIds.has(conversation.startsQuestId)) {
			errors.push(`${conversation.id}: unknown quest ${conversation.startsQuestId}`);
		}
	}

	for (const place of PLACE_LEDGER) {
		if (!locationIds.has(place.locationId)) {
			errors.push(`${place.locationId}: place is not in world graph`);
		}
		if (!districtIds.has(place.districtId)) {
			errors.push(`${place.locationId}: unknown district ${place.districtId}`);
		}
		for (const service of place.services) {
			if (service.providerNpcId && !npcIds.has(service.providerNpcId)) {
				errors.push(`${place.locationId}: service ${service.id} has unknown provider ${service.providerNpcId}`);
			}
		}
		for (const variant of place.variants) {
			for (const npcId of variant.npcIds) {
				if (!npcIds.has(npcId)) errors.push(`${place.locationId}: unknown resident ${npcId}`);
			}
		}
	}

	for (const quest of QUEST_CATALOG) {
		if (!districtIds.has(quest.districtId)) {
			errors.push(`${quest.id}: unknown district ${quest.districtId}`);
		}
		if (quest.giverNpcId && !npcIds.has(quest.giverNpcId)) {
			errors.push(`${quest.id}: unknown giver ${quest.giverNpcId}`);
		}
		for (const step of quest.steps) {
			for (const objective of step.objectives) {
				if (objective.locationId && !locationIds.has(objective.locationId)) {
					errors.push(`${quest.id}:${step.id}: unknown objective location ${objective.locationId}`);
				}
			}
		}
		for (const consequence of quest.consequences) {
			for (const service of consequence.serviceUpgrades ?? []) {
				if (!locationIds.has(service.locationId)) {
					errors.push(`${quest.id}:${consequence.id}: unknown service location ${service.locationId}`);
				}
			}
			for (const relocation of consequence.npcRelocations ?? []) {
				if (!npcIds.has(relocation.npcId)) {
					errors.push(`${quest.id}:${consequence.id}: unknown relocation npc ${relocation.npcId}`);
				}
				if (!locationIds.has(relocation.locationId)) {
					errors.push(
						`${quest.id}:${consequence.id}: unknown relocation location ${relocation.locationId}`
					);
				}
			}
		}
	}

	for (const placeId of placeIds) {
		const kind = ADVENTURE_TRAVEL_GRAPH.locations.find((location) => location.id === placeId)?.kind;
		if (kind === 'route' || kind === 'stronghold') {
			errors.push(`${placeId}: combat location should not use the off-combat place ledger`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		summary: {
			districts: ADVENTURE_TRAVEL_GRAPH.districts.length,
			locations: ADVENTURE_TRAVEL_GRAPH.locations.length,
			routes: ADVENTURE_TRAVEL_GRAPH.routes.length,
			places: PLACE_LEDGER.length,
			socialLayouts: SOCIAL_SPACE_CATALOG.length,
			infrastructureNodes: INFRASTRUCTURE_NODES.length,
			infrastructureLinks: INFRASTRUCTURE_LINKS.length,
			scheduleRules: NPC_SCHEDULE_RULES.length,
			npcs: NPC_CATALOG.length,
			conversations: NPC_CONVERSATIONS.length,
			quests: QUEST_CATALOG.length,
			encounterTopologies: encounterTopologies.length,
			encounterZones: encounterTopologies.reduce(
				(total, topology) => total + topology.zones.length,
				0
			),
			encounterPortals: encounterTopologies.reduce(
				(total, topology) => total + topology.portals.length,
				0
			),
			encounterTraps: encounterTopologies.reduce(
				(total, topology) => total + (topology.traps?.length ?? 0),
				0
			),
			encounterApproachPlans: encounterTopologies.reduce(
				(total, topology) => total + topology.approachPlans.length,
				0
			),
		},
	};
}


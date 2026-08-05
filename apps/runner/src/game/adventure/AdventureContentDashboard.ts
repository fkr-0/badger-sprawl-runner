import { STAGE_PLATFORM_ART } from '../StageArtRegistry';
import { RUNTIME_STAGE_IDS } from '../../world/stageLayoutRegistry';
import {
	PROCEDURAL_ELITES,
	PROCEDURAL_VENDORS,
	UNDERCITY_CONTRACTS,
	UNDERCITY_ENTRANCES,
} from '../../procgen/UndercityExpedition';
import { validateAdventureContent } from './AdventureContentValidation';
import { NPC_CATALOG } from './NpcCatalog';
import { PLACE_LEDGER } from './PlaceLedger';
import { QUEST_CATALOG } from './QuestCatalog';
import { NPC_SCHEDULE_RULES } from './WorldSchedule';
import { ADVENTURE_TRAVEL_GRAPH } from './WorldGraph';

export interface DashboardQuestRow {
	id: string;
	districtId: string;
	kind: string;
	approachCount: number;
	stepCount: number;
	consequenceCount: number;
	algorithmicMotifs: string[];
}

export interface DashboardDistrictRow {
	id: string;
	locationCount: number;
	placeCount: number;
	questCount: number;
	npcHomeCount: number;
	scheduleRuleCount: number;
	serviceIds: string[];
	stageArtReady: boolean;
}

export interface AdventureContentDashboard {
	generatedAtRevision: number;
	valid: boolean;
	errors: string[];
	summary: ReturnType<typeof validateAdventureContent>['summary'] & {
		undercityEntrances: number;
		undercityContracts: number;
		proceduralVendors: number;
		proceduralElites: number;
		algorithmicQuestCount: number;
	};
	districts: DashboardDistrictRow[];
	quests: DashboardQuestRow[];
	algorithmicQuestIds: string[];
	missingStageArtIds: string[];
	orphanUndercityEntranceIds: string[];
}

const MOTIF_PATTERNS: Array<[string, RegExp]> = [
	['bin-packing', /bin[- ]packing|remainder|manifest objective/i],
	['graph-coloring', /graph color|coloring|conflict-color/i],
	['proof-by-contradiction', /contradiction|assume the model/i],
	['incompleteness', /incomplete|undecidable|gödel|godel/i],
];

export function buildAdventureContentDashboard(): AdventureContentDashboard {
	const validation = validateAdventureContent();
	const questRows = QUEST_CATALOG.map(toQuestRow).sort((left, right) =>
		left.id.localeCompare(right.id)
	);
	const algorithmicQuestIds = questRows
		.filter((quest) => quest.algorithmicMotifs.length > 0)
		.map((quest) => quest.id);
	const stageArtIds = new Set(Object.keys(STAGE_PLATFORM_ART));
	const missingStageArtIds = RUNTIME_STAGE_IDS.filter((stageId) => !stageArtIds.has(stageId));
	const locationIds = new Set(ADVENTURE_TRAVEL_GRAPH.locations.map((location) => location.id));
	const orphanUndercityEntranceIds = UNDERCITY_ENTRANCES.filter(
		(entrance) => !locationIds.has(entrance.locationId)
	).map((entrance) => entrance.id);
	const districts = ADVENTURE_TRAVEL_GRAPH.districts
		.map((district) => {
			const places = PLACE_LEDGER.filter((place) => place.districtId === district.id);
			return {
				id: district.id,
				locationCount: ADVENTURE_TRAVEL_GRAPH.locations.filter(
					(location) => location.districtId === district.id
				).length,
				placeCount: places.length,
				questCount: QUEST_CATALOG.filter((quest) => quest.districtId === district.id).length,
				npcHomeCount: NPC_CATALOG.filter((npc) => npc.homeLocationId.startsWith(`${district.id}:`))
					.length,
				scheduleRuleCount: NPC_SCHEDULE_RULES.filter((rule) =>
					rule.locationId.startsWith(`${district.id}:`)
				).length,
				serviceIds: [
					...new Set(places.flatMap((place) => place.services.map((service) => service.id))),
				].sort(),
				stageArtReady: stageArtIds.has(district.stageId),
			};
		})
		.sort((left, right) => left.id.localeCompare(right.id));
	const errors = [
		...validation.errors,
		...missingStageArtIds.map((stageId) => `${stageId}: missing stage platform art`),
		...orphanUndercityEntranceIds.map(
			(entranceId) => `${entranceId}: undercity entrance has no persistent location`
		),
	];
	return {
		generatedAtRevision: ADVENTURE_TRAVEL_GRAPH.revision,
		valid: errors.length === 0,
		errors,
		summary: {
			...validation.summary,
			undercityEntrances: UNDERCITY_ENTRANCES.length,
			undercityContracts: UNDERCITY_CONTRACTS.length,
			proceduralVendors: PROCEDURAL_VENDORS.length,
			proceduralElites: PROCEDURAL_ELITES.length,
			algorithmicQuestCount: algorithmicQuestIds.length,
		},
		districts,
		quests: questRows,
		algorithmicQuestIds,
		missingStageArtIds,
		orphanUndercityEntranceIds,
	};
}

function toQuestRow(quest: (typeof QUEST_CATALOG)[number]): DashboardQuestRow {
	const searchable = [
		quest.id,
		quest.title,
		quest.description,
		quest.theme,
		...quest.steps.flatMap((step) => [
			step.placard,
			step.summary,
			...step.objectives.flatMap((objective) => [objective.id, objective.label]),
		]),
	].join(' ');
	return {
		id: quest.id,
		districtId: quest.districtId,
		kind: quest.kind,
		approachCount: Object.keys(quest.approaches).length,
		stepCount: quest.steps.length,
		consequenceCount: quest.consequences.length,
		algorithmicMotifs: MOTIF_PATTERNS.filter(([, pattern]) => pattern.test(searchable)).map(
			([motif]) => motif
		),
	};
}

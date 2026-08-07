import type { ResolutionApproach } from '../ResolutionApproach';
import {
	createDefaultEconomyState,
	createDefaultExpeditionState,
	sanitizeEconomyState,
	sanitizeExpeditionState,
	sanitizeItemStates,
	type AdventureEconomyState,
	type AdventureExpeditionState,
	type AdventureItemState,
} from './ExpeditionLedger';

export const ADVENTURE_SAVE_SCHEMA_VERSION = 2 as const;
export const ADVENTURE_WORLD_REVISION = 2 as const;

export const DEFAULT_ADVENTURE_LOCATION_ID = 'lower-sprawl:safehouse';
export const DEFAULT_ADVENTURE_SPAWN_ID = 'arrival';

export type DistrictStoryPhase =
	| 'unvisited'
	| 'rumored'
	| 'contested'
	| 'liberated'
	| 'transformed';

export type QuestStatus = 'hidden' | 'available' | 'active' | 'completed' | 'failed';

export interface AdventureQuestState {
	status: QuestStatus;
	stepId?: string;
	objectiveProgress?: Record<string, number>;
}

export function levelForExperience(experience: number): number {
	const safeExperience = Math.max(0, Math.floor(experience));
	let level = 1;
	while (safeExperience >= totalExperienceForLevel(level + 1)) level += 1;
	return level;
}

export function totalExperienceForLevel(level: number): number {
	const safeLevel = Math.max(1, Math.floor(level));
	return (100 * (safeLevel - 1) * safeLevel) / 2;
}

function sanitizeAdvancement(value: unknown): AdventureAdvancementState {
	const record = isRecord(value) ? value : {};
	const experience = finiteInteger(record.experience, 0);
	const masteryRecord = isRecord(record.mastery) ? record.mastery : {};
	return {
		experience,
		level: levelForExperience(experience),
		mastery: {
			claw: finiteInteger(masteryRecord.claw, 0),
			ballistics: finiteInteger(masteryRecord.ballistics, 0),
			ghoststep: finiteInteger(masteryRecord.ghoststep, 0),
			hacking: finiteInteger(masteryRecord.hacking, 0),
			social: finiteInteger(masteryRecord.social, 0),
			repair: finiteInteger(masteryRecord.repair, 0),
			exploration: finiteInteger(masteryRecord.exploration, 0),
		},
		claimedRewardIds: stringArray(record.claimedRewardIds),
	};
}

export interface AdventureAdvancementState {
	experience: number;
	level: number;
	mastery: Record<ResolutionApproach, number>;
	claimedRewardIds: string[];
}

function finiteSignedInteger(
	value: unknown,
	fallback: number,
	minimum: number,
	maximum: number
): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.min(maximum, Math.max(minimum, Math.trunc(value)))
		: fallback;
}

function sanitizeNpcStates(value: unknown): Record<string, AdventureNpcState> {
	if (!isRecord(value)) return {};
	const result: Record<string, AdventureNpcState> = {};
	for (const [npcId, candidate] of Object.entries(value)) {
		if (!isRecord(candidate)) continue;
		result[npcId] = {
			met: candidate.met === true,
			trust: finiteSignedInteger(candidate.trust, 0, -100, 100),
			conversationIds: stringArray(candidate.conversationIds),
			flags: stringArray(candidate.flags),
			currentLocationId:
				typeof candidate.currentLocationId === 'string' && candidate.currentLocationId.length > 0
					? candidate.currentLocationId
					: undefined,
		};
	}
	return result;
}

function sanitizeLocationStates(value: unknown): Record<string, AdventureLocationState> {
	if (!isRecord(value)) return {};
	const result: Record<string, AdventureLocationState> = {};
	for (const [locationId, candidate] of Object.entries(value)) {
		if (!isRecord(candidate)) continue;
		const serviceLevels = isRecord(candidate.serviceLevels)
			? Object.fromEntries(
					Object.entries(candidate.serviceLevels)
						.filter((entry): entry is [string, number] =>
							typeof entry[1] === 'number' && Number.isFinite(entry[1])
						)
						.map(([serviceId, level]) => [serviceId, Math.max(0, Math.floor(level))])
				)
			: {};
		const serviceStrain = isRecord(candidate.serviceStrain)
			? Object.fromEntries(
					Object.entries(candidate.serviceStrain)
						.filter((entry): entry is [string, number] =>
							typeof entry[1] === 'number' && Number.isFinite(entry[1])
						)
						.map(([serviceId, strain]) => [serviceId, Math.max(0, Math.floor(strain))])
				)
			: {};
		result[locationId] = {
			visitCount: finiteInteger(candidate.visitCount, 0),
			flags: stringArray(candidate.flags),
			serviceLevels,
			serviceStrain,
		};
	}
	return result;
}

export interface AdventureInventoryStack {
	itemId: string;
	quantity: number;
}

export interface AdventureRespawnAnchor {
	locationId: string;
	spawnId: string;
}

export interface AdventureNpcState {
	met: boolean;
	trust: number;
	conversationIds: string[];
	flags: string[];
	currentLocationId?: string;
}

export interface AdventureLocationState {
	visitCount: number;
	flags: string[];
	serviceLevels: Record<string, number>;
	serviceStrain: Record<string, number>;
}

/**
 * Persistent adventure state deliberately excludes moment-to-moment combat state.
 *
 * This is the durable projection used by the world/application layer. Expedition
 * scenes may derive temporary runtime state from it, but may not persist scene
 * object graphs directly.
 */
export interface AdventureSaveV2 {
	schemaVersion: typeof ADVENTURE_SAVE_SCHEMA_VERSION;
	worldRevision: number;
	currentLocationId: string;
	currentSpawnId: string;
	respawnAnchor: AdventureRespawnAnchor;
	discoveredLocationIds: string[];
	visitedLocationIds: string[];
	unlockedRouteIds: string[];
	questStates: Record<string, AdventureQuestState>;
	npcStates: Record<string, AdventureNpcState>;
	locationStates: Record<string, AdventureLocationState>;
	advancement: AdventureAdvancementState;
	inventory: AdventureInventoryStack[];
	equippedItemIds: string[];
	itemStates: Record<string, AdventureItemState>;
	expedition: AdventureExpeditionState;
	economy: AdventureEconomyState;
	districtPhases: Record<string, DistrictStoryPhase>;
	worldFlags: string[];
	transitionSequence: number;
}

const DISTRICT_PHASES = new Set<DistrictStoryPhase>([
	'unvisited',
	'rumored',
	'contested',
	'liberated',
	'transformed',
]);
const QUEST_STATUSES = new Set<QuestStatus>([
	'hidden',
	'available',
	'active',
	'completed',
	'failed',
]);

export function createDefaultAdventureSave(
	overrides: Partial<AdventureSaveV2> = {}
): AdventureSaveV2 {
	const currentLocationId = nonEmptyString(
		overrides.currentLocationId,
		DEFAULT_ADVENTURE_LOCATION_ID
	);
	const currentSpawnId = nonEmptyString(overrides.currentSpawnId, DEFAULT_ADVENTURE_SPAWN_ID);
	return {
		schemaVersion: ADVENTURE_SAVE_SCHEMA_VERSION,
		worldRevision: finiteInteger(overrides.worldRevision, ADVENTURE_WORLD_REVISION),
		currentLocationId,
		currentSpawnId,
		respawnAnchor: {
			locationId: nonEmptyString(overrides.respawnAnchor?.locationId, currentLocationId),
			spawnId: nonEmptyString(overrides.respawnAnchor?.spawnId, currentSpawnId),
		},
		discoveredLocationIds: uniqueStrings(
			overrides.discoveredLocationIds ?? [
				DEFAULT_ADVENTURE_LOCATION_ID,
				'lower-sprawl:settlement',
				'lower-sprawl:route',
				'lower-sprawl:station',
			]
		),
		visitedLocationIds: uniqueStrings(
			overrides.visitedLocationIds ?? [DEFAULT_ADVENTURE_LOCATION_ID]
		),
		unlockedRouteIds: uniqueStrings(
			overrides.unlockedRouteIds ?? [
				'lower-sprawl:safehouse-settlement',
				'lower-sprawl:settlement-route',
				'lower-sprawl:settlement-station',
			]
		),
		questStates: sanitizeQuestStates(
			overrides.questStates ?? {
				'main:the-city-moves': { status: 'active', stepId: 'wake-the-low-line' },
			}
		),
		npcStates: sanitizeNpcStates(overrides.npcStates),
		locationStates: sanitizeLocationStates(overrides.locationStates),
		advancement: sanitizeAdvancement(overrides.advancement),
		inventory: sanitizeInventory(overrides.inventory),
		equippedItemIds: uniqueStrings(overrides.equippedItemIds ?? []),
		itemStates: sanitizeItemStates(overrides.itemStates),
		expedition: sanitizeExpeditionState(overrides.expedition ?? createDefaultExpeditionState()),
		economy: sanitizeEconomyState(overrides.economy ?? createDefaultEconomyState()),
		districtPhases: sanitizeDistrictPhases(
			overrides.districtPhases ?? { 'lower-sprawl': 'contested' }
		),
		worldFlags: uniqueStrings(overrides.worldFlags ?? []),
		transitionSequence: finiteInteger(overrides.transitionSequence, 0),
	};
}

export function sanitizeAdventureSave(value: unknown): AdventureSaveV2 {
	if (!isRecord(value)) return createDefaultAdventureSave();
	return createDefaultAdventureSave({
		worldRevision: value.worldRevision as number,
		currentLocationId: value.currentLocationId as string,
		currentSpawnId: value.currentSpawnId as string,
		respawnAnchor: isRecord(value.respawnAnchor)
			? {
					locationId: value.respawnAnchor.locationId as string,
					spawnId: value.respawnAnchor.spawnId as string,
				}
			: undefined,
		discoveredLocationIds: stringArray(value.discoveredLocationIds),
		visitedLocationIds: stringArray(value.visitedLocationIds),
		unlockedRouteIds: stringArray(value.unlockedRouteIds),
		questStates: sanitizeQuestStates(value.questStates),
		npcStates: sanitizeNpcStates(value.npcStates),
		locationStates: sanitizeLocationStates(value.locationStates),
		advancement: sanitizeAdvancement(value.advancement),
		inventory: sanitizeInventory(value.inventory),
		equippedItemIds: stringArray(value.equippedItemIds),
		itemStates: sanitizeItemStates(value.itemStates),
		expedition: sanitizeExpeditionState(value.expedition),
		economy: sanitizeEconomyState(value.economy),
		districtPhases: sanitizeDistrictPhases(value.districtPhases),
		worldFlags: stringArray(value.worldFlags),
		transitionSequence: value.transitionSequence as number,
	});
}

function sanitizeQuestStates(value: unknown): Record<string, AdventureQuestState> {
	if (!isRecord(value)) return {};
	const entries: Array<[string, AdventureQuestState]> = [];
	for (const [questId, candidate] of Object.entries(value)) {
		if (!isRecord(candidate) || typeof candidate.status !== 'string') continue;
		if (!QUEST_STATUSES.has(candidate.status as QuestStatus)) continue;
		const objectiveProgress = isRecord(candidate.objectiveProgress)
			? Object.fromEntries(
					Object.entries(candidate.objectiveProgress)
						.filter((entry): entry is [string, number] =>
							typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0
						)
						.map(([id, progress]) => [id, progress])
				)
			: undefined;
		entries.push([
			questId,
			{
				status: candidate.status as QuestStatus,
				stepId: typeof candidate.stepId === 'string' ? candidate.stepId : undefined,
				objectiveProgress,
			},
		]);
	}
	return Object.fromEntries(entries);
}

function sanitizeInventory(value: unknown): AdventureInventoryStack[] {
	if (!Array.isArray(value)) return [];
	const quantities = new Map<string, number>();
	for (const candidate of value) {
		if (!isRecord(candidate) || typeof candidate.itemId !== 'string') continue;
		const quantity = finiteInteger(candidate.quantity, 0);
		if (quantity <= 0) continue;
		quantities.set(candidate.itemId, (quantities.get(candidate.itemId) ?? 0) + quantity);
	}
	return [...quantities.entries()]
		.map(([itemId, quantity]) => ({ itemId, quantity }))
		.sort((a, b) => a.itemId.localeCompare(b.itemId));
}

function sanitizeDistrictPhases(value: unknown): Record<string, DistrictStoryPhase> {
	if (!isRecord(value)) return {};
	return Object.fromEntries(
		Object.entries(value).filter(
			(entry): entry is [string, DistrictStoryPhase] =>
				typeof entry[1] === 'string' && DISTRICT_PHASES.has(entry[1] as DistrictStoryPhase)
		)
	);
}

function uniqueStrings(values: readonly unknown[]): string[] {
	return [...new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0))];
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value) ? uniqueStrings(value) : [];
}

function finiteInteger(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.max(0, Math.floor(value))
		: fallback;
}

function nonEmptyString(value: unknown, fallback: string): string {
	return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

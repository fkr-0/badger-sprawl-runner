import {
	createMemoryStorageAdapter,
	createStorageAdapter,
	createVersionedStore,
} from '@arcade/runtime/storage';
import {
	type GameFlow,
	type MetaState,
	type StoryProgress,
	createGameFlow,
} from '../game/GameFlow';
import {
	STORY_PROGRESS_SCHEMA_VERSION,
	migrateStoryProgress,
} from '../game/StoryProgressMigration';
import { createAdventureSaveFromStoryProgress } from '../game/adventure/AdventureProgression';
import { type AdventureSaveV2, sanitizeAdventureSave } from '../game/adventure/AdventureState';
import {
	type ActiveUndercityExpeditionSaveV2,
	sanitizeActiveUndercityExpeditionSave,
} from '../procgen/UndercityExpedition';
import { sanitizeBuildTelemetryHistory } from '../systems/BuildComparisonTelemetrySystem';

export const SAVE_KEY = 'badger-sprawl-runner.save.v2';
export const LEGACY_SAVE_KEY = 'badger-sprawl-runner.save.v1';
export const ACTIVE_EXPEDITION_SAVE_KEY = 'badger-sprawl-runner.active-undercity.v2';
export const LEGACY_ACTIVE_EXPEDITION_SAVE_KEY = 'badger-sprawl-runner.active-undercity.v1';

const SAVE_SCHEMA_VERSION = 2;

export interface SaveDriver {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem?(key: string): unknown;
	keys?(): string[];
}

export function saveActiveUndercityExpedition(
	driver: SaveDriver,
	save: ActiveUndercityExpeditionSaveV2
): void {
	const sanitized = sanitizeActiveUndercityExpeditionSave(save);
	if (!sanitized) throw new Error('cannot persist invalid active undercity expedition');
	driver.setItem(ACTIVE_EXPEDITION_SAVE_KEY, JSON.stringify(sanitized));
}

export function loadActiveUndercityExpedition(
	driver: SaveDriver
): ActiveUndercityExpeditionSaveV2 | null {
	const raw =
		driver.getItem(ACTIVE_EXPEDITION_SAVE_KEY) ?? driver.getItem(LEGACY_ACTIVE_EXPEDITION_SAVE_KEY);
	if (!raw) return null;
	try {
		return sanitizeActiveUndercityExpeditionSave(JSON.parse(raw) as unknown);
	} catch {
		return null;
	}
}

export function clearActiveUndercityExpedition(driver: SaveDriver): void {
	driver.setItem(ACTIVE_EXPEDITION_SAVE_KEY, '');
	driver.setItem(LEGACY_ACTIVE_EXPEDITION_SAVE_KEY, '');
}

interface SavePayloadV1 {
	version: 1;
	meta: Partial<MetaState>;
	storyProgress?: Partial<StoryProgress>;
}

interface SavePayloadV2 {
	version: 2;
	meta: Partial<MetaState>;
	storyProgress: Partial<StoryProgress>;
	adventure: AdventureSaveV2;
}

interface GameSaveData {
	meta: Partial<MetaState>;
	storyProgress: Partial<StoryProgress>;
	adventure: AdventureSaveV2;
}

export interface GameSaveSession {
	flow: GameFlow;
	adventure: AdventureSaveV2;
}

export function saveGameFlow(
	driver: SaveDriver,
	flow: GameFlow,
	adventure = createAdventureSaveFromStoryProgress(flow.getStoryProgress())
): void {
	createGameSaveStore(driver).save(createGameSaveData(flow, adventure));
}

export function loadGameFlow(driver: SaveDriver): GameFlow {
	return loadGameSession(driver).flow;
}

export function loadGameSession(driver: SaveDriver): GameSaveSession {
	const currentRaw = driver.getItem(SAVE_KEY);
	const current = parseSavePayload(currentRaw);

	// v1.4 and earlier stored a plain v2 payload at the current key. Promote it
	// into the runtime envelope before normal versioned-store loading.
	if (current?.version === SAVE_SCHEMA_VERSION && !isRuntimeStoreEnvelope(current)) {
		const session = loadV2(current as Partial<SavePayloadV2>);
		persistSession(driver, session);
		return session;
	}

	if (currentRaw) {
		const loaded = createGameSaveStore(driver).load();
		if (loaded.source !== 'default') return loadVersionedData(loaded.data);
	}

	const legacy = parseSavePayload(driver.getItem(LEGACY_SAVE_KEY));
	if (legacy?.version === 1) {
		const session = loadV1(legacy as Partial<SavePayloadV1>);
		persistSession(driver, session);
		return session;
	}

	return createDefaultSession();
}

function createGameSaveStore(driver: SaveDriver) {
	return createVersionedStore<GameSaveData>({
		adapter: driver,
		key: SAVE_KEY,
		version: SAVE_SCHEMA_VERSION,
		defaults: () => sessionToData(createDefaultSession()),
		validate: isGameSaveData,
	});
}

function createGameSaveData(flow: GameFlow, adventure: AdventureSaveV2): GameSaveData {
	return {
		meta: flow.getMeta(),
		storyProgress: { ...flow.getStoryProgress(), schemaVersion: STORY_PROGRESS_SCHEMA_VERSION },
		adventure: sanitizeAdventureSave(adventure),
	};
}

function sessionToData(session: GameSaveSession): GameSaveData {
	return createGameSaveData(session.flow, session.adventure);
}

function persistSession(driver: SaveDriver, session: GameSaveSession): void {
	createGameSaveStore(driver).save(sessionToData(session));
}

function isGameSaveData(value: unknown): boolean {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const data = value as Record<string, unknown>;
	return (
		Boolean(data.meta && typeof data.meta === 'object' && !Array.isArray(data.meta)) &&
		Boolean(
			data.storyProgress &&
				typeof data.storyProgress === 'object' &&
				!Array.isArray(data.storyProgress)
		) &&
		Boolean(data.adventure && typeof data.adventure === 'object' && !Array.isArray(data.adventure))
	);
}

function isRuntimeStoreEnvelope(value: Record<string, unknown>): boolean {
	return value.format === 1 && typeof value.version === 'number' && 'data' in value;
}

function parseSavePayload(raw: string | null): Record<string, unknown> | null {
	if (!raw) return null;

	try {
		const payload = JSON.parse(raw) as unknown;
		return payload && typeof payload === 'object' && !Array.isArray(payload)
			? (payload as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

function loadVersionedData(payload: GameSaveData): GameSaveSession {
	if (!payload.meta || typeof payload.meta !== 'object') return createDefaultSession();
	const storyProgress = sanitizeStoryProgress(payload.storyProgress);
	const flow = createGameFlow(sanitizeMeta(payload.meta), storyProgress);
	return {
		flow,
		adventure: payload.adventure
			? sanitizeAdventureSave(payload.adventure)
			: createAdventureSaveFromStoryProgress(flow.getStoryProgress()),
	};
}

function loadV2(payload: Partial<SavePayloadV2>): GameSaveSession {
	if (!payload.meta || typeof payload.meta !== 'object') return createDefaultSession();
	const storyProgress = sanitizeStoryProgress(payload.storyProgress);
	const flow = createGameFlow(sanitizeMeta(payload.meta), storyProgress);
	return {
		flow,
		adventure: payload.adventure
			? sanitizeAdventureSave(payload.adventure)
			: createAdventureSaveFromStoryProgress(flow.getStoryProgress()),
	};
}

function loadV1(payload: Partial<SavePayloadV1>): GameSaveSession {
	if (!payload.meta || typeof payload.meta !== 'object') return createDefaultSession();
	const flow = createGameFlow(
		sanitizeMeta(payload.meta),
		sanitizeStoryProgress(payload.storyProgress)
	);
	return { flow, adventure: createAdventureSaveFromStoryProgress(flow.getStoryProgress()) };
}

function createDefaultSession(): GameSaveSession {
	const flow = createGameFlow();
	return { flow, adventure: createAdventureSaveFromStoryProgress(flow.getStoryProgress()) };
}

export function createLocalStorageSaveDriver(storage: Storage): SaveDriver {
	return createStorageAdapter(storage);
}

export function createMemorySaveDriver(seed: Record<string, string> = {}): SaveDriver {
	return createMemoryStorageAdapter(seed);
}

function sanitizeStoryProgress(progress: unknown): Partial<StoryProgress> {
	if (!progress || typeof progress !== 'object') return {};
	return migrateStoryProgress(progress as Partial<StoryProgress>).progress;
}

function sanitizeMeta(meta: Partial<MetaState>): Partial<MetaState> {
	return {
		credchips: numberOrZero(meta.credchips),
		blueprintShards: numberOrZero(meta.blueprintShards),
		dubFavor: numberOrZero(meta.dubFavor),
		orbitHeat: numberOrZero(meta.orbitHeat),
		unlockedBoons: stringArray(meta.unlockedBoons),
		purchasedSkills: stringArray(meta.purchasedSkills),
		skillRanks: numberRecord(meta.skillRanks),
		buildTelemetryHistory: sanitizeBuildTelemetryHistory(meta.buildTelemetryHistory),
	};
}

function numberOrZero(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function numberRecord(value: unknown): Record<string, number> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return Object.fromEntries(
		Object.entries(value)
			.filter(
				(entry): entry is [string, number] =>
					typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0
			)
			.map(([key, rank]) => [key, Math.floor(rank)])
	);
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

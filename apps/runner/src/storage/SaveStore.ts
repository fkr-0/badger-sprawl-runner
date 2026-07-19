import {
	createGameFlow,
	type GameFlow,
	type MetaState,
	type StoryProgress,
} from '../game/GameFlow';
import {
	createMemoryStorageAdapter,
	createStorageAdapter,
} from '../../../../vendor/arcade-runtime.mjs';
import { STORY_PROGRESS_SCHEMA_VERSION, migrateStoryProgress } from '../game/StoryProgressMigration';

export const SAVE_KEY = 'badger-sprawl-runner.save.v1';

export interface SaveDriver {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

interface SavePayloadV1 {
	version: 1;
	meta: Partial<MetaState>;
	storyProgress?: Partial<StoryProgress>;
}

export function saveGameFlow(driver: SaveDriver, flow: GameFlow): void {
	const payload: SavePayloadV1 = {
		version: 1,
		meta: flow.getMeta(),
		storyProgress: { ...flow.getStoryProgress(), schemaVersion: STORY_PROGRESS_SCHEMA_VERSION },
	};
	driver.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadGameFlow(driver: SaveDriver): GameFlow {
	const raw = driver.getItem(SAVE_KEY);
	if (!raw) return createGameFlow();

	try {
		const payload = JSON.parse(raw) as Partial<SavePayloadV1>;
		if (payload.version !== 1 || !payload.meta || typeof payload.meta !== 'object') {
			return createGameFlow();
		}
		return createGameFlow(sanitizeMeta(payload.meta), sanitizeStoryProgress(payload.storyProgress));
	} catch {
		return createGameFlow();
	}
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
	};
}

function numberOrZero(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function numberRecord(value: unknown): Record<string, number> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return Object.fromEntries(
		Object.entries(value)
			.filter((entry): entry is [string, number] =>
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

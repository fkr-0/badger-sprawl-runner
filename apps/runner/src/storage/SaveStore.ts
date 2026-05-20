import {
	createGameFlow,
	type GameFlow,
	type MetaState,
	type StoryProgress,
} from '../game/GameFlow';
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
	return {
		getItem: (key) => storage.getItem(key),
		setItem: (key, value) => storage.setItem(key, value),
	};
}

export function createMemorySaveDriver(seed: Record<string, string> = {}): SaveDriver {
	const data = new Map(Object.entries(seed));
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => {
			data.set(key, value);
		},
	};
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
	};
}

function numberOrZero(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

/**
 * MetaProgression - persists and loads meta-state through @arcade/runtime/storage.
 */

import {
	createStorageAdapter,
	createVersionedStore,
} from '@arcade/runtime/storage';
import type { MetaState, Currency } from './types';

const STORAGE_KEY = 'bsr-meta-v1';
const SCHEMA_VERSION = 1;

export interface MetaProgressionStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem?(key: string): unknown;
	keys?(): string[];
}

export class MetaProgression {
	private readonly storage: MetaProgressionStorage | null;

	constructor(storage: MetaProgressionStorage | null = defaultStorage()) {
		this.storage = storage;
	}

	save(state: MetaState): void {
		if (!this.storage) return;
		try {
			this.store().save(normalizeMetaState(state));
		} catch (error) {
			console.warn('Failed to save meta state:', error);
		}
	}

	load(): MetaState | null {
		if (!this.storage) return null;
		try {
			const raw = this.storage.getItem(STORAGE_KEY);
			if (!raw) return null;

			const legacy = parseObject(raw);
			if (legacy && !isRuntimeStoreEnvelope(legacy)) {
				if (typeof legacy.version === 'number' && legacy.version < SCHEMA_VERSION) {
					console.warn('Save version outdated, resetting');
					return null;
				}
				const migrated = normalizeMetaState(legacy as unknown as Partial<MetaState>);
				this.store().save(migrated);
				return migrated;
			}

			const loaded = this.store().load();
			return loaded.source === 'default' ? null : normalizeMetaState(loaded.data);
		} catch (error) {
			console.warn('Failed to load meta state:', error);
			return null;
		}
	}

	reset(): void {
		if (!this.storage) return;
		this.store().clear();
	}

	// Helper methods for currency operations
	addCurrency(state: MetaState, currency: Partial<Currency>): MetaState {
		const updated = { ...state };
		if (currency.credchips) updated.credchips += currency.credchips;
		if (currency.blueprintShards) updated.blueprintShards += currency.blueprintShards;
		if (currency.dubFavor) updated.dubFavor += currency.dubFavor;
		if (currency.orbitHeat) updated.orbitHeat = Math.max(0, updated.orbitHeat + currency.orbitHeat);
		return updated;
	}

	spendCurrency(state: MetaState, currency: Partial<Currency>): MetaState | null {
		// Check affordability
		if (currency.credchips && state.credchips < currency.credchips) return null;
		if (currency.blueprintShards && state.blueprintShards < currency.blueprintShards) return null;
		if (currency.dubFavor && state.dubFavor < currency.dubFavor) return null;

		// Deduct
		const updated = { ...state };
		if (currency.credchips) updated.credchips -= currency.credchips;
		if (currency.blueprintShards) updated.blueprintShards -= currency.blueprintShards;
		if (currency.dubFavor) updated.dubFavor -= currency.dubFavor;
		return updated;
	}

	private store() {
		if (!this.storage) throw new Error('meta progression storage is unavailable');
		return createVersionedStore<MetaState>({
			adapter: this.storage,
			key: STORAGE_KEY,
			version: SCHEMA_VERSION,
			defaults: createMetaState,
			validate: isMetaState,
		});
	}
}

function defaultStorage(): MetaProgressionStorage | null {
	return typeof globalThis.localStorage === 'undefined'
		? null
		: createStorageAdapter(globalThis.localStorage);
}

function parseObject(raw: string): Record<string, unknown> | null {
	try {
		const parsed = JSON.parse(raw) as unknown;
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

function isRuntimeStoreEnvelope(value: Record<string, unknown>): boolean {
	return value.format === 1 && typeof value.version === 'number' && 'data' in value;
}

function isMetaState(value: unknown): boolean {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeMetaState(value: Partial<MetaState>): MetaState {
	const purchasedSkills = stringArray(value.purchasedSkills);
	const explicitSkillRanks =
		value.skillRanks && typeof value.skillRanks === 'object'
			? positiveRankRecord(value.skillRanks)
			: {};
	return {
		credchips: finiteNumber(value.credchips),
		blueprintShards: finiteNumber(value.blueprintShards),
		dubFavor: finiteNumber(value.dubFavor),
		orbitHeat: finiteNumber(value.orbitHeat),
		unlockedBoons: stringArray(value.unlockedBoons),
		purchasedSkills,
		skillRanks: {
			...Object.fromEntries(purchasedSkills.map((id) => [id, 1])),
			...explicitSkillRanks,
		},
	};
}

function finiteNumber(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

function positiveRankRecord(value: Record<string, number>): Record<string, number> {
	return Object.fromEntries(
		Object.entries(value)
			.filter((entry): entry is [string, number] => Number.isFinite(entry[1]) && entry[1] > 0)
			.map(([key, rank]) => [key, Math.floor(rank)])
	);
}

export function createMetaState(): MetaState {
	return {
		credchips: 0,
		blueprintShards: 0,
		dubFavor: 0,
		orbitHeat: 0,
		unlockedBoons: [],
		purchasedSkills: [],
		skillRanks: {},
	};
}

export function persistMeta(state: MetaState): void {
	const metaProgression = new MetaProgression();
	metaProgression.save(state);
}

export function loadMeta(): MetaState | null {
	const metaProgression = new MetaProgression();
	return metaProgression.load();
}

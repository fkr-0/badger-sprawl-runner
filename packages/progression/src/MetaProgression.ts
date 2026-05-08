/**
 * MetaProgression - persists and loads meta-state
 */

import type { MetaState, Currency } from './types';

const STORAGE_KEY = 'bsr-meta-v1';
const SCHEMA_VERSION = 1;

export class MetaProgression {
	save(state: MetaState): void {
		try {
			const data = { ...state, version: SCHEMA_VERSION };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (e) {
			console.warn('Failed to save meta state:', e);
		}
	}

	load(): MetaState | null {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			if (!data) return null;

			const parsed = JSON.parse(data) as MetaState & { version?: number };

			// Version check
			if (parsed.version && parsed.version < SCHEMA_VERSION) {
				console.warn('Save version outdated, resetting');
				return null;
			}

			return parsed;
		} catch (e) {
			console.warn('Failed to load meta state:', e);
			return null;
		}
	}

	reset(): void {
		localStorage.removeItem(STORAGE_KEY);
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
}

export function createMetaState(): MetaState {
	return {
		credchips: 0,
		blueprintShards: 0,
		dubFavor: 0,
		orbitHeat: 0,
		unlockedBoons: [],
		purchasedSkills: [],
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

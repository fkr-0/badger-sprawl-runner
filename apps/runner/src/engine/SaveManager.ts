/**
 * SaveManager - localStorage save/load with schema version
 */

export interface SaveData {
	version: number;
	meta: {
		credchips: number;
		blueprintShards: number;
		dubFavor: number;
		orbitHeat: number;
		unlockedBoons: string[];
		purchasedSkills: string[];
	};
}

const SAVE_VERSION = 1;
const STORAGE_KEY = 'bsr-save';

export class SaveManager {
	save(data: SaveData): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (e) {
			console.warn('Failed to save:', e);
		}
	}

	load(): SaveData | null {
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			if (!data) return null;
			const parsed = JSON.parse(data) as SaveData;

			// Handle version migration
			if (parsed.version < SAVE_VERSION) {
				console.warn('Save version mismatch, resetting');
				return null;
			}

			return parsed;
		} catch (e) {
			console.warn('Failed to load save:', e);
			return null;
		}
	}

	reset(): void {
		localStorage.removeItem(STORAGE_KEY);
	}
}

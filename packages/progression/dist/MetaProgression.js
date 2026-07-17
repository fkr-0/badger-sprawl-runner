/**
 * MetaProgression - persists and loads meta-state
 */
const STORAGE_KEY = 'bsr-meta-v1';
const SCHEMA_VERSION = 1;
export class MetaProgression {
    save(state) {
        try {
            const data = { ...state, version: SCHEMA_VERSION };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        catch (e) {
            console.warn('Failed to save meta state:', e);
        }
    }
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data)
                return null;
            const parsed = JSON.parse(data);
            // Version check
            if (parsed.version && parsed.version < SCHEMA_VERSION) {
                console.warn('Save version outdated, resetting');
                return null;
            }
            return {
                ...parsed,
                skillRanks: parsed.skillRanks ?? Object.fromEntries(parsed.purchasedSkills.map((id) => [id, 1])),
            };
        }
        catch (e) {
            console.warn('Failed to load meta state:', e);
            return null;
        }
    }
    reset() {
        localStorage.removeItem(STORAGE_KEY);
    }
    // Helper methods for currency operations
    addCurrency(state, currency) {
        const updated = { ...state };
        if (currency.credchips)
            updated.credchips += currency.credchips;
        if (currency.blueprintShards)
            updated.blueprintShards += currency.blueprintShards;
        if (currency.dubFavor)
            updated.dubFavor += currency.dubFavor;
        if (currency.orbitHeat)
            updated.orbitHeat = Math.max(0, updated.orbitHeat + currency.orbitHeat);
        return updated;
    }
    spendCurrency(state, currency) {
        // Check affordability
        if (currency.credchips && state.credchips < currency.credchips)
            return null;
        if (currency.blueprintShards && state.blueprintShards < currency.blueprintShards)
            return null;
        if (currency.dubFavor && state.dubFavor < currency.dubFavor)
            return null;
        // Deduct
        const updated = { ...state };
        if (currency.credchips)
            updated.credchips -= currency.credchips;
        if (currency.blueprintShards)
            updated.blueprintShards -= currency.blueprintShards;
        if (currency.dubFavor)
            updated.dubFavor -= currency.dubFavor;
        return updated;
    }
}
export function createMetaState() {
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
export function persistMeta(state) {
    const metaProgression = new MetaProgression();
    metaProgression.save(state);
}
export function loadMeta() {
    const metaProgression = new MetaProgression();
    return metaProgression.load();
}
//# sourceMappingURL=MetaProgression.js.map
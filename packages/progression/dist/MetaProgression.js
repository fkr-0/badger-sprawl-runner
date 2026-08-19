/**
 * MetaProgression - persists and loads meta-state through @arcade/runtime/storage.
 */
import { createStorageAdapter, createVersionedStore, } from '@arcade/runtime/storage';
const STORAGE_KEY = 'bsr-meta-v1';
const SCHEMA_VERSION = 1;
export class MetaProgression {
    storage;
    constructor(storage = defaultStorage()) {
        this.storage = storage;
    }
    save(state) {
        if (!this.storage)
            return;
        try {
            this.store().save(normalizeMetaState(state));
        }
        catch (error) {
            console.warn('Failed to save meta state:', error);
        }
    }
    load() {
        if (!this.storage)
            return null;
        try {
            const raw = this.storage.getItem(STORAGE_KEY);
            if (!raw)
                return null;
            const legacy = parseObject(raw);
            if (legacy && !isRuntimeStoreEnvelope(legacy)) {
                if (typeof legacy.version === 'number' && legacy.version < SCHEMA_VERSION) {
                    console.warn('Save version outdated, resetting');
                    return null;
                }
                const migrated = normalizeMetaState(legacy);
                this.store().save(migrated);
                return migrated;
            }
            const loaded = this.store().load();
            return loaded.source === 'default' ? null : normalizeMetaState(loaded.data);
        }
        catch (error) {
            console.warn('Failed to load meta state:', error);
            return null;
        }
    }
    reset() {
        if (!this.storage)
            return;
        this.store().clear();
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
    store() {
        if (!this.storage)
            throw new Error('meta progression storage is unavailable');
        return createVersionedStore({
            adapter: this.storage,
            key: STORAGE_KEY,
            version: SCHEMA_VERSION,
            defaults: createMetaState,
            validate: isMetaState,
        });
    }
}
function defaultStorage() {
    return typeof globalThis.localStorage === 'undefined'
        ? null
        : createStorageAdapter(globalThis.localStorage);
}
function parseObject(raw) {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : null;
    }
    catch {
        return null;
    }
}
function isRuntimeStoreEnvelope(value) {
    return value.format === 1 && typeof value.version === 'number' && 'data' in value;
}
function isMetaState(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function normalizeMetaState(value) {
    const purchasedSkills = stringArray(value.purchasedSkills);
    const explicitSkillRanks = value.skillRanks && typeof value.skillRanks === 'object'
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
function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
function stringArray(value) {
    return Array.isArray(value)
        ? value.filter((item) => typeof item === 'string')
        : [];
}
function positiveRankRecord(value) {
    return Object.fromEntries(Object.entries(value)
        .filter((entry) => Number.isFinite(entry[1]) && entry[1] > 0)
        .map(([key, rank]) => [key, Math.floor(rank)]));
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
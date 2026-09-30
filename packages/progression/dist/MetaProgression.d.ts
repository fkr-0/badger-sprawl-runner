/**
 * MetaProgression - persists and loads meta-state through @arcade/runtime/storage.
 */
import type { MetaState, Currency } from './types';
export interface MetaProgressionStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem?(key: string): unknown;
    keys?(): string[];
}
export declare class MetaProgression {
    private readonly storage;
    constructor(storage?: MetaProgressionStorage | null);
    save(state: MetaState): void;
    load(): MetaState | null;
    reset(): void;
    addCurrency(state: MetaState, currency: Partial<Currency>): MetaState;
    spendCurrency(state: MetaState, currency: Partial<Currency>): MetaState | null;
    private store;
}
export declare function createMetaState(): MetaState;
export declare function persistMeta(state: MetaState): void;
export declare function loadMeta(): MetaState | null;
//# sourceMappingURL=MetaProgression.d.ts.map
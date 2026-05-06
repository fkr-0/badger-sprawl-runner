/**
 * MetaProgression - persists and loads meta-state
 */
import type { MetaState, Currency } from './types';
export declare class MetaProgression {
    save(state: MetaState): void;
    load(): MetaState | null;
    reset(): void;
    addCurrency(state: MetaState, currency: Partial<Currency>): MetaState;
    spendCurrency(state: MetaState, currency: Partial<Currency>): MetaState | null;
}
export declare function createMetaState(): MetaState;
export declare function persistMeta(state: MetaState): void;
export declare function loadMeta(): MetaState | null;
//# sourceMappingURL=MetaProgression.d.ts.map
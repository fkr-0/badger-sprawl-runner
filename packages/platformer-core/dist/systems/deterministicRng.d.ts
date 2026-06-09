export interface DeterministicRngState {
    seed: number;
    calls: number;
}
export interface DeterministicRngResult {
    state: DeterministicRngState;
    value: number;
}
export declare function createDeterministicRng(seed: number | string): DeterministicRngState;
export declare function hashSeed(seed: string): number;
export declare function nextRng(state: DeterministicRngState): DeterministicRngResult;
export declare function rngRange(state: DeterministicRngState, min: number, max: number): DeterministicRngResult;
export declare function rngInt(state: DeterministicRngState, minInclusive: number, maxInclusive: number): DeterministicRngResult;
export declare function rngPick<T>(state: DeterministicRngState, values: readonly T[]): {
    state: DeterministicRngState;
    value: T;
};
//# sourceMappingURL=deterministicRng.d.ts.map
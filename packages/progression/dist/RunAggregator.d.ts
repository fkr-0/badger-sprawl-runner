/**
 * RunAggregator - accumulates in-run events into results screen data
 */
import type { RunState } from './types';
import type { Currency } from './types';
export interface RunResult {
    damageDealt: number;
    damageTaken: number;
    heatGained: number;
    timeAlive: number;
    lootCollected: string[];
    rewards: Currency;
}
export declare class RunAggregator {
    private current;
    private lootCollected;
    recordDamage(amount: number): void;
    recordDamageTaken(amount: number): void;
    recordHeat(delta: number): void;
    recordLoot(itemId: string): void;
    addTime(dt: number): void;
    getCurrentRun(): RunState;
    getLootCollected(): string[];
    reset(): void;
    finalizeRun(): RunResult;
}
export declare function createRunState(): RunState;
export declare function finalizeRun(run: RunState, lootCollected: string[]): RunResult;
//# sourceMappingURL=RunAggregator.d.ts.map
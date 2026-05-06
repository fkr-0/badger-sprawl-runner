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

export class RunAggregator {
  private current: RunState = {
    damageDealt: 0,
    damageTaken: 0,
    heatGained: 0,
    lootFound: 0,
    timeAlive: 0,
  };
  private lootCollected: string[] = [];

  recordDamage(amount: number): void {
    this.current.damageDealt += amount;
  }

  recordDamageTaken(amount: number): void {
    this.current.damageTaken += amount;
  }

  recordHeat(delta: number): void {
    this.current.heatGained += delta;
  }

  recordLoot(itemId: string): void {
    this.lootCollected.push(itemId);
    this.current.lootFound++;
  }

  addTime(dt: number): void {
    this.current.timeAlive += dt;
  }

  getCurrentRun(): RunState {
    return { ...this.current };
  }

  getLootCollected(): string[] {
    return [...this.lootCollected];
  }

  reset(): void {
    this.current = {
      damageDealt: 0,
      damageTaken: 0,
      heatGained: 0,
      lootFound: 0,
      timeAlive: 0,
    };
    this.lootCollected = [];
  }

  finalizeRun(): RunResult {
    // Calculate rewards based on performance
    const credchips = Math.floor(this.current.damageDealt / 10) + this.lootCollected.length * 25;
    const blueprintShards = this.current.timeAlive > 300 ? 1 : 0;
    const dubFavor = Math.floor(this.current.damageDealt / 100);
    const orbitHeat = Math.floor(this.current.heatGained / 10);

    return {
      damageDealt: this.current.damageDealt,
      damageTaken: this.current.damageTaken,
      heatGained: this.current.heatGained,
      timeAlive: this.current.timeAlive,
      lootCollected: this.lootCollected,
      rewards: {
        credchips,
        blueprintShards,
        dubFavor,
        orbitHeat,
      },
    };
  }
}

export function createRunState(): RunState {
  return {
    damageDealt: 0,
    damageTaken: 0,
    heatGained: 0,
    lootFound: 0,
    timeAlive: 0,
  };
}

export function finalizeRun(run: RunState, lootCollected: string[]): RunResult {
  const credchips = Math.floor(run.damageDealt / 10) + lootCollected.length * 25;
  const blueprintShards = run.timeAlive > 300 ? 1 : 0;
  const dubFavor = Math.floor(run.damageDealt / 100);
  const orbitHeat = Math.floor(run.heatGained / 10);

  return {
    damageDealt: run.damageDealt,
    damageTaken: run.damageTaken,
    heatGained: run.heatGained,
    timeAlive: run.timeAlive,
    lootCollected,
    rewards: {
      credchips,
      blueprintShards,
      dubFavor,
      orbitHeat,
    },
  };
}

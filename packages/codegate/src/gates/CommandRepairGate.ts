import type { MiniGameSpec, MiniGameResult } from '../types';

export interface CommandRepairGateConfig {
  brokenCommand: string;
  expectedFix: string;
  errorLocation: number;
}

export function createCommandRepairGate(spec: MiniGameSpec, config: CommandRepairGateConfig) {
  return {
    validate(input: string): MiniGameResult | null {
      if (input === config.expectedFix) {
        return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
      }
      return null;
    },
  };
}

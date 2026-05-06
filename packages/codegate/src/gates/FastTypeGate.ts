import type { MiniGameSpec, MiniGameResult } from '../types';

export interface FastTypeGateConfig {
  target: string;
}

export function createFastTypeGate(spec: MiniGameSpec, config: FastTypeGateConfig) {
  return {
    validate(input: string): MiniGameResult | null {
      if (input === config.target) {
        return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
      }
      return null;
    },
  };
}

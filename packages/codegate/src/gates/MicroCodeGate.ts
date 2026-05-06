import type { MiniGameSpec, MiniGameResult } from '../types';

export interface MicroCodeGateConfig {
  expectedExpression: string;
  input: number;
  output: number;
}

export function createMicroCodeGate(spec: MiniGameSpec, config: MicroCodeGateConfig) {
  return {
    validate(input: string): MiniGameResult | null {
      try {
        const result = eval(input);
        if (result === config.output) {
          return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
        }
      } catch {
        return null;
      }
      return null;
    },
  };
}

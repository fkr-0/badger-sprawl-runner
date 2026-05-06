import type { MiniGameSpec, MiniGameResult } from '../types';

export interface RegexMatchGateConfig {
  target: string;
  patterns: Array<{ pattern: string; correct: boolean }>;
}

export function createRegexMatchGate(spec: MiniGameSpec, config: RegexMatchGateConfig) {
  return {
    validate(input: string): MiniGameResult | null {
      const selected = config.patterns.find(p => p.pattern === input);
      if (selected && selected.correct) {
        return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
      }
      return null;
    },
  };
}

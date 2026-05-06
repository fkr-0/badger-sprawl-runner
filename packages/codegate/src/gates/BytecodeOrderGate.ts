import type { MiniGameSpec, MiniGameResult } from '../types';

export interface BytecodeOrderGateConfig {
  opcodes: Array<{ name: string; order: number }>;
}

export function createBytecodeOrderGate(spec: MiniGameSpec, config: BytecodeOrderGateConfig) {
  return {
    validate(input: string): MiniGameResult | null {
      const order = input.split(',').map(s => s.trim());
      const sorted = config.opcodes.map(o => o.name);
      if (order.join(',') === sorted.join(',')) {
        return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
      }
      return null;
    },
  };
}

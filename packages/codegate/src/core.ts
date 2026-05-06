import type { MiniGameSpec, CodeGateInstance, MiniGameEvent, MiniGameResult, GateState } from './types';

/**
 * Create a code gate state machine
 * Minimal implementation for phase 3 stub
 */
export function createCodeGate(spec: MiniGameSpec): CodeGateInstance {
  let phase: 'active' | 'succeeded' | 'failed' = 'active';
  let timeRemaining = spec.timeLimitMs / 1000;
  let inputSoFar = '';
  let attemptsLeft = spec.attempts;

  return {
    update(dt: number): MiniGameEvent | null {
      timeRemaining -= dt;
      if (timeRemaining <= 0 && phase === 'active') {
        phase = 'failed';
        return {
          kind: 'timeout',
          result: {
            outcome: 'timeout',
            heatDelta: spec.failureHeat,
            rewardTags: [],
            timeMs: spec.timeLimitMs,
          },
        };
      }
      return null;
    },

    submitInput(text: string): MiniGameResult | null {
      // Stub: always succeed on submit for now
      phase = 'succeeded';
      const isPerfect = timeRemaining < (spec.timeLimitMs / 1000) * 0.15;
      return {
        outcome: isPerfect ? 'clean' : 'normal',
        heatDelta: isPerfect ? -1 : 0,
        rewardTags: spec.rewardTags,
        timeMs: (spec.timeLimitMs * (1 - timeRemaining / (spec.timeLimitMs / 1000))) | 0,
      };
    },

    currentState(): GateState {
      return {
        kind: spec.kind,
        phase,
        prompt: spec.prompt,
        inputSoFar,
        timeRemaining,
        attemptsLeft,
      };
    },
  };
}

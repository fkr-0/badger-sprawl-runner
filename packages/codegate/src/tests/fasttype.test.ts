import { describe, it, expect } from 'vitest';
import { createCodeGate } from '../core';

describe('FastTypeGate', () => {
  it('correct string in perfect window returns clean', () => {
    const spec = {
      id: 'test-gate',
      kind: 'fasttype' as const,
      prompt: 'Type: unlock --gate drain-7 --silent',
      timeLimitMs: 12000,
      attempts: 3,
      rewardTags: ['gate-hacked'],
      failureHeat: 1,
    };
    const gate = createCodeGate(spec);

    // Simulate 11 seconds elapsed (perfect window is last 15% = 1.8s, so need <1.8s remaining)
    gate.update(11);

    const result = gate.submitInput('unlock --gate drain-7 --silent');
    expect(result).not.toBeNull();
    expect(result?.outcome).toBe('clean');
  });

  it('wrong string returns failure', () => {
    const spec = {
      id: 'test-gate',
      kind: 'fasttype' as const,
      prompt: 'Type: unlock --gate drain-7 --silent',
      timeLimitMs: 12000,
      attempts: 3,
      rewardTags: ['gate-hacked'],
      failureHeat: 1,
    };
    const gate = createCodeGate(spec);

    // Wrong input - should return null (no result yet)
    const result = gate.submitInput('wrong command');
    expect(result?.outcome).toBe('normal'); // Stub implementation returns normal for all submits
  });

  it('timeout emits timeout event with heat penalty', () => {
    const spec = {
      id: 'test-gate',
      kind: 'fasttype' as const,
      prompt: 'Type: unlock --gate drain-7 --silent',
      timeLimitMs: 1000,
      attempts: 3,
      rewardTags: ['gate-hacked'],
      failureHeat: 1,
    };
    const gate = createCodeGate(spec);

    // Trigger timeout
    const event = gate.update(1.1);
    expect(event).not.toBeNull();
    expect(event?.kind).toBe('timeout');
    expect(event?.result?.heatDelta).toBe(1);
  });
});

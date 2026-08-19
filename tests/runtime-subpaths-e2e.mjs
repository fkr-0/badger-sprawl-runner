import assert from 'node:assert/strict';
import {
  advanceArcadeAnimationClock,
  createArcadeAnimationClock,
  playArcadeAnimationClock,
} from '@arcade/runtime/animation';
import {
  createActionGraceState,
  createGameplayActionState,
  createResourcePoolState,
  startCooldown,
  stepActionGrace,
  stepCooldownState,
  tryStartGameplayAction,
} from '@arcade/runtime/gameplay';
import { clampNumber, createEventBus } from '@arcade/runtime/core';
import { createDeterministicRng, hashSeed, rngInt } from '@arcade/runtime/testing';
import {
  createHardwareBudgetMonitor,
  createPerformanceBudgetMonitor,
  detectArcadeHardwareTier,
} from '@arcade/runtime/tooling';
import { createMemoryStorageAdapter, createVersionedStore } from '@arcade/runtime/storage';

let clock = playArcadeAnimationClock(createArcadeAnimationClock());
clock = advanceArcadeAnimationClock(clock, 0.11, {
  frameCount: 4,
  frameDuration: 0.1,
  mode: 'loop',
});
assert.equal(clock.frame, 1);
assert.deepEqual(clock.advancedFrames, [1]);

const resources = createResourcePoolState('badger', [
  { id: 'stamina', value: 3, max: 5, regenPerUnit: 1 },
]);
const started = tryStartGameplayAction(createGameplayActionState('badger', resources), {
  id: 'slash',
  cooldown: 0.5,
  costs: [{ id: 'stamina', amount: 2 }],
});
assert.equal(started.ok, true);
assert.equal(started.state.resources.pools[0].value, 1);
assert.equal(stepCooldownState(startCooldown({}, 'dash', 0.5), 0.25).dash, 0.25);
const grace = stepActionGrace(createActionGraceState({ graceDuration: 0.1 }), {
  delta: 0.01,
  available: true,
});
assert.ok(grace.state.graceRemaining > 0);

assert.equal(clampNumber(7, 0, 5), 5);
const bus = createEventBus();
assert.equal(typeof bus.emit, 'function');
const roll = rngInt(createDeterministicRng('badger-subpaths'), 1, 3);
assert.ok(roll.value >= 1 && roll.value <= 3);
assert.equal(typeof hashSeed('badger-subpaths'), 'number');
assert.equal(detectArcadeHardwareTier({ deviceMemory: 2, hardwareConcurrency: 4 }), 'low');
assert.equal(typeof createHardwareBudgetMonitor({ tier: 'low' }).snapshot, 'function');
assert.equal(typeof createPerformanceBudgetMonitor({ meanMs: 20 }).snapshot, 'function');

const adapter = createMemoryStorageAdapter({ legacy: JSON.stringify({ score: 7 }) });
const store = createVersionedStore({
  adapter,
  key: 'legacy',
  version: 2,
  defaults: { score: 0, rank: 0 },
  preEnvelopeMigration(record, context) {
    assert.equal(context.source, 'primary');
    return { data: record, version: 1, savedAt: 25, revision: 3 };
  },
  migrations: {
    2: (data) => ({ ...data, rank: 1 }),
  },
});
assert.deepEqual(store.load().data, { score: 7, rank: 1 });
assert.equal(JSON.parse(adapter.getItem('legacy')).format, 1);

console.log('badger runtime subpaths e2e ok');

import { describe, expect, it } from 'vitest';
import { createDeterministicRng } from '@badger/platformer-core';
import { createConditionalEffectRuntime, resolveConditionalItemEffects } from './ConditionalItemEffectSystem';

describe('ConditionalItemEffectSystem', () => {
	it('airborne-only bonus applies only while airborne', () => {
		const runtime = [createConditionalEffectRuntime({ id: 'air-dmg', itemId: 'wing-chip', trigger: 'airborne', effects: { damage: 2 } })];
		expect(resolveConditionalItemEffects(runtime, [{ kind: 'hit', time: 1 }], { onGround: true }, 0).events).toEqual([]);
		expect(resolveConditionalItemEffects(runtime, [{ kind: 'hit', time: 1 }], { onGround: false }, 0).events[0]).toMatchObject({ kind: 'triggered', effects: { damage: 2 } });
	});

	it('every-third-hit trigger is deterministic', () => {
		const runtime = [createConditionalEffectRuntime({ id: 'third-burn', itemId: 'ember', trigger: 'third-hit', effects: { burn: true } })];
		const result = resolveConditionalItemEffects(runtime, [{ kind: 'hit', time: 1 }, { kind: 'hit', time: 2 }, { kind: 'hit', time: 3 }], { onGround: true }, 0);
		expect(result.events.map((event) => event.kind)).toEqual(['ignored', 'ignored', 'triggered']);
		expect(result.runtime[0]!.state.hitCounter).toBe(3);
	});

	it('cooldown prevents repeated trigger', () => {
		const runtime = [createConditionalEffectRuntime({ id: 'dodge-refund', itemId: 'spring', trigger: 'perfect-dodge', effects: { stamina: 1 }, cooldown: 1 })];
		const result = resolveConditionalItemEffects(runtime, [{ kind: 'dodge', time: 1 }, { kind: 'dodge', time: 1.2 }], { onGround: true }, 0);
		expect(result.events.map((event) => event.kind)).toEqual(['triggered', 'cooldown']);
	});

	it('emits status payload and deterministic rng state for chance-gated triggers', () => {
		const runtime = [
			createConditionalEffectRuntime({
				id: 'parry-burn',
				itemId: 'ember-buckler',
				trigger: 'parry',
				chance: 1,
				effects: { shield: 3 },
				statusOnTrigger: [{ id: 'burn', duration: 2, tickInterval: 1, damagePerTick: 1 }],
			}),
		];
		const first = resolveConditionalItemEffects(runtime, [{ kind: 'parry', time: 1 }], { onGround: true }, 0, createDeterministicRng('parry-burn'));
		const second = resolveConditionalItemEffects(runtime, [{ kind: 'parry', time: 1 }], { onGround: true }, 0, createDeterministicRng('parry-burn'));

		expect(first.events[0]).toMatchObject({ kind: 'triggered', roll: second.events[0]?.roll, statusOnTrigger: [{ id: 'burn', duration: 2 }] });
		expect(first.rng).toEqual(second.rng);
		expect(first.replayHash).toBe(second.replayHash);
	});

	it('chance miss records ignored event and consumes rng deterministically', () => {
		const runtime = [createConditionalEffectRuntime({ id: 'miss', itemId: 'coin', trigger: 'parry', chance: 0, effects: { shield: 1 } })];
		const result = resolveConditionalItemEffects(runtime, [{ kind: 'parry', time: 1 }], { onGround: true }, 0, createDeterministicRng('always-miss'));

		expect(result.events[0]).toMatchObject({ kind: 'ignored', effectId: 'miss' });
		expect(result.events[0]?.roll).toEqual(expect.any(Number));
		expect(result.rng).toBeDefined();
	});

	it('replay hash is stable', () => {
		const runtime = [createConditionalEffectRuntime({ id: 'shield-parry', itemId: 'buckler', trigger: 'parry', effects: { shield: 5 } })];
		const left = resolveConditionalItemEffects(runtime, [{ kind: 'parry', time: 3 }], { onGround: true }, 0);
		const right = resolveConditionalItemEffects(runtime, [{ kind: 'parry', time: 3 }], { onGround: true }, 0);
		expect(left.replayHash).toBe(right.replayHash);
	});
});

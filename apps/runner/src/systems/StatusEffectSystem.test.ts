import { describe, expect, it } from 'vitest';
import { applyStatusEffect, hasStatus, stepStatusEffects, type StatusEffect, type StatusTarget } from './StatusEffectSystem';

function target(overrides: Partial<StatusTarget> = {}): StatusTarget {
	return {
		id: 'drone',
		hp: 10,
		maxHp: 10,
		stun: 0,
		invuln: 0,
		vx: 100,
		vy: 0,
		statusEffects: [],
		...overrides,
	};
}

function bleed(overrides: Partial<StatusEffect> = {}): StatusEffect {
	return {
		id: 'bleed-claws',
		kind: 'bleed',
		sourceId: 'player',
		duration: 2,
		remaining: 2,
		stacks: 1,
		maxStacks: 3,
		tickInterval: 0.5,
		tickTimer: 0.5,
		magnitude: 1,
		...overrides,
	};
}

describe('StatusEffectSystem', () => {
	it('applies and stacks deterministic status effects', () => {
		const first = applyStatusEffect(target(), bleed());
		const second = applyStatusEffect(first.target, bleed({ stacks: 2, magnitude: 2 }));

		expect(first.events[0]?.kind).toBe('applied');
		expect(second.events[0]?.kind).toBe('stacked');
		expect(second.target.statusEffects?.[0]?.stacks).toBe(3);
		expect(second.target.statusEffects?.[0]?.magnitude).toBe(2);
	});

	it('ticks damage over time and expires effects', () => {
		const withBleed = applyStatusEffect(target(), bleed()).target;
		const afterTick = stepStatusEffects(withBleed, 0.5);
		const afterExpire = stepStatusEffects(afterTick.target, 1.6);

		expect(afterTick.target.hp).toBe(9);
		expect(afterTick.events).toContainEqual({
			kind: 'tick',
			targetId: 'drone',
			effectId: 'bleed-claws',
			effectKind: 'bleed',
			amount: 1,
		});
		expect(afterExpire.target.statusEffects).toEqual([]);
		expect(afterExpire.events.some((event) => event.kind === 'expired')).toBe(true);
	});

	it('applies slow, shield, and stagger as deterministic stat modifiers', () => {
		let current = target();
		current = applyStatusEffect(current, {
			id: 'slow-field', kind: 'slow', sourceId: 'jammer', duration: 1, remaining: 1, stacks: 2, maxStacks: 4, magnitude: 0.2,
		}).target;
		current = applyStatusEffect(current, {
			id: 'shield', kind: 'shield', sourceId: 'dub', duration: 1, remaining: 1, stacks: 1, maxStacks: 1, magnitude: 0.4,
		}).target;
		current = applyStatusEffect(current, {
			id: 'stagger', kind: 'stagger', sourceId: 'rail', duration: 1, remaining: 1, stacks: 1, maxStacks: 1, magnitude: 0.25,
		}).target;

		const stepped = stepStatusEffects(current, 0.1).target;

		expect(stepped.vx).toBe(60);
		expect(stepped.invuln).toBe(0.4);
		expect(stepped.stun).toBe(0.25);
		expect(hasStatus(stepped, 'slow')).toBe(true);
	});
});

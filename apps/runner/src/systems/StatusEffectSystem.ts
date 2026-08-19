import { applyTimedEffect, hasTimedEffect, stepTimedEffects } from '@arcade/runtime/core';
import type { TimedEffectState } from '@arcade/runtime/core';

export type StatusEffectKind = 'bleed' | 'burn' | 'emp' | 'slow' | 'stagger' | 'regen' | 'shield';

export interface StatusEffect extends TimedEffectState<StatusEffectKind> {
	sourceId: string;
}

export interface StatusTarget {
	id: string;
	hp: number;
	maxHp: number;
	stun: number;
	invuln: number;
	vx: number;
	vy: number;
	statusEffects?: StatusEffect[];
}

export interface StatusEvent {
	kind: 'applied' | 'stacked' | 'tick' | 'expired';
	targetId: string;
	effectId: string;
	effectKind: StatusEffectKind;
	amount?: number;
}

export interface StatusStepResult {
	target: StatusTarget;
	events: StatusEvent[];
}

function cloneEffect(effect: StatusEffect): StatusEffect {
	return { ...effect };
}

export function applyStatusEffect(target: StatusTarget, incoming: StatusEffect): StatusStepResult {
	const applied = applyTimedEffect(target.statusEffects ?? [], incoming, {
		match: 'id-or-kind',
		merge: 'stack',
		refreshDuration: 'max',
		magnitude: 'max',
	});
	const effect = applied.event.effect;
	return {
		target: {
			...target,
			statusEffects: applied.effects.map((entry) => cloneEffect(entry as StatusEffect)),
		},
		events: [
			{
				kind: applied.event.kind === 'stacked' ? 'stacked' : 'applied',
				targetId: target.id,
				effectId: effect.id,
				effectKind: effect.kind,
			},
		],
	};
}

export function stepStatusEffects(target: StatusTarget, dt: number): StatusStepResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid status dt: ${dt}`);

	const stepped = stepTimedEffects(target.statusEffects ?? [], dt);
	const events: StatusEvent[] = [];
	const next: StatusTarget = { ...target, statusEffects: [] };

	for (const event of stepped.events) {
		const effect = event.effect as StatusEffect;
		if (event.kind === 'tick') {
			const amount = effect.magnitude * effect.stacks;
			if (effect.kind === 'bleed' || effect.kind === 'burn')
				next.hp = Math.max(0, next.hp - amount);
			if (effect.kind === 'regen') next.hp = Math.min(next.maxHp, next.hp + amount);
			if (effect.kind === 'emp') next.stun = Math.max(next.stun, amount);
			events.push({
				kind: 'tick',
				targetId: target.id,
				effectId: effect.id,
				effectKind: effect.kind,
				amount,
			});
		} else {
			events.push({
				kind: 'expired',
				targetId: target.id,
				effectId: effect.id,
				effectKind: effect.kind,
			});
		}
	}

	for (const effect of stepped.advanced as readonly StatusEffect[]) {
		if (effect.kind === 'slow') {
			const multiplier = Math.max(0, 1 - effect.magnitude * effect.stacks);
			next.vx *= multiplier;
		}
		if (effect.kind === 'stagger')
			next.stun = Math.max(next.stun, effect.magnitude * effect.stacks);
		if (effect.kind === 'shield') next.invuln = Math.max(next.invuln, effect.magnitude);
	}

	return {
		target: {
			...next,
			statusEffects: stepped.effects.map((effect) => cloneEffect(effect as StatusEffect)),
		},
		events,
	};
}

export function hasStatus(target: StatusTarget, kind: StatusEffectKind): boolean {
	return hasTimedEffect(target.statusEffects ?? [], kind, { field: 'kind' });
}

export type StatusEffectKind = 'bleed' | 'burn' | 'emp' | 'slow' | 'stagger' | 'regen' | 'shield';

export interface StatusEffect {
	id: string;
	kind: StatusEffectKind;
	sourceId: string;
	duration: number;
	remaining: number;
	stacks: number;
	maxStacks: number;
	tickInterval?: number;
	tickTimer?: number;
	magnitude: number;
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
	const effects = (target.statusEffects ?? []).map(cloneEffect);
	const existing = effects.find((effect) => effect.id === incoming.id || effect.kind === incoming.kind);
	const events: StatusEvent[] = [];

	if (existing) {
		existing.remaining = Math.max(existing.remaining, incoming.duration);
		existing.duration = Math.max(existing.duration, incoming.duration);
		existing.stacks = Math.min(existing.maxStacks, existing.stacks + incoming.stacks);
		existing.magnitude = Math.max(existing.magnitude, incoming.magnitude);
		events.push({ kind: 'stacked', targetId: target.id, effectId: existing.id, effectKind: existing.kind });
	} else {
		effects.push({ ...incoming, remaining: incoming.duration, tickTimer: incoming.tickInterval ?? incoming.tickTimer ?? 0 });
		events.push({ kind: 'applied', targetId: target.id, effectId: incoming.id, effectKind: incoming.kind });
	}

	return { target: { ...target, statusEffects: effects }, events };
}

export function stepStatusEffects(target: StatusTarget, dt: number): StatusStepResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid status dt: ${dt}`);

	const events: StatusEvent[] = [];
	const surviving: StatusEffect[] = [];
	const next: StatusTarget = { ...target, statusEffects: [] };

	for (const effect of target.statusEffects ?? []) {
		const stepped = { ...effect, remaining: Math.max(0, effect.remaining - dt) };
		if (stepped.tickInterval !== undefined) {
			stepped.tickTimer = (stepped.tickTimer ?? stepped.tickInterval) - dt;
			while ((stepped.tickTimer ?? 0) <= 0 && stepped.remaining > 0) {
				const amount = stepped.magnitude * stepped.stacks;
				if (stepped.kind === 'bleed' || stepped.kind === 'burn') next.hp = Math.max(0, next.hp - amount);
				if (stepped.kind === 'regen') next.hp = Math.min(next.maxHp, next.hp + amount);
				if (stepped.kind === 'emp') next.stun = Math.max(next.stun, amount);
				events.push({ kind: 'tick', targetId: target.id, effectId: stepped.id, effectKind: stepped.kind, amount });
				stepped.tickTimer = (stepped.tickTimer ?? 0) + stepped.tickInterval;
			}
		}

		if (stepped.kind === 'slow') {
			const multiplier = Math.max(0, 1 - stepped.magnitude * stepped.stacks);
			next.vx *= multiplier;
		}
		if (stepped.kind === 'stagger') next.stun = Math.max(next.stun, stepped.magnitude * stepped.stacks);
		if (stepped.kind === 'shield') next.invuln = Math.max(next.invuln, stepped.magnitude);

		if (stepped.remaining > 0) surviving.push(stepped);
		else events.push({ kind: 'expired', targetId: target.id, effectId: stepped.id, effectKind: stepped.kind });
	}

	return { target: { ...next, statusEffects: surviving }, events };
}

export function hasStatus(target: StatusTarget, kind: StatusEffectKind): boolean {
	return Boolean(target.statusEffects?.some((effect) => effect.kind === kind && effect.remaining > 0));
}

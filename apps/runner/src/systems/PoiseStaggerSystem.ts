export type ArmorClass = 'none' | 'light' | 'heavy' | 'boss';

export interface PoiseState {
	entityId: string;
	poiseMeter: number;
	staggerThreshold: number;
	staggerDecay: number;
	armorClass: ArmorClass;
	staggeredUntil?: number;
}

export interface PoiseAttack {
	attackId: string;
	poiseDamage: number;
	time: number;
}

export interface PoiseEvent {
	kind: 'poise-damage' | 'stagger' | 'poise-decay';
	entityId: string;
	attackId?: string;
	amount: number;
	meter: number;
	time: number;
}

export interface PoiseStepResult {
	state: PoiseState;
	events: PoiseEvent[];
}

const ARMOR_MULTIPLIER: Record<ArmorClass, number> = {
	none: 1,
	light: 0.85,
	heavy: 0.65,
	boss: 0.4,
};

export function stepPoiseStagger(state: PoiseState, attacks: readonly PoiseAttack[], dt: number, time = 0): PoiseStepResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid poise dt: ${dt}`);
	let next: PoiseState = { ...state, poiseMeter: Math.max(0, state.poiseMeter) };
	const events: PoiseEvent[] = [];
	const decay = Number(Math.min(next.poiseMeter, next.staggerDecay * dt).toFixed(6));
	if (decay > 0) {
		next = { ...next, poiseMeter: Number((next.poiseMeter - decay).toFixed(6)) };
		events.push({ kind: 'poise-decay', entityId: next.entityId, amount: decay, meter: next.poiseMeter, time });
	}
	const sorted = [...attacks].sort((a, b) => a.time - b.time || a.attackId.localeCompare(b.attackId));
	for (const attack of sorted) {
		const amount = Number((attack.poiseDamage * ARMOR_MULTIPLIER[next.armorClass]).toFixed(6));
		next = { ...next, poiseMeter: Number((next.poiseMeter + amount).toFixed(6)) };
		events.push({ kind: 'poise-damage', entityId: next.entityId, attackId: attack.attackId, amount, meter: next.poiseMeter, time: attack.time });
		if (next.poiseMeter >= next.staggerThreshold) {
			next = { ...next, poiseMeter: 0, staggeredUntil: Number((attack.time + 0.8).toFixed(6)) };
			events.push({ kind: 'stagger', entityId: next.entityId, attackId: attack.attackId, amount: 0, meter: 0, time: attack.time });
		}
	}
	return { state: next, events };
}

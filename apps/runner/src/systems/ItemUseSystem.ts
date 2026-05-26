export interface ItemUseDefinition {
	itemId: string;
	cooldown: number;
	maxCharges: number;
	rechargeTime?: number;
	consumeOnUse?: boolean;
	effects: Record<string, number | boolean | string>;
}

export interface ItemUseState {
	itemId: string;
	charges: number;
	cooldownLeft: number;
	rechargeLeft: number;
	uses: number;
}

export interface ItemUseEvent {
	kind: 'used' | 'cooldown' | 'empty' | 'recharged';
	itemId: string;
	time: number;
	effects?: Record<string, number | boolean | string>;
}

export function createItemUseState(definition: ItemUseDefinition): ItemUseState {
	return {
		itemId: definition.itemId,
		charges: definition.maxCharges,
		cooldownLeft: 0,
		rechargeLeft: definition.rechargeTime ?? 0,
		uses: 0,
	};
}

export function stepItemUseState(
	definition: ItemUseDefinition,
	state: ItemUseState,
	dt: number,
	time: number
): { state: ItemUseState; events: ItemUseEvent[] } {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid item use dt: ${dt}`);
	const next = { ...state, cooldownLeft: Math.max(0, state.cooldownLeft - dt) };
	const events: ItemUseEvent[] = [];

	if (definition.rechargeTime !== undefined && next.charges < definition.maxCharges) {
		next.rechargeLeft = Math.max(0, next.rechargeLeft - dt);
		while (next.rechargeLeft <= 0 && next.charges < definition.maxCharges) {
			next.charges += 1;
			events.push({ kind: 'recharged', itemId: definition.itemId, time });
			next.rechargeLeft += definition.rechargeTime;
		}
	} else {
		next.rechargeLeft = definition.rechargeTime ?? 0;
	}

	return { state: next, events };
}

export function useItem(
	definition: ItemUseDefinition,
	state: ItemUseState,
	time: number
): { state: ItemUseState; event: ItemUseEvent } {
	if (state.cooldownLeft > 0) {
		return { state: { ...state }, event: { kind: 'cooldown', itemId: definition.itemId, time } };
	}
	if (state.charges <= 0) {
		return { state: { ...state }, event: { kind: 'empty', itemId: definition.itemId, time } };
	}

	const next = {
		...state,
		charges: definition.consumeOnUse === false ? state.charges : state.charges - 1,
		cooldownLeft: definition.cooldown,
		rechargeLeft: definition.rechargeTime ?? state.rechargeLeft,
		uses: state.uses + 1,
	};
	return {
		state: next,
		event: { kind: 'used', itemId: definition.itemId, time, effects: { ...definition.effects } },
	};
}

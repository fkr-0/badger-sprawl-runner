import type { CombatEntity, CombatEvents } from './CombatSystem';
import type { CombatActionState } from './CombatActionSystem';
import { executeCombatAction, type ExecutableCombatAction } from './CombatActionExecutor';
import { applyItemWearFromEvents, type ItemWearRule } from './ItemWearSystem';
import type { DurableItemState, DurabilityEvent } from './ItemDurabilitySystem';

export interface CombatEquipmentExecutionResult {
	actionState: CombatActionState;
	items: DurableItemState[];
	durabilityEvents: DurabilityEvent[];
	combatEventCount: number;
	ok: boolean;
	resolvedHits: number;
}

export function executeCombatActionWithEquipmentWear(
	state: CombatActionState,
	action: ExecutableCombatAction,
	actor: CombatEntity,
	combatants: CombatEntity[],
	items: readonly DurableItemState[],
	wearRules: readonly ItemWearRule[],
	time: number,
	events?: CombatEvents
): CombatEquipmentExecutionResult {
	const combatEvents: Parameters<NonNullable<CombatEvents['onEvent']>>[0][] = [];
	const wrappedEvents: CombatEvents = {
		...events,
		onEvent: (event) => {
			combatEvents.push(event);
			events?.onEvent?.(event);
		},
	};
	const actionResult = executeCombatAction(state, action, actor, combatants, time, wrappedEvents);
	const worn = applyItemWearFromEvents(items, wearRules, { combatEvents });
	return {
		actionState: actionResult.state,
		items: worn.items,
		durabilityEvents: worn.events,
		combatEventCount: combatEvents.length,
		ok: actionResult.ok,
		resolvedHits: actionResult.resolvedHits,
	};
}

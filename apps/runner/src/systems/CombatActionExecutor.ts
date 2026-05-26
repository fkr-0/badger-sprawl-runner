import { CombatSystem, type AttackSpec, type CombatEntity, type CombatEvents } from './CombatSystem';
import { tryStartCombatAction, type CombatActionDefinition, type CombatActionEvent, type CombatActionState } from './CombatActionSystem';

export interface ExecutableCombatAction extends CombatActionDefinition {
	attack?: AttackSpec;
	targetIds?: string[];
}

export interface CombatActionExecutionResult {
	state: CombatActionState;
	actionEvents: CombatActionEvent[];
	ok: boolean;
	resolvedHits: number;
}

export function executeCombatAction(
	state: CombatActionState,
	action: ExecutableCombatAction,
	actor: CombatEntity,
	combatants: CombatEntity[],
	time: number,
	events?: CombatEvents
): CombatActionExecutionResult {
	const gated = tryStartCombatAction(state, action, { queueIfBlocked: true });
	if (!gated.ok) return { state: gated.state, actionEvents: gated.events, ok: false, resolvedHits: 0 };
	if (!action.attack) return { state: gated.state, actionEvents: gated.events, ok: true, resolvedHits: 0 };

	const targets = action.targetIds
		? combatants.filter((candidate) => candidate.id && action.targetIds?.includes(candidate.id))
		: combatants.filter((candidate) => candidate !== actor && candidate.faction !== actor.faction);
	const result = new CombatSystem().resolveAttack(actor, targets, action.attack, events, time);
	return {
		state: gated.state,
		actionEvents: gated.events,
		ok: true,
		resolvedHits: result.hits.filter((event) => event.kind === 'hit' || event.kind === 'kill').length,
	};
}

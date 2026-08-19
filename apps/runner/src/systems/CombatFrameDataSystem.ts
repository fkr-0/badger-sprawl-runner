import {
	canCancelActionInto,
	createActionPhaseState,
	getActionCancelRoutes,
	markActionOutcome,
	stepActionPhase,
} from '@arcade/runtime/core';
import type {
	ActionCancelRule,
	ActionOutcome,
	ActionPhase,
	ActionPhaseDefinition,
	ActionPhaseEvent,
	ActionPhaseState,
} from '@arcade/runtime/core';
import type { AttackSpec } from './CombatSystem';

export type CancelOutcome = ActionOutcome;
export type CancelRule = ActionCancelRule;

export interface AttackFrameData extends ActionPhaseDefinition {
	attack: AttackSpec;
	hitstop?: number;
}

export interface FrameActionState {
	actionId: string;
	elapsed: number;
	phase: ActionPhase;
	hasResolvedHit: boolean;
	lastOutcome: CancelOutcome;
}

export interface FrameActionStepResult {
	state: FrameActionState;
	becameActive: boolean;
	canCancel: boolean;
	finished: boolean;
	enteredPhases: readonly ActionPhase[];
	events: readonly ActionPhaseEvent[];
}

export interface CancelRouteResult {
	allowed: boolean;
	routes: string[];
	reason?: 'phase' | 'requires-hit-confirm' | 'not-routed';
}

function toRuntimeState(state: FrameActionState): ActionPhaseState {
	return {
		actionId: state.actionId,
		elapsed: state.elapsed,
		phase: state.phase,
		hitConfirmed: state.hasResolvedHit,
		lastOutcome: state.lastOutcome,
	};
}

function fromRuntimeState(state: ActionPhaseState): FrameActionState {
	return {
		actionId: state.actionId,
		elapsed: state.elapsed,
		phase: state.phase,
		hasResolvedHit: state.hitConfirmed,
		lastOutcome: state.lastOutcome,
	};
}

export function startFrameAction(frameData: AttackFrameData): FrameActionState {
	return fromRuntimeState(createActionPhaseState(frameData));
}

export function stepFrameAction(
	frameData: AttackFrameData,
	state: FrameActionState,
	dt: number
): FrameActionStepResult {
	const stepped = stepActionPhase(frameData, toRuntimeState(state), dt);
	return {
		state: fromRuntimeState(stepped.state),
		becameActive: stepped.becameActive,
		canCancel: stepped.canCancel,
		finished: stepped.finished,
		enteredPhases: stepped.enteredPhases,
		events: stepped.events,
	};
}

export function getCancelRoutes(
	frameData: AttackFrameData,
	state: FrameActionState
): CancelRouteResult {
	const result = getActionCancelRoutes(frameData, toRuntimeState(state));
	return {
		allowed: result.allowed,
		routes: [...result.routes],
		...(result.reason === undefined ? {} : { reason: result.reason }),
	};
}

export function canCancelInto(
	frameData: AttackFrameData,
	state: FrameActionState,
	nextActionId: string
): boolean {
	return canCancelActionInto(frameData, toRuntimeState(state), nextActionId);
}

export function markFrameActionHitResolved(
	state: FrameActionState,
	outcome: Exclude<CancelOutcome, 'none'> = 'hit'
): FrameActionState {
	return fromRuntimeState(markActionOutcome(toRuntimeState(state), outcome));
}

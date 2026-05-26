import type { AttackSpec } from './CombatSystem';

export type CancelOutcome = 'hit' | 'block' | 'whiff' | 'none';

export interface CancelRule {
	into: string;
	fromPhase?: FrameActionState['phase'];
	requiresHitConfirm?: boolean;
	onHitCancelInto?: string[];
	onBlockCancelInto?: string[];
	onWhiffCancelInto?: string[];
}

export interface AttackFrameData {
	id: string;
	attack: AttackSpec;
	startup: number;
	active: number;
	recovery: number;
	cancelInto?: string[];
	cancelRules?: CancelRule[];
	requiresHitConfirm?: boolean;
	onHitCancelInto?: string[];
	onBlockCancelInto?: string[];
	onWhiffCancelInto?: string[];
	hitstop?: number;
}

export interface FrameActionState {
	actionId: string;
	elapsed: number;
	phase: 'startup' | 'active' | 'recovery' | 'done';
	hasResolvedHit: boolean;
	lastOutcome: CancelOutcome;
}

export interface FrameActionStepResult {
	state: FrameActionState;
	becameActive: boolean;
	canCancel: boolean;
	finished: boolean;
}

export interface CancelRouteResult {
	allowed: boolean;
	routes: string[];
	reason?: 'phase' | 'requires-hit-confirm' | 'not-routed';
}

export function startFrameAction(frameData: AttackFrameData): FrameActionState {
	return {
		actionId: frameData.id,
		elapsed: 0,
		phase: frameData.startup <= 0 ? 'active' : 'startup',
		hasResolvedHit: false,
		lastOutcome: 'none',
	};
}

function phaseFor(frameData: AttackFrameData, elapsed: number): FrameActionState['phase'] {
	if (elapsed < frameData.startup) return 'startup';
	if (elapsed < frameData.startup + frameData.active) return 'active';
	if (elapsed < frameData.startup + frameData.active + frameData.recovery) return 'recovery';
	return 'done';
}

function deterministicRoutes(frameData: AttackFrameData, outcome: CancelOutcome): string[] {
	const routeSet = new Set<string>(frameData.cancelInto ?? []);
	const source = outcome === 'hit' ? frameData.onHitCancelInto : outcome === 'block' ? frameData.onBlockCancelInto : outcome === 'whiff' ? frameData.onWhiffCancelInto : undefined;
	for (const route of source ?? []) routeSet.add(route);
	return [...routeSet].sort((a, b) => a.localeCompare(b));
}

export function stepFrameAction(frameData: AttackFrameData, state: FrameActionState, dt: number): FrameActionStepResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid frame action dt: ${dt}`);
	const previousPhase = state.phase;
	const elapsed = state.elapsed + dt;
	const phase = phaseFor(frameData, elapsed);
	const nextState = { ...state, elapsed, phase };
	return {
		state: nextState,
		becameActive: previousPhase !== 'active' && phase === 'active',
		canCancel: getCancelRoutes(frameData, nextState).allowed,
		finished: phase === 'done',
	};
}

export function getCancelRoutes(frameData: AttackFrameData, state: FrameActionState): CancelRouteResult {
	if (state.phase !== 'recovery') return { allowed: false, routes: [], reason: 'phase' };
	if ((frameData.requiresHitConfirm || frameData.cancelRules?.some((rule) => rule.requiresHitConfirm)) && !state.hasResolvedHit) return { allowed: false, routes: [], reason: 'requires-hit-confirm' };
	const routes = deterministicRoutes(frameData, state.lastOutcome);
	const rules = (frameData.cancelRules ?? []).filter((rule) => (rule.fromPhase ?? 'recovery') === state.phase);
	for (const rule of rules) {
		const source = state.lastOutcome === 'hit' ? rule.onHitCancelInto : state.lastOutcome === 'block' ? rule.onBlockCancelInto : state.lastOutcome === 'whiff' ? rule.onWhiffCancelInto : undefined;
		for (const route of source ?? [rule.into]) routes.push(route);
	}
	const ordered = [...new Set(routes)].sort((a, b) => a.localeCompare(b));
	return ordered.length ? { allowed: true, routes: ordered } : { allowed: false, routes: [], reason: 'not-routed' };
}

export function canCancelInto(frameData: AttackFrameData, state: FrameActionState, nextActionId: string): boolean {
	return getCancelRoutes(frameData, state).routes.includes(nextActionId);
}

export function markFrameActionHitResolved(state: FrameActionState, outcome: Exclude<CancelOutcome, 'none'> = 'hit'): FrameActionState {
	return { ...state, hasResolvedHit: outcome === 'hit', lastOutcome: outcome };
}

import { CombatSystem, type CombatEntity, type CombatEvents } from './CombatSystem';
import {
	markFrameActionHitResolved,
	stepFrameAction,
	type AttackFrameData,
	type FrameActionState,
} from './CombatFrameDataSystem';

export interface CombatFrameExecutorResult {
	state: FrameActionState;
	resolvedHits: number;
	finished: boolean;
	canCancel: boolean;
}

export function stepAndResolveFrameAction(
	frameData: AttackFrameData,
	state: FrameActionState,
	actor: CombatEntity,
	targets: CombatEntity[],
	dt: number,
	time: number,
	events?: CombatEvents
): CombatFrameExecutorResult {
	const stepped = stepFrameAction(frameData, state, dt);
	let nextState = stepped.state;
	let resolvedHits = 0;

	if (nextState.phase === 'active' && !nextState.hasResolvedHit) {
		const result = new CombatSystem().resolveAttack(actor, targets, frameData.attack, events, time);
		resolvedHits = result.hits.filter((event) => event.kind === 'hit' || event.kind === 'kill').length;
		nextState = markFrameActionHitResolved(nextState);
	}

	return {
		state: nextState,
		resolvedHits,
		finished: stepped.finished,
		canCancel: stepped.canCancel,
	};
}

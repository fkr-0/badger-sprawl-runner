import { CombatSystem, type CombatEntity, type CombatEvents } from './CombatSystem';
import type { AttackFrameData, FrameActionState } from './CombatFrameDataSystem';

export interface FrameHitState extends FrameActionState {
	hitTargetIds: string[];
}

export interface FrameHitResult {
	state: FrameHitState;
	resolvedHits: number;
	newTargetIds: string[];
}

export function createFrameHitState(state: FrameActionState): FrameHitState {
	return { ...state, hitTargetIds: [] };
}

export function resolveFrameHits(
	frameData: AttackFrameData,
	state: FrameHitState,
	attacker: CombatEntity,
	targets: readonly CombatEntity[],	time: number,
	events?: CombatEvents
): FrameHitResult {
	if (state.phase !== 'active') return { state: { ...state, hitTargetIds: [...state.hitTargetIds] }, resolvedHits: 0, newTargetIds: [] };
	const alreadyHit = new Set(state.hitTargetIds);
	const eligible = targets
		.filter((target) => target.id && !alreadyHit.has(target.id) && target.hp > 0)
		.sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
	if (eligible.length === 0) return { state: { ...state, hitTargetIds: [...state.hitTargetIds] }, resolvedHits: 0, newTargetIds: [] };

	const result = new CombatSystem().resolveAttack(attacker, eligible, frameData.attack, events, time);
	const newTargetIds = result.hits
		.filter((event) => event.targetId && (event.kind === 'hit' || event.kind === 'kill'))
		.map((event) => event.targetId as string)
		.sort();
	const hitTargetIds = [...new Set([...state.hitTargetIds, ...newTargetIds])].sort();
	return {
		state: { ...state, hitTargetIds, hasResolvedHit: state.hasResolvedHit || newTargetIds.length > 0 },
		resolvedHits: newTargetIds.length,
		newTargetIds,
	};
}

import { CombatSystem, type CombatEntity, type CombatEvents } from './CombatSystem';
import type { AttackFrameData, FrameActionState } from './CombatFrameDataSystem';
import { createHitContactLedger } from '../../../../vendor/arcade-runtime.mjs';

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
	const contacts = createHitContactLedger({ records: state.hitTargetIds });
	const eligible = targets
		.filter(
			(target) =>
				target.id &&
				contacts.canRegister(target.id, time, { maxHitsPerTarget: 1 }) &&
				target.hp > 0
		)
		.sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
	if (eligible.length === 0) return { state: { ...state, hitTargetIds: [...state.hitTargetIds] }, resolvedHits: 0, newTargetIds: [] };

	const result = new CombatSystem().resolveAttack(attacker, eligible, frameData.attack, events, time);
	const newTargetIds = result.hits
		.filter((event) => event.targetId && (event.kind === 'hit' || event.kind === 'kill'))
		.map((event) => event.targetId as string)
		.sort();
	for (const targetId of newTargetIds) contacts.register(targetId, time);
	const hitTargetIds = contacts.targetIds();
	return {
		state: { ...state, hitTargetIds, hasResolvedHit: state.hasResolvedHit || newTargetIds.length > 0 },
		resolvedHits: newTargetIds.length,
		newTargetIds,
	};
}

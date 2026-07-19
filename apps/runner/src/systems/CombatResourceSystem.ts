export type CombatResourceKind = 'stamina' | 'heat' | 'focus' | 'ammo';

import {
	canPayResourceCosts as runtimeCanPayResourceCosts,
	createResourcePoolState,
	payResourceCosts as runtimePayResourceCosts,
	stepResourcePools,
	type ArcadeResourceEvent,
	type ArcadeResourcePoolState,
} from '../../../../vendor/arcade-runtime.mjs';

export interface CombatResourcePool {
	kind: CombatResourceKind;
	value: number;
	max: number;
	regenPerSecond: number;
	decayPerSecond?: number;
}

export interface CombatResourceState {
	ownerId: string;
	pools: CombatResourcePool[];
}

export interface ResourceCost {
	kind: CombatResourceKind;
	amount: number;
}

export interface ResourceEvent {
	kind: 'spent' | 'blocked' | 'regenerated' | 'decayed';
	ownerId: string;
	resource: CombatResourceKind;
	amount: number;
}

function toRuntimeState(state: CombatResourceState): ArcadeResourcePoolState {
	return createResourcePoolState(
		state.ownerId,
		state.pools.map((pool) => ({
			id: pool.kind,
			value: pool.value,
			max: pool.max,
			regenPerUnit: pool.regenPerSecond,
			decayPerUnit: pool.decayPerSecond ?? 0,
		}))
	);
}

function fromRuntimeState(state: ArcadeResourcePoolState): CombatResourceState {
	return {
		ownerId: state.ownerId,
		pools: state.pools.map((pool) => ({
			kind: pool.id as CombatResourceKind,
			value: pool.value,
			max: pool.max,
			regenPerSecond: pool.regenPerUnit,
			...(pool.decayPerUnit > 0 ? { decayPerSecond: pool.decayPerUnit } : {}),
		})),
	};
}

function fromRuntimeEvent(event: ArcadeResourceEvent): ResourceEvent {
	return {
		kind: event.kind as ResourceEvent['kind'],
		ownerId: event.ownerId,
		resource: event.resourceId as CombatResourceKind,
		amount: event.amount,
	};
}

export function stepCombatResources(state: CombatResourceState, dt: number): { state: CombatResourceState; events: ResourceEvent[] } {
	const stepped = stepResourcePools(toRuntimeState(state), dt);
	return {
		state: fromRuntimeState(stepped.state),
		events: stepped.events.map(fromRuntimeEvent),
	};
}

export function canPayResourceCosts(state: CombatResourceState, costs: readonly ResourceCost[]): boolean {
	return runtimeCanPayResourceCosts(toRuntimeState(state), costs);
}

export function payResourceCosts(state: CombatResourceState, costs: readonly ResourceCost[]): { state: CombatResourceState; events: ResourceEvent[]; ok: boolean } {
	const paid = runtimePayResourceCosts(toRuntimeState(state), costs);
	return {
		state: fromRuntimeState(paid.state),
		events: paid.events.map(fromRuntimeEvent),
		ok: paid.ok,
	};
}

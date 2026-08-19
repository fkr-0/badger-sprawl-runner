import {
	createGameplayActionState,
	createResourcePoolState,
	stepGameplayActionState as runtimeStepGameplayActionState,
	tryStartGameplayAction,
} from '@arcade/runtime/gameplay';
import type {
	ArcadeGameplayActionEvent,
	ArcadeGameplayActionState,
	ArcadeResourceEvent,
} from '@arcade/runtime/gameplay';
import type { CombatResourceState, ResourceCost, ResourceEvent } from './CombatResourceSystem';

export interface CombatActionDefinition {
	id: string;
	cooldown: number;
	costs: ResourceCost[];
	queueWindow?: number;
	cancelTags?: string[];
}

function toRuntimeResources(resources: CombatResourceState) {
	return createResourcePoolState(
		resources.ownerId,
		resources.pools.map((pool) => ({
			id: pool.kind,
			value: pool.value,
			max: pool.max,
			regenPerUnit: pool.regenPerSecond,
			decayPerUnit: pool.decayPerSecond ?? 0,
		}))
	);
}

function fromRuntimeResources(resources: ArcadeGameplayActionState['resources']): CombatResourceState {
	return {
		ownerId: resources.ownerId,
		pools: resources.pools.map((pool) => ({
			kind: pool.id as CombatResourceState['pools'][number]['kind'],
			value: pool.value,
			max: pool.max,
			regenPerSecond: pool.regenPerUnit,
			...(pool.decayPerUnit > 0 ? { decayPerSecond: pool.decayPerUnit } : {}),
		})),
	};
}

function toRuntimeState(state: CombatActionState): ArcadeGameplayActionState {
	return createGameplayActionState(state.ownerId, toRuntimeResources(state.resources), {
		cooldowns: state.cooldowns,
		queuedActionId: state.queuedActionId ?? null,
		queueRemaining: state.queueTimer ?? 0,
	});
}

function fromRuntimeState(state: ArcadeGameplayActionState): CombatActionState {
	return {
		ownerId: state.ownerId,
		cooldowns: { ...state.cooldowns },
		resources: fromRuntimeResources(state.resources),
		...(state.queuedActionId ? { queuedActionId: state.queuedActionId } : {}),
		...(state.queuedActionId ? { queueTimer: state.queueRemaining } : {}),
	};
}

function fromRuntimeResourceEvent(event: ArcadeResourceEvent): ResourceEvent {
	return {
		kind: event.kind as ResourceEvent['kind'],
		ownerId: event.ownerId,
		resource: event.resourceId as ResourceEvent['resource'],
		amount: event.amount,
	};
}

function fromRuntimeEvent(event: ArcadeGameplayActionEvent): CombatActionEvent {
	return {
		kind: event.kind,
		ownerId: event.ownerId,
		...(event.actionId ? { actionId: event.actionId } : {}),
		...(event.resourceEvent
			? { resourceEvent: fromRuntimeResourceEvent(event.resourceEvent) }
			: {}),
	};
}

export interface CombatActionState {
	ownerId: string;
	cooldowns: Record<string, number>;
	resources: CombatResourceState;
	queuedActionId?: string;
	queueTimer?: number;
}

export interface CombatActionEvent {
	kind: 'started' | 'cooldown' | 'blocked' | 'queued' | 'queue-expired' | 'resource';
	ownerId: string;
	actionId?: string;
	resourceEvent?: ResourceEvent;
}

export function createCombatActionState(ownerId: string, resources: CombatResourceState): CombatActionState {
	return fromRuntimeState(createGameplayActionState(ownerId, toRuntimeResources(resources)));
}

export function stepCombatActionState(state: CombatActionState, dt: number): { state: CombatActionState; events: CombatActionEvent[] } {
	const stepped = runtimeStepGameplayActionState(toRuntimeState(state), dt);
	return {
		state: fromRuntimeState(stepped.state),
		events: stepped.events.map(fromRuntimeEvent),
	};
}

export function tryStartCombatAction(
	state: CombatActionState,
	action: CombatActionDefinition,
	options: { queueIfBlocked?: boolean } = {}
): { state: CombatActionState; events: CombatActionEvent[]; ok: boolean } {
	const started = tryStartGameplayAction(toRuntimeState(state), action, options);
	return {
		state: fromRuntimeState(started.state),
		events: started.events.map(fromRuntimeEvent),
		ok: started.ok,
	};
}

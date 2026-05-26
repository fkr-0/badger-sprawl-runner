import { payResourceCosts, stepCombatResources, type CombatResourceState, type ResourceCost, type ResourceEvent } from './CombatResourceSystem';

export interface CombatActionDefinition {
	id: string;
	cooldown: number;
	costs: ResourceCost[];
	queueWindow?: number;
	cancelTags?: string[];
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
	return { ownerId, cooldowns: {}, resources: { ownerId: resources.ownerId, pools: resources.pools.map((pool) => ({ ...pool })) } };
}

export function stepCombatActionState(state: CombatActionState, dt: number): { state: CombatActionState; events: CombatActionEvent[] } {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid combat action dt: ${dt}`);
	const resourceStep = stepCombatResources(state.resources, dt);
	const cooldowns = Object.fromEntries(
		Object.entries(state.cooldowns)
			.map(([id, value]) => [id, Math.max(0, value - dt)])
			.filter(([, value]) => value > 0)
	);
	const queueTimer = Math.max(0, (state.queueTimer ?? 0) - dt);
	const expired = state.queuedActionId && queueTimer === 0;
	return {
		state: {
			ownerId: state.ownerId,
			cooldowns,
			resources: resourceStep.state,
			queuedActionId: expired ? undefined : state.queuedActionId,
			queueTimer: expired ? undefined : queueTimer,
		},
		events: [
			...resourceStep.events.map((resourceEvent) => ({ kind: 'resource' as const, ownerId: state.ownerId, resourceEvent })),
			...(expired ? [{ kind: 'queue-expired' as const, ownerId: state.ownerId, actionId: state.queuedActionId }] : []),
		],
	};
}

export function tryStartCombatAction(
	state: CombatActionState,
	action: CombatActionDefinition,
	options: { queueIfBlocked?: boolean } = {}
): { state: CombatActionState; events: CombatActionEvent[]; ok: boolean } {
	if ((state.cooldowns[action.id] ?? 0) > 0) {
		if (options.queueIfBlocked && action.queueWindow) {
			return {
				state: { ...state, queuedActionId: action.id, queueTimer: action.queueWindow },
				events: [{ kind: 'queued', ownerId: state.ownerId, actionId: action.id }],
				ok: false,
			};
		}
		return { state: { ...state }, events: [{ kind: 'cooldown', ownerId: state.ownerId, actionId: action.id }], ok: false };
	}

	const paid = payResourceCosts(state.resources, action.costs);
	if (!paid.ok) {
		return {
			state: { ...state, resources: paid.state },
			events: [
				{ kind: 'blocked', ownerId: state.ownerId, actionId: action.id },
				...paid.events.map((resourceEvent) => ({ kind: 'resource' as const, ownerId: state.ownerId, actionId: action.id, resourceEvent })),
			],
			ok: false,
		};
	}

	return {
		state: {
			ownerId: state.ownerId,
			cooldowns: { ...state.cooldowns, [action.id]: action.cooldown },
			resources: paid.state,
			queuedActionId: undefined,
			queueTimer: undefined,
		},
		events: [
			{ kind: 'started', ownerId: state.ownerId, actionId: action.id },
			...paid.events.map((resourceEvent) => ({ kind: 'resource' as const, ownerId: state.ownerId, actionId: action.id, resourceEvent })),
		],
		ok: true,
	};
}

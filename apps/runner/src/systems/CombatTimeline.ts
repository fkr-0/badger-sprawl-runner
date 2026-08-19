import {
	createTimelineQueue,
	enqueueTimelineEntry,
	stepTimelineQueue,
} from '@arcade/runtime/core';
import type { TimelineQueueState } from '@arcade/runtime/core';
import type { CombatEntity, CombatEvents } from './CombatSystem';
import { type AttackSpec, CombatSystem } from './CombatSystem';
import type { MeleeInput } from './MeleeComboSystem';

export type TimelineAction =
	| { kind: 'wait'; duration: number; at?: number }
	| { kind: 'melee'; actorId: string; input: MeleeInput; at: number }
	| { kind: 'attack'; actorId: string; targetIds: string[]; attack: AttackSpec; at: number }
	| { kind: 'parry'; actorId: string; at: number }
	| { kind: 'dodge'; actorId: string; at: number };

export interface TimelineState {
	time: number;
	actions: TimelineAction[];
}

export interface TimelineResult {
	state: TimelineState;
	actors: CombatEntity[];
	processed: TimelineAction[];
}

const runtimeQueues = new WeakMap<TimelineState, TimelineQueueState<TimelineAction>>();

function normalizeAction(action: TimelineAction, now: number): TimelineAction {
	if (action.kind !== 'wait' || action.at !== undefined) return action;
	return { ...action, at: now + action.duration };
}

function actionAt(action: TimelineAction, now: number): number {
	return action.kind === 'wait' ? (action.at ?? now + action.duration) : action.at;
}

function wrapRuntimeQueue(queue: TimelineQueueState<TimelineAction>): TimelineState {
	const state: TimelineState = {
		time: queue.time,
		actions: queue.entries.map((entry) => entry.value),
	};
	runtimeQueues.set(state, queue);
	return state;
}

function getRuntimeQueue(state: TimelineState): TimelineQueueState<TimelineAction> {
	return (
		runtimeQueues.get(state) ??
		createTimelineQueue(
			state.actions.map((action) => normalizeAction(action, state.time)),
			{
				time: state.time,
				getAt: (action) => actionAt(action, state.time),
			}
		)
	);
}

function byId(actors: CombatEntity[], id: string): CombatEntity | undefined {
	return actors.find((actor) => actor.id === id);
}

function targetsById(actors: CombatEntity[], ids: readonly string[]): CombatEntity[] {
	const idSet = new Set(ids);
	return actors.filter((actor) => actor.id && idSet.has(actor.id));
}

export function createCombatTimeline(actions: readonly TimelineAction[] = []): TimelineState {
	return wrapRuntimeQueue(
		createTimelineQueue(
			actions.map((action) => normalizeAction(action, 0)),
			{
				time: 0,
				getAt: (action) => actionAt(action, 0),
			}
		)
	);
}

export function enqueueTimelineAction(state: TimelineState, action: TimelineAction): TimelineState {
	const normalized = normalizeAction(action, state.time);
	return wrapRuntimeQueue(
		enqueueTimelineEntry(getRuntimeQueue(state), normalized, {
			at: actionAt(normalized, state.time),
		})
	);
}

export function stepCombatTimeline(
	state: TimelineState,
	actors: CombatEntity[],
	dt: number,
	events?: CombatEvents
): TimelineResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid combat timeline dt: ${dt}`);
	const combat = new CombatSystem();
	const advanced = stepTimelineQueue(getRuntimeQueue(state), dt);
	const processed = [...advanced.due];

	for (const action of processed) {
		if (action.kind === 'wait') continue;
		const actor = byId(actors, action.actorId);
		if (!actor) continue;

		if (action.kind === 'melee') {
			combat.meleeInput(
				actor,
				actors.filter((target) => target !== actor),
				action.input,
				events,
				action.at
			);
		} else if (action.kind === 'attack') {
			combat.resolveAttack(
				actor,
				targetsById(actors, action.targetIds),
				action.attack,
				events,
				action.at
			);
		} else if (action.kind === 'parry') {
			combat.step(
				actor,
				actors.filter((target) => target !== actor),
				{ parryPressed: true },
				0,
				events,
				{ time: action.at }
			);
		} else if (action.kind === 'dodge') {
			combat.step(
				actor,
				actors.filter((target) => target !== actor),
				{ dodgePressed: true },
				0,
				events,
				{ time: action.at }
			);
		}
	}

	return {
		state: wrapRuntimeQueue(advanced.state),
		actors,
		processed,
	};
}

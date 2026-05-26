import type { CombatEntity, CombatEvents } from './CombatSystem';
import { CombatSystem, type AttackSpec } from './CombatSystem';
import type { MeleeInput } from './MeleeComboSystem';

export type TimelineAction =
	| { kind: 'wait'; duration: number }
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

function actionAt(action: TimelineAction, now: number): number {
	return action.kind === 'wait' ? now + action.duration : action.at;
}

function sortActions(actions: readonly TimelineAction[], now: number): TimelineAction[] {
	return [...actions].sort((a, b) => actionAt(a, now) - actionAt(b, now));
}

function byId(actors: CombatEntity[], id: string): CombatEntity | undefined {
	return actors.find((actor) => actor.id === id);
}

function targetsById(actors: CombatEntity[], ids: readonly string[]): CombatEntity[] {
	const idSet = new Set(ids);
	return actors.filter((actor) => actor.id && idSet.has(actor.id));
}

export function createCombatTimeline(actions: readonly TimelineAction[] = []): TimelineState {
	return { time: 0, actions: sortActions(actions, 0) };
}

export function enqueueTimelineAction(state: TimelineState, action: TimelineAction): TimelineState {
	return { time: state.time, actions: sortActions([...state.actions, action], state.time) };
}

export function stepCombatTimeline(
	state: TimelineState,
	actors: CombatEntity[],
	dt: number,
	events?: CombatEvents
): TimelineResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid combat timeline dt: ${dt}`);
	const combat = new CombatSystem();
	const nextTime = state.time + dt;
	const processed: TimelineAction[] = [];
	const remaining: TimelineAction[] = [];

	for (const action of state.actions) {
		const at = actionAt(action, state.time);
		if (at > nextTime) {
			remaining.push(action);
			continue;
		}

		processed.push(action);
		if (action.kind === 'wait') continue;
		const actor = byId(actors, action.actorId);
		if (!actor) continue;

		if (action.kind === 'melee') {
			combat.meleeInput(actor, actors.filter((target) => target !== actor), action.input, events, action.at);
		} else if (action.kind === 'attack') {
			combat.resolveAttack(actor, targetsById(actors, action.targetIds), action.attack, events, action.at);
		} else if (action.kind === 'parry') {
			combat.step(actor, actors.filter((target) => target !== actor), { parryPressed: true }, 0, events, { time: action.at });
		} else if (action.kind === 'dodge') {
			combat.step(actor, actors.filter((target) => target !== actor), { dodgePressed: true }, 0, events, { time: action.at });
		}
	}

	return {
		state: { time: nextTime, actions: sortActions(remaining, nextTime) },
		actors,
		processed,
	};
}

import { createDeterministicRng, rngRange, type DeterministicRngState } from '@badger/platformer-core';
import type { CombatEvent } from './CombatSystem';
import type { StatusEffect } from './StatusEffectSystem';

export interface ItemProcDefinition {
	id: string;
	itemId: string;
	triggerKinds: CombatEvent['kind'][];
	chance: number;
	cooldown?: number;
	effects?: Record<string, number | boolean | string>;
	statusOnProc?: StatusEffect[];
}

export interface ItemProcState {
	procId: string;
	cooldownLeft: number;
	triggers: number;
}

export interface ItemProcEvent {
	kind: 'proc' | 'miss' | 'cooldown';
	procId: string;
	itemId: string;
	triggerKind: CombatEvent['kind'];
	roll?: number;
	effects?: Record<string, number | boolean | string>;
	statusOnProc?: StatusEffect[];
}

export interface ItemProcRuntime {
	definition: ItemProcDefinition;
	state: ItemProcState;
}

export interface ItemProcStepResult {
	runtime: ItemProcRuntime[];
	events: ItemProcEvent[];
	rng: DeterministicRngState;
}

export function createItemProcRuntime(definition: ItemProcDefinition): ItemProcRuntime {
	return { definition: { ...definition, effects: definition.effects ? { ...definition.effects } : undefined, statusOnProc: definition.statusOnProc?.map((status) => ({ ...status })) }, state: { procId: definition.id, cooldownLeft: 0, triggers: 0 } };
}

export function createItemProcRng(seed: string, runId: string): DeterministicRngState {
	return createDeterministicRng(`item-proc:${seed}:${runId}`);
}

function stepCooldown(runtime: ItemProcRuntime, dt: number): ItemProcRuntime {
	return {
		definition: runtime.definition,
		state: { ...runtime.state, cooldownLeft: Math.max(0, runtime.state.cooldownLeft - dt) },
	};
}

export function resolveItemProcs(
	runtime: readonly ItemProcRuntime[],
	combatEvents: readonly CombatEvent[],
	rng: DeterministicRngState,
	dt: number
): ItemProcStepResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid proc dt: ${dt}`);
	let nextRng = rng;
	let nextRuntime = runtime.map((entry) => stepCooldown(entry, dt));
	const events: ItemProcEvent[] = [];
	const sortedCombatEvents = [...combatEvents].sort((a, b) => (a.time ?? 0) - (b.time ?? 0) || a.kind.localeCompare(b.kind) || (a.moveId ?? '').localeCompare(b.moveId ?? ''));

	for (const combatEvent of sortedCombatEvents) {
		nextRuntime = nextRuntime.map((entry) => {
			if (!entry.definition.triggerKinds.includes(combatEvent.kind)) return entry;
			if (entry.state.cooldownLeft > 0) {
				events.push({ kind: 'cooldown', procId: entry.definition.id, itemId: entry.definition.itemId, triggerKind: combatEvent.kind });
				return entry;
			}

			const roll = rngRange(nextRng, 0, 1);
			nextRng = roll.state;
			const normalizedRoll = Number(roll.value.toFixed(6));
			if (roll.value <= entry.definition.chance) {
				events.push({
					kind: 'proc',
					procId: entry.definition.id,
					itemId: entry.definition.itemId,
					triggerKind: combatEvent.kind,
					roll: normalizedRoll,
					effects: entry.definition.effects ? { ...entry.definition.effects } : undefined,
					statusOnProc: entry.definition.statusOnProc?.map((status) => ({ ...status })),
				});
				return {
					definition: entry.definition,
					state: { procId: entry.state.procId, triggers: entry.state.triggers + 1, cooldownLeft: entry.definition.cooldown ?? 0 },
				};
			}

			events.push({ kind: 'miss', procId: entry.definition.id, itemId: entry.definition.itemId, triggerKind: combatEvent.kind, roll: normalizedRoll });
			return entry;
		});
	}

	return { runtime: nextRuntime, events, rng: nextRng };
}

import { deterministicHash, rngRange, type DeterministicRngState } from '@badger/platformer-core';
import type { CombatEvent } from './CombatSystem';
import type { StatusEffect } from './StatusEffectSystem';

export type ConditionalTrigger = 'airborne' | 'perfect-dodge' | 'third-hit' | 'parry';

export interface ConditionalEffectDefinition {
	id: string;
	itemId: string;
	trigger: ConditionalTrigger;
	effects: Record<string, number | string | boolean>;
	cooldown?: number;
	chance?: number;
	statusOnTrigger?: StatusEffect[];
}

export interface ConditionalEffectState {
	effectId: string;
	cooldownLeft: number;
	hitCounter: number;
}

export interface ConditionalActorState {
	onGround: boolean;
}

export interface ConditionalEffectRuntime {
	definition: ConditionalEffectDefinition;
	state: ConditionalEffectState;
}

export interface ConditionalEffectEvent {
	kind: 'triggered' | 'cooldown' | 'ignored';
	effectId: string;
	itemId: string;
	trigger: ConditionalTrigger;
	effects?: Record<string, number | string | boolean>;
	roll?: number;
	statusOnTrigger?: StatusEffect[];
}

export interface ConditionalEffectStepResult {
	runtime: ConditionalEffectRuntime[];
	events: ConditionalEffectEvent[];
	replayHash: string;
	rng?: DeterministicRngState;
}

export function createConditionalEffectRuntime(definition: ConditionalEffectDefinition): ConditionalEffectRuntime {
	return {
		definition: {
			...definition,
			effects: { ...definition.effects },
			statusOnTrigger: definition.statusOnTrigger?.map((status) => ({ ...status })),
		},
		state: { effectId: definition.id, cooldownLeft: 0, hitCounter: 0 },
	};
}

function cloneStatus(status: readonly StatusEffect[] | undefined): StatusEffect[] | undefined {
	return status?.map((entry) => ({ ...entry }));
}

function matches(trigger: ConditionalTrigger, combatEvent: CombatEvent | undefined, actor: ConditionalActorState): boolean {
	if (trigger === 'airborne') return !actor.onGround && combatEvent?.kind === 'hit';
	if (trigger === 'perfect-dodge') return combatEvent?.kind === 'dodge';
	if (trigger === 'parry') return combatEvent?.kind === 'parry';
	if (trigger === 'third-hit') return combatEvent?.kind === 'hit';
	return false;
}

function resolveChance(entry: ConditionalEffectRuntime, rng: DeterministicRngState | undefined): { passed: boolean; roll?: number; rng?: DeterministicRngState } {
	const chance = entry.definition.chance;
	if (chance === undefined) return { passed: true, rng };
	if (!Number.isFinite(chance) || chance < 0 || chance > 1) throw new Error(`Invalid conditional chance: ${chance}`);
	if (!rng) throw new Error(`Missing conditional effect rng for ${entry.definition.id}`);
	const roll = rngRange(rng, 0, 1);
	return { passed: roll.value <= chance, roll: Number(roll.value.toFixed(6)), rng: roll.state };
}

export function resolveConditionalItemEffects(
	runtime: readonly ConditionalEffectRuntime[],
	combatEvents: readonly CombatEvent[],
	actor: ConditionalActorState,
	dt: number,
	rng?: DeterministicRngState
): ConditionalEffectStepResult {
	if (!Number.isFinite(dt) || dt < 0) throw new Error(`Invalid conditional effect dt: ${dt}`);
	let nextRng = rng;
	let next = runtime.map((entry) => ({ definition: entry.definition, state: { ...entry.state, cooldownLeft: Math.max(0, Number((entry.state.cooldownLeft - dt).toFixed(6))) } }));
	const events: ConditionalEffectEvent[] = [];
	const sortedEvents = [...combatEvents].sort((a, b) => (a.time ?? 0) - (b.time ?? 0) || a.kind.localeCompare(b.kind) || (a.moveId ?? '').localeCompare(b.moveId ?? ''));
	for (const combatEvent of sortedEvents) {
		next = next.map((entry) => {
			if (!matches(entry.definition.trigger, combatEvent, actor)) return entry;
			const hitCounter = entry.definition.trigger === 'third-hit' ? entry.state.hitCounter + 1 : entry.state.hitCounter;
			if (entry.state.cooldownLeft > 0) {
				events.push({ kind: 'cooldown', effectId: entry.definition.id, itemId: entry.definition.itemId, trigger: entry.definition.trigger });
				return { definition: entry.definition, state: { ...entry.state, hitCounter } };
			}
			if (entry.definition.trigger === 'third-hit' && hitCounter % 3 !== 0) {
				events.push({ kind: 'ignored', effectId: entry.definition.id, itemId: entry.definition.itemId, trigger: entry.definition.trigger });
				return { definition: entry.definition, state: { ...entry.state, hitCounter } };
			}
			const chance = resolveChance(entry, nextRng);
			nextRng = chance.rng;
			if (!chance.passed) {
				events.push({ kind: 'ignored', effectId: entry.definition.id, itemId: entry.definition.itemId, trigger: entry.definition.trigger, roll: chance.roll });
				return { definition: entry.definition, state: { ...entry.state, hitCounter } };
			}
			events.push({
				kind: 'triggered',
				effectId: entry.definition.id,
				itemId: entry.definition.itemId,
				trigger: entry.definition.trigger,
				effects: { ...entry.definition.effects },
				roll: chance.roll,
				statusOnTrigger: cloneStatus(entry.definition.statusOnTrigger),
			});
			return { definition: entry.definition, state: { effectId: entry.state.effectId, hitCounter, cooldownLeft: entry.definition.cooldown ?? 0 } };
		});
	}
	const replayHash = deterministicHash({ runtime: next, events, rng: nextRng });
	return { runtime: next, events, replayHash, rng: nextRng };
}

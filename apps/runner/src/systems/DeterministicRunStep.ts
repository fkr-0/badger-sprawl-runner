import {
	deterministicHash,
	stepPhysicsWorld,
	type FluidField,
	type PhysicsParams,
	type PhysicsWorldState,
	type ProjectileHit,
} from '@badger/platformer-core';
import type { CombatEntity, CombatEvent } from './CombatSystem';
import { resolveMaterialEventsAsCombat } from './PhysicsCombatBridge';
import { resolveProjectileHitsAsCombat } from './ProjectileCombatBridge';
import type { StatusEffect } from './StatusEffectSystem';
import {
	stepItemUseState,
	useItem,
	type ItemUseDefinition,
	type ItemUseEvent,
	type ItemUseState,
} from './ItemUseSystem';

export interface DeterministicItemRuntime {
	actorId: string;
	definition: ItemUseDefinition;
	state: ItemUseState;
	requestedUse?: boolean;
}

export interface DeterministicRunState {
	physics: PhysicsWorldState;
	combatants: CombatEntity[];
	items: DeterministicItemRuntime[];
	tick: number;
	time: number;
}

export interface DeterministicRunStepInput {
	state: DeterministicRunState;
	params: PhysicsParams;
	dt: number;
	fluid?: FluidField;
	projectileAttackerId?: string;
	statusByProjectileKind?: Partial<Record<ProjectileHit['kind'], StatusEffect[]>>;
	statusByMaterialTag?: Partial<Record<string, StatusEffect[]>>;
}

export interface DeterministicRunStepOutput {
	state: DeterministicRunState;
	combatEvents: CombatEvent[];
	itemEvents: ItemUseEvent[];
	frameHash: string;
}

function cloneCombatant(combatant: CombatEntity): CombatEntity {
	return {
		...combatant,
		itemSetEffects: combatant.itemSetEffects ? { ...combatant.itemSetEffects } : undefined,
		statusEffects: combatant.statusEffects?.map((status) => ({ ...status })),
		unlockedSkills: combatant.unlockedSkills ? [...combatant.unlockedSkills] : undefined,
		procgenAffixes: combatant.procgenAffixes ? [...combatant.procgenAffixes] : undefined,
	};
}

function syncCombatantsFromPhysics(physics: PhysicsWorldState, combatants: CombatEntity[]): CombatEntity[] {
	const actors = new Map(physics.actors.map((actor) => [actor.id, actor]));
	return combatants.map((combatant) => {
		const actor = combatant.id ? actors.get(combatant.id) : undefined;
		if (!actor) return combatant;
		return {
			...combatant,
			x: actor.x,
			y: actor.y,
			w: actor.w,
			h: actor.h,
			vx: actor.vx,
			vy: actor.vy,
			dir: actor.dir,
			onGround: actor.onGround,
			coyoteLeft: actor.coyoteLeft,
			jumpBuffered: actor.jumpBuffered,
		};
	});
}

function applyItemEventToCombatant(combatant: CombatEntity, event: ItemUseEvent): CombatEntity {
	if (event.kind !== 'used' || !event.effects) return combatant;
	let next = { ...combatant };
	const heal = event.effects.heal;
	if (typeof heal === 'number') next.hp = Math.min(next.maxHp, next.hp + heal);
	if (event.effects.shield === true) next.invuln = Math.max(next.invuln, 0.5);
	if (typeof event.effects.stunClear === 'number') next.stun = Math.max(0, next.stun - event.effects.stunClear);
	return next;
}

function processItems(
	items: DeterministicItemRuntime[],
	combatants: CombatEntity[],
	dt: number,
	time: number
): { items: DeterministicItemRuntime[]; combatants: CombatEntity[]; events: ItemUseEvent[] } {
	const events: ItemUseEvent[] = [];
	let nextCombatants = combatants;
	const nextItems = items.map((item) => {
		const stepped = stepItemUseState(item.definition, item.state, dt, time);
		let state = stepped.state;
		events.push(...stepped.events);

		if (item.requestedUse) {
			const used = useItem(item.definition, state, time);
			state = used.state;
			events.push(used.event);
			if (used.event.kind === 'used') {
				nextCombatants = nextCombatants.map((combatant) =>
					combatant.id === item.actorId ? applyItemEventToCombatant(combatant, used.event) : combatant
				);
			}
		}

		return { ...item, requestedUse: false, state };
	});

	return { items: nextItems, combatants: nextCombatants, events };
}

export function stepDeterministicRun(input: DeterministicRunStepInput): DeterministicRunStepOutput {
	if (!Number.isFinite(input.dt) || input.dt < 0) throw new Error(`Invalid run dt: ${input.dt}`);
	const nextTime = input.state.time + input.dt;
	const combatEvents: CombatEvent[] = [];
	const events = { onEvent: (event: CombatEvent) => combatEvents.push(event) };

	const physicsStep = stepPhysicsWorld({
		world: input.state.physics,
		params: input.params,
		dt: input.dt,
		fluid: input.fluid,
	});

	let combatants = syncCombatantsFromPhysics(physicsStep.world, input.state.combatants.map(cloneCombatant));
	const itemResult = processItems(input.state.items, combatants, input.dt, nextTime);
	combatants = itemResult.combatants;

	resolveMaterialEventsAsCombat({
		materialEvents: physicsStep.materialEvents,
		combatants,
		time: nextTime,
		events,
		statusByMaterialTag: input.statusByMaterialTag,
	});

	const attacker = combatants.find((combatant) => combatant.id === input.projectileAttackerId) ?? combatants[0];
	if (attacker && physicsStep.projectileHits.length > 0) {
		resolveProjectileHitsAsCombat({
			attacker,
			targets: combatants,
			hits: physicsStep.projectileHits,
			time: nextTime,
			events,
			statusByProjectileKind: input.statusByProjectileKind,
		});
	}

	const state: DeterministicRunState = {
		physics: physicsStep.world,
		combatants,
		items: itemResult.items,
		tick: input.state.tick + 1,
		time: nextTime,
	};

	return {
		state,
		combatEvents,
		itemEvents: itemResult.events,
		frameHash: deterministicHash(state),
	};
}

import {
	deterministicHash,
	stepPhysicsWorld,
	type FluidField,
	type PhysicsParams,
	type PhysicsWorldState,
	type ProjectileHit,
} from '@badger/platformer-core';
import {
	createSystemPipeline,
	type SystemPipelineSnapshot,
} from '../../../../vendor/arcade-runtime.mjs';
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

type PhysicsStepResult = ReturnType<typeof stepPhysicsWorld>;
type ItemProcessResult = ReturnType<typeof processItems>;

interface DeterministicRunPipelineContext {
	input: DeterministicRunStepInput;
	nextTime: number;
	combatEvents: CombatEvent[];
	events: { onEvent: (event: CombatEvent) => void };
	physicsStep?: PhysicsStepResult;
	combatants: CombatEntity[];
	itemResult?: ItemProcessResult;
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
	const next = { ...combatant };
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

const deterministicRunPipeline = createSystemPipeline<DeterministicRunPipelineContext>({
	phases: ['physics', 'state', 'contacts'],
});

deterministicRunPipeline.add(
	'physics-world',
	(context) => {
		context.physicsStep = stepPhysicsWorld({
			world: context.input.state.physics,
			params: context.input.params,
			dt: context.input.dt,
			fluid: context.input.fluid,
		});
	},
	{ phase: 'physics' }
);
deterministicRunPipeline.add(
	'sync-combatants',
	(context) => {
		if (!context.physicsStep) throw new Error('Missing deterministic physics step');
		context.combatants = syncCombatantsFromPhysics(
			context.physicsStep.world,
			context.input.state.combatants.map(cloneCombatant)
		);
	},
	{ phase: 'state' }
);
deterministicRunPipeline.add(
	'item-state',
	(context) => {
		context.itemResult = processItems(
			context.input.state.items,
			context.combatants,
			context.input.dt,
			context.nextTime
		);
		context.combatants = context.itemResult.combatants;
	},
	{ phase: 'state', after: 'sync-combatants' }
);
deterministicRunPipeline.add(
	'material-contacts',
	(context) => {
		if (!context.physicsStep) throw new Error('Missing deterministic physics step');
		resolveMaterialEventsAsCombat({
			materialEvents: context.physicsStep.materialEvents,
			combatants: context.combatants,
			time: context.nextTime,
			events: context.events,
			statusByMaterialTag: context.input.statusByMaterialTag,
		});
	},
	{ phase: 'contacts' }
);
deterministicRunPipeline.add(
	'projectile-contacts',
	(context) => {
		if (!context.physicsStep) throw new Error('Missing deterministic physics step');
		const attacker =
			context.combatants.find(
				(combatant) => combatant.id === context.input.projectileAttackerId
			) ?? context.combatants[0];
		if (!attacker || context.physicsStep.projectileHits.length === 0) return;
		resolveProjectileHitsAsCombat({
			attacker,
			targets: context.combatants,
			hits: context.physicsStep.projectileHits,
			time: context.nextTime,
			events: context.events,
			statusByProjectileKind: context.input.statusByProjectileKind,
		});
	},
	{ phase: 'contacts', after: 'material-contacts' }
);

export function getDeterministicRunPipelineSnapshot(): SystemPipelineSnapshot {
	return deterministicRunPipeline.snapshot();
}

export function stepDeterministicRun(input: DeterministicRunStepInput): DeterministicRunStepOutput {
	if (!Number.isFinite(input.dt) || input.dt < 0) throw new Error(`Invalid run dt: ${input.dt}`);
	const nextTime = input.state.time + input.dt;
	const combatEvents: CombatEvent[] = [];
	const events = { onEvent: (event: CombatEvent) => combatEvents.push(event) };
	const context: DeterministicRunPipelineContext = {
		input,
		nextTime,
		combatEvents,
		events,
		combatants: [],
	};
	deterministicRunPipeline.run(context);
	if (!context.physicsStep || !context.itemResult) {
		throw new Error('Deterministic run pipeline did not produce a complete frame');
	}

	const state: DeterministicRunState = {
		physics: context.physicsStep.world,
		combatants: context.combatants,
		items: context.itemResult.items,
		tick: input.state.tick + 1,
		time: nextTime,
	};

	return {
		state,
		combatEvents,
		itemEvents: context.itemResult.events,
		frameHash: deterministicHash(state),
	};
}

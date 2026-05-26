import type { PhysicsParams } from '../PhysicsParams';
import type { Rect } from '../types';
import type { DeterministicRngState } from './deterministicRng';
import type { FluidField } from './flyingObjectStep';
import { movementStep } from './movementStep';
import { gravityStep } from './gravityStep';
import { platformStep } from './platformStep';
import { coyoteStep } from './coyoteStep';
import { stepProjectiles, type ProjectileHit, type ProjectileState } from './projectileStep';
import { applySurfaceMaterial, type MaterialZone } from './materialPhysics';

export interface PhysicsActorState extends Rect {
	id: string;
	vx: number;
	vy: number;
	dir: number;
	onGround: boolean;
	coyoteLeft: number;
	jumpBuffered: number;
	axisInput: number;
	jumpPressed: boolean;
	jumpHeld: boolean;
	fastFall: boolean;
	maxFallSpeedBonus?: number;
	airControlMultiplier?: number;
}

export interface PhysicsWorldState {
	actors: PhysicsActorState[];
	projectiles: ProjectileState[];
	platforms: Rect[];
	materialZones?: MaterialZone[];
	bounds: Rect;
	rng?: DeterministicRngState;
	tick: number;
	time: number;
}

export interface PhysicsWorldStepInput {
	world: PhysicsWorldState;
	params: PhysicsParams;
	dt: number;
	fluid?: FluidField;
}

export interface PhysicsMaterialEvent {
	actorId: string;
	materialId: string;
	tags: string[];
	damage: number;
	overlapArea: number;
}

export interface PhysicsWorldStepOutput {
	world: PhysicsWorldState;
	projectileHits: ProjectileHit[];
	expiredProjectileIds: string[];
	materialEvents: PhysicsMaterialEvent[];
}

function cloneActor(actor: PhysicsActorState): PhysicsActorState {
	return { ...actor };
}

interface StepActorResult {
	actor: PhysicsActorState;
	materialEvent: PhysicsMaterialEvent | null;
}

function stepActor(
	actor: PhysicsActorState,
	platforms: ReadonlyArray<Rect>,
	materialZones: ReadonlyArray<MaterialZone>,
	params: PhysicsParams,
	dt: number
): StepActorResult {
	const next = cloneActor(actor);
	if (next.axisInput !== 0) next.dir = Math.sign(next.axisInput);

	const actorParams: PhysicsParams = {
		...params,
		maxFallSpeed: params.maxFallSpeed + (next.maxFallSpeedBonus ?? 0),
		runAccelAir: params.runAccelAir * (next.airControlMultiplier ?? 1),
	};

	if (next.jumpPressed) next.jumpBuffered = actorParams.jumpBuffer;

	const moved = movementStep({
		x: next.x,
		y: next.y,
		vx: next.vx,
		vy: next.vy,
		onGround: next.onGround,
		axisInput: next.axisInput,
		isFastFalling: next.fastFall,
		params: actorParams,
		dt,
	});
	Object.assign(next, moved);

	next.vy = gravityStep(next.vy, actorParams, dt);

	const canJump = next.onGround || next.coyoteLeft > 0;
	if (next.jumpBuffered > 0 && canJump) {
		next.vy = actorParams.jumpVelocity;
		next.onGround = false;
		next.coyoteLeft = 0;
		next.jumpBuffered = 0;
	}

	if (!next.jumpHeld && next.vy < actorParams.jumpVelocity * actorParams.variableJumpCut) {
		next.vy *= 0.52;
	}

	const landed = platformStep({
		x: next.x,
		y: next.y,
		w: next.w,
		h: next.h,
		vx: next.vx,
		vy: next.vy,
		prevVy: actor.vy,
		platforms: [...platforms],
		coyoteTime: actorParams.coyote,
	});

	next.x = landed.x;
	next.y = landed.y;
	if (landed.onGround) {
		next.onGround = true;
		next.vy = 0;
		next.coyoteLeft = landed.coyoteLeft;
	} else {
		next.onGround = false;
	}

	const material = applySurfaceMaterial(next, materialZones, dt);
	Object.assign(next, material.body);

	const timers = coyoteStep({
		onGround: next.onGround,
		coyoteLeft: next.coyoteLeft,
		jumpBuffered: next.jumpBuffered,
		params: actorParams,
		dt,
	});
	next.coyoteLeft = timers.coyoteLeft;
	next.jumpBuffered = timers.jumpBuffered;
	next.jumpPressed = false;
	return {
		actor: next,
		materialEvent: material.contact
			? {
				actorId: actor.id,
				materialId: material.contact.material.id,
				tags: [...(material.contact.material.tags ?? [])],
				damage: material.damage,
				overlapArea: material.contact.overlapArea,
			}
			: null,
	};
}

export function stepPhysicsWorld(input: PhysicsWorldStepInput): PhysicsWorldStepOutput {
	if (!Number.isFinite(input.dt) || input.dt < 0) throw new Error(`Invalid physics world dt: ${input.dt}`);

	const actorResults = input.world.actors.map((actor) =>
		stepActor(actor, input.world.platforms, input.world.materialZones ?? [], input.params, input.dt)
	);
	const actors = actorResults.map((result) => result.actor);
	const materialEvents = actorResults
		.map((result) => result.materialEvent)
		.filter((event): event is PhysicsMaterialEvent => event !== null);
	const projectileResult = stepProjectiles({
		projectiles: input.world.projectiles,
		targets: actors,
		platforms: input.world.platforms,
		bounds: input.world.bounds,
		fluid: input.fluid,
		params: input.params,
		dt: input.dt,
	});

	return {
		world: {
			...input.world,
			actors,
			projectiles: projectileResult.projectiles,
			tick: input.world.tick + 1,
			time: input.world.time + input.dt,
		},
		projectileHits: projectileResult.hits,
		expiredProjectileIds: projectileResult.expiredIds,
		materialEvents,
	};
}

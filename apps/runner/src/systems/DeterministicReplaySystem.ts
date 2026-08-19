import type { PhysicsParams, ProjectileHit } from '@badger/platformer-core';
import { verifyReplayHashes as verifyArcadeReplayHashes } from '@arcade/runtime/testing';
import {
	stepDeterministicRun,
	type DeterministicRunState,
	type DeterministicRunStepOutput,
} from './DeterministicRunStep';
import type { StatusEffect } from './StatusEffectSystem';

export interface ReplayFrameInput {
	dt: number;
	projectileAttackerId?: string;
	useItemActorIds?: string[];
	statusByProjectileKind?: Partial<Record<ProjectileHit['kind'], StatusEffect[]>>;
	statusByMaterialTag?: Partial<Record<string, StatusEffect[]>>;
}

export interface ReplayFrameResult {
	index: number;
	time: number;
	frameHash: string;
	combatEventCount: number;
	itemEventCount: number;
}

export interface ReplayResult {
	finalState: DeterministicRunState;
	frames: ReplayFrameResult[];
	finalHash: string;
}

export interface ReplayMismatch {
	index: number;
	expected: string;
	actual: string;
}

function cloneState(state: DeterministicRunState): DeterministicRunState {
	return {
		...state,
		physics: {
			...state.physics,
			actors: state.physics.actors.map((actor) => ({ ...actor })),
			projectiles: state.physics.projectiles.map((projectile) => ({ ...projectile, tags: [...projectile.tags] })),
			platforms: state.physics.platforms.map((platform) => ({ ...platform })),
			materialZones: state.physics.materialZones?.map((zone) => ({ ...zone, material: { ...zone.material, tags: zone.material.tags ? [...zone.material.tags] : undefined } })),
		},
		combatants: state.combatants.map((combatant) => ({
			...combatant,
			statusEffects: combatant.statusEffects?.map((status) => ({ ...status })),
			itemSetEffects: combatant.itemSetEffects ? { ...combatant.itemSetEffects } : undefined,
			unlockedSkills: combatant.unlockedSkills ? [...combatant.unlockedSkills] : undefined,
		})),
		items: state.items.map((item) => ({
			...item,
			definition: { ...item.definition, effects: { ...item.definition.effects } },
			state: { ...item.state },
		})),
	};
}

function applyFrameItemRequests(state: DeterministicRunState, actorIds: readonly string[] = []): DeterministicRunState {
	if (actorIds.length === 0) return state;
	const requested = new Set(actorIds);
	return {
		...state,
		items: state.items.map((item) => ({ ...item, requestedUse: requested.has(item.actorId) ? true : item.requestedUse })),
	};
}

export function replayDeterministicRun(
	initialState: DeterministicRunState,
	params: PhysicsParams,
	frames: readonly ReplayFrameInput[]
): ReplayResult {
	let state = cloneState(initialState);
	const results: ReplayFrameResult[] = [];

	frames.forEach((frame, index) => {
		state = applyFrameItemRequests(state, frame.useItemActorIds);
		const output: DeterministicRunStepOutput = stepDeterministicRun({
			state,
			params,
			dt: frame.dt,
			projectileAttackerId: frame.projectileAttackerId,
			statusByProjectileKind: frame.statusByProjectileKind,
			statusByMaterialTag: frame.statusByMaterialTag,
		});
		state = output.state;
		results.push({
			index,
			time: state.time,
			frameHash: output.frameHash,
			combatEventCount: output.combatEvents.length,
			itemEventCount: output.itemEvents.length,
		});
	});

	return {
		finalState: state,
		frames: results,
		finalHash: results.at(-1)?.frameHash ?? '',
	};
}

export function verifyReplayHashes(actual: ReplayResult, expectedHashes: readonly string[]): ReplayMismatch[] {
	return verifyArcadeReplayHashes(actual, expectedHashes);
}

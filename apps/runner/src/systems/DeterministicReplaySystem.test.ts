import { describe, expect, it } from 'vitest';
import { defaultParams, type PhysicsActorState, type PhysicsWorldState } from '@badger/platformer-core';
import type { CombatEntity } from './CombatSystem';
import { createItemUseState, type ItemUseDefinition } from './ItemUseSystem';
import type { DeterministicRunState } from './DeterministicRunStep';
import { replayDeterministicRun, verifyReplayHashes } from './DeterministicReplaySystem';

const heal: ItemUseDefinition = {
	itemId: 'stim_cache',
	cooldown: 0.2,
	maxCharges: 1,
	rechargeTime: 1,
	effects: { heal: 1 },
};

function actor(id: string, overrides: Partial<PhysicsActorState> = {}): PhysicsActorState {
	return {
		id, x: id === 'drone' ? 40 : 0, y: 10, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, axisInput: 0, jumpPressed: false, jumpHeld: false, fastFall: false,
		...overrides,
	};
}

function combatant(id: string, overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id, x: id === 'drone' ? 40 : 0, y: 10, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: id === 'player' ? 3 : 5, maxHp: 5, invuln: 0, stun: 0,
		faction: id === 'player' ? 'player' : 'enemy',
		...overrides,
	};
}

function physics(): PhysicsWorldState {
	return {
		actors: [actor('player'), actor('drone')],
		projectiles: [],
		platforms: [],
		bounds: { x: -100, y: -100, w: 400, h: 400 },
		tick: 0,
		time: 0,
	};
}

function state(): DeterministicRunState {
	return {
		physics: physics(),
		combatants: [combatant('player'), combatant('drone')],
		items: [{ actorId: 'player', definition: heal, state: createItemUseState(heal) }],
		tick: 0,
		time: 0,
	};
}

describe('DeterministicReplaySystem', () => {
	it('replays multiple deterministic frames into matching hash sequences', () => {
		const frames = [{ dt: 0.1, useItemActorIds: ['player'] }, { dt: 0.1 }, { dt: 0.9 }];
		const first = replayDeterministicRun(state(), defaultParams, frames);
		const second = replayDeterministicRun(state(), defaultParams, frames);

		expect(first.frames.map((frame) => frame.frameHash)).toEqual(second.frames.map((frame) => frame.frameHash));
		expect(first.finalState).toEqual(second.finalState);
		expect(first.frames[0]?.itemEventCount).toBe(1);
		expect(first.frames[2]?.itemEventCount).toBe(1);
	});

	it('reports replay hash mismatches with exact frame indexes', () => {
		const replay = replayDeterministicRun(state(), defaultParams, [{ dt: 0.1 }, { dt: 0.1 }]);
		const expected = replay.frames.map((frame) => frame.frameHash);
		expected[1] = 'bad-hash';

		expect(verifyReplayHashes(replay, expected)).toEqual([{ index: 1, expected: 'bad-hash', actual: replay.frames[1]?.frameHash }]);
	});
});

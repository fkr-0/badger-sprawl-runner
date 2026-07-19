import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { createCombatTimeline, enqueueTimelineAction, stepCombatTimeline } from './CombatTimeline';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
		...overrides,
	};
}

describe('CombatTimeline', () => {
	it('processes queued actions only when their deterministic time is reached', () => {
		const player = entity({ id: 'player', faction: 'player' });
		const drone = entity({ id: 'drone', faction: 'enemy', x: 10, hp: 5 });
		const timeline = enqueueTimelineAction(createCombatTimeline(), {
			kind: 'attack',
			actorId: 'player',
			targetIds: ['drone'],
			at: 0.25,
			attack: {
				id: 'scripted-claw', source: 'player', damage: 2, stun: 0.2, knockbackX: 10,
				hitbox: { x: 0, y: 0, w: 40, h: 40 },
			},
		});

		const early = stepCombatTimeline(timeline, [player, drone], 0.1);
		expect(early.processed).toEqual([]);
		expect(drone.hp).toBe(5);

		const late = stepCombatTimeline(early.state, [player, drone], 0.2);
		expect(late.processed).toHaveLength(1);
		expect(drone.hp).toBe(3);
		expect(late.state.actions).toEqual([]);
	});

	it('replays the same action queue into the same combat result', () => {
		const timeline = createCombatTimeline([
			{ kind: 'parry', actorId: 'player', at: 0.1 },
			{ kind: 'attack', actorId: 'player', targetIds: ['drone'], at: 0.2, attack: {
				id: 'rail', source: 'player', damage: 3, stun: 0.1, knockbackX: 5, hitbox: { x: 0, y: 0, w: 40, h: 40 },
			} },
		]);
		const run = () => {
			const player = entity({ id: 'player', faction: 'player' });
			const drone = entity({ id: 'drone', faction: 'enemy', x: 10, hp: 5 });
			stepCombatTimeline(timeline, [player, drone], 0.5);
			return { player, drone };
		};

		expect(run()).toEqual(run());
	});

	it('anchors relative waits when they are enqueued instead of sliding them every step', () => {
		const timeline = enqueueTimelineAction(createCombatTimeline(), { kind: 'wait', duration: 0.2 });
		const early = stepCombatTimeline(timeline, [], 0.1);
		expect(early.processed).toEqual([]);
		const due = stepCombatTimeline(early.state, [], 0.1);
		expect(due.processed).toEqual([{ kind: 'wait', duration: 0.2, at: 0.2 }]);
	});
});

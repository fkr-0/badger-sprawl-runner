import { describe, expect, it } from 'vitest';
import type { CombatEntity, CombatEvent } from './CombatSystem';
import { applyCombatLedgerDamage, combatEventsToTimeline, reduceCombatEvents } from './CombatEventLedger';

function entity(id: string): CombatEntity {
	return { id, x: 0, y: 0, w: 10, h: 10, vx: 0, vy: 0, dir: 1, onGround: true, coyoteLeft: 0, jumpBuffered: 0, hp: 10, maxHp: 10, invuln: 0, stun: 0 };
}

describe('CombatEventLedger', () => {
	it('reduces combat events into deterministic damage, kill, combo, and status summaries', () => {
		const events: CombatEvent[] = [
			{ kind: 'hit', source: 'player', targetId: 'drone', damage: 2, combo: 1, time: 2, moveId: 'jab' },
			{ kind: 'damage', source: 'player', targetId: 'drone', damage: 1, time: 2.5, status: { kind: 'tick', targetId: 'drone', effectId: 'burn', effectKind: 'burn', amount: 1 } },
			{ kind: 'kill', source: 'player', targetId: 'drone', damage: 3, combo: 3, time: 3, moveId: 'finisher' },
		];

		const summary = reduceCombatEvents(events);

		expect(summary.damageByTarget.drone).toBe(6);
		expect(summary.kills).toEqual(['drone']);
		expect(summary.comboMaxBySource.player).toBe(3);
		expect(summary.statusEvents).toBe(1);
		expect(summary.eventCount).toBe(3);
		expect(applyCombatLedgerDamage([entity('drone')], summary)[0]?.hp).toBe(4);
	});

	it('sorts combat events into a stable timeline representation', () => {
		const timeline = combatEventsToTimeline([
			{ kind: 'hit', time: 2, moveId: 'b' },
			{ kind: 'parry', time: 1, moveId: 'a' },
			{ kind: 'damage', time: 2, moveId: 'a' },
		]);

		expect(timeline.map((event) => `${event.time}:${event.kind}:${event.moveId}`)).toEqual([
			'1:parry:a',
			'2:damage:a',
			'2:hit:b',
		]);
	});
});

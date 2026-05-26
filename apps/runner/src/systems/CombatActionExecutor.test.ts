import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { createCombatActionState } from './CombatActionSystem';
import { executeCombatAction, type ExecutableCombatAction } from './CombatActionExecutor';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
		...overrides,
	};
}

const slash: ExecutableCombatAction = {
	id: 'slash',
	cooldown: 0.5,
	costs: [{ kind: 'stamina', amount: 2 }],
	targetIds: ['drone'],
	attack: {
		id: 'slash-attack',
		source: 'player',
		damage: 2,
		damageType: 'slash',
		stun: 0.2,
		knockbackX: 20,
		hitbox: { x: 0, y: 0, w: 80, h: 80 },
	},
};

describe('CombatActionExecutor', () => {
	it('gates resources and resolves the action attack deterministically', () => {
		const actor = entity();
		const drone = entity({ id: 'drone', faction: 'enemy', x: 20, hp: 5 });
		const state = createCombatActionState('player', { ownerId: 'player', pools: [{ kind: 'stamina', value: 3, max: 5, regenPerSecond: 0 }] });
		const events: string[] = [];

		const result = executeCombatAction(state, slash, actor, [actor, drone], 1, { onEvent: (event) => events.push(event.kind) });

		expect(result.ok).toBe(true);
		expect(result.resolvedHits).toBe(1);
		expect(result.state.resources.pools[0]?.value).toBe(1);
		expect(drone.hp).toBe(3);
		expect(events).toEqual(['hit']);
	});

	it('does not resolve attacks when action gating fails', () => {
		const actor = entity();
		const drone = entity({ id: 'drone', faction: 'enemy', x: 20, hp: 5 });
		const state = createCombatActionState('player', { ownerId: 'player', pools: [{ kind: 'stamina', value: 0, max: 5, regenPerSecond: 0 }] });

		const result = executeCombatAction(state, slash, actor, [actor, drone], 1);

		expect(result.ok).toBe(false);
		expect(result.resolvedHits).toBe(0);
		expect(drone.hp).toBe(5);
		expect(result.actionEvents[0]?.kind).toBe('blocked');
	});
});

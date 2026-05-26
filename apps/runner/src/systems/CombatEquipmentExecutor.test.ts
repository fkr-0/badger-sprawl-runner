import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { createCombatActionState } from './CombatActionSystem';
import { executeCombatActionWithEquipmentWear } from './CombatEquipmentExecutor';
import type { ExecutableCombatAction } from './CombatActionExecutor';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
		...overrides,
	};
}

const clawAction: ExecutableCombatAction = {
	id: 'claw-action',
	cooldown: 0.25,
	costs: [{ kind: 'stamina', amount: 1 }],
	targetIds: ['drone'],
	attack: { id: 'claw_jab', source: 'player', damage: 1, damageType: 'slash', stun: 0.1, knockbackX: 0, hitbox: { x: 0, y: 0, w: 80, h: 80 } },
};

describe('CombatEquipmentExecutor', () => {
	it('executes gated combat and applies equipment wear from emitted combat events', () => {
		const actor = entity();
		const drone = entity({ id: 'drone', faction: 'enemy', x: 20, hp: 3 });
		const actionState = createCombatActionState('player', { ownerId: 'player', pools: [{ kind: 'stamina', value: 2, max: 5, regenPerSecond: 0 }] });
		const result = executeCombatActionWithEquipmentWear(
			actionState,
			clawAction,
			actor,
			[actor, drone],
			[{ itemId: 'claws', durability: 3, maxDurability: 5, broken: false }],
			[{ itemId: 'claws', onCombatKinds: ['hit', 'kill'], moveIdIncludes: 'claw', amount: 1 }],
			4
		);

		expect(result.ok).toBe(true);
		expect(result.resolvedHits).toBe(1);
		expect(result.combatEventCount).toBe(1);
		expect(result.items[0]?.durability).toBe(2);
		expect(result.durabilityEvents).toEqual([{ kind: 'damaged', itemId: 'claws', amount: 1 }]);
	});

	it('does not wear equipment when action gating fails', () => {
		const actor = entity();
		const drone = entity({ id: 'drone', faction: 'enemy', x: 20, hp: 3 });
		const actionState = createCombatActionState('player', { ownerId: 'player', pools: [{ kind: 'stamina', value: 0, max: 5, regenPerSecond: 0 }] });
		const result = executeCombatActionWithEquipmentWear(
			actionState,
			clawAction,
			actor,
			[actor, drone],
			[{ itemId: 'claws', durability: 3, maxDurability: 5, broken: false }],
			[{ itemId: 'claws', onCombatKinds: ['hit'], moveIdIncludes: 'claw', amount: 1 }],
			4
		);

		expect(result.ok).toBe(false);
		expect(result.items[0]?.durability).toBe(3);
		expect(result.durabilityEvents).toEqual([]);
	});
});

import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { startFrameAction, type AttackFrameData } from './CombatFrameDataSystem';
import { stepAndResolveFrameAction } from './CombatFrameExecutor';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
		...overrides,
	};
}

const frameData: AttackFrameData = {
	id: 'claw_jab_frame',
	startup: 0.1,
	active: 0.1,
	recovery: 0.2,
	cancelInto: ['claw_cross'],
	attack: { id: 'claw_jab', source: 'player', damage: 1, damageType: 'slash', stun: 0.1, knockbackX: 0, hitbox: { x: 0, y: 0, w: 80, h: 80 } },
};

describe('CombatFrameExecutor', () => {
	it('resolves attacks exactly once when the frame action becomes active', () => {
		const player = entity();
		const drone = entity({ id: 'drone', faction: 'enemy', x: 20, hp: 3 });
		let state = startFrameAction(frameData);

		let result = stepAndResolveFrameAction(frameData, state, player, [drone], 0.05, 1);
		expect(result.resolvedHits).toBe(0);
		expect(drone.hp).toBe(3);

		result = stepAndResolveFrameAction(frameData, result.state, player, [drone], 0.05, 1.05);
		expect(result.resolvedHits).toBe(1);
		expect(result.state.hasResolvedHit).toBe(true);
		expect(drone.hp).toBe(2);

		result = stepAndResolveFrameAction(frameData, result.state, player, [drone], 0.05, 1.1);
		expect(result.resolvedHits).toBe(0);
		expect(drone.hp).toBe(2);
	});

	it('reports cancel windows during recovery', () => {
		const result = stepAndResolveFrameAction(frameData, { actionId: 'claw_jab_frame', elapsed: 0.2, phase: 'active', hasResolvedHit: true }, entity(), [], 0.01, 2);
		expect(result.canCancel).toBe(true);
	});
});

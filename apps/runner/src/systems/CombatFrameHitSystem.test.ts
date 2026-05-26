import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { startFrameAction, type AttackFrameData } from './CombatFrameDataSystem';
import { createFrameHitState, resolveFrameHits } from './CombatFrameHitSystem';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
		...overrides,
	};
}

const frameData: AttackFrameData = {
	id: 'claw_jab_frame',
	startup: 0,
	active: 0.1,
	recovery: 0.2,
	attack: {
		id: 'claw_jab', source: 'player', damage: 1, damageType: 'slash', stun: 0.1, knockbackX: 0,
		hitbox: { x: 0, y: 0, w: 100, h: 80 },
	},
};

describe('CombatFrameHitSystem', () => {
	it('resolves active-frame hits once per target in deterministic id order', () => {
		const attacker = entity();
		const alpha = entity({ id: 'alpha', faction: 'enemy', x: 20 });
		const bravo = entity({ id: 'bravo', faction: 'enemy', x: 30 });
		let state = createFrameHitState(startFrameAction(frameData));

		const first = resolveFrameHits(frameData, state, attacker, [bravo, alpha], 1);
		state = first.state;
		const second = resolveFrameHits(frameData, state, attacker, [bravo, alpha], 1.016);

		expect(first.resolvedHits).toBe(2);
		expect(first.newTargetIds).toEqual(['alpha', 'bravo']);
		expect(first.state.hitTargetIds).toEqual(['alpha', 'bravo']);
		expect(alpha.hp).toBe(4);
		expect(bravo.hp).toBe(4);
		expect(second.resolvedHits).toBe(0);
		expect(alpha.hp).toBe(4);
		expect(bravo.hp).toBe(4);
	});

	it('does not resolve hits outside active phase', () => {
		const inactive = { ...createFrameHitState(startFrameAction(frameData)), phase: 'startup' as const };
		const result = resolveFrameHits(frameData, inactive, entity(), [entity({ id: 'drone', faction: 'enemy' })], 1);

		expect(result.resolvedHits).toBe(0);
		expect(result.state.hitTargetIds).toEqual([]);
	});
});

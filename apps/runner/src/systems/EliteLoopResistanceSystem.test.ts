import { describe, expect, it, vi } from 'vitest';
import { CombatSystem, type CombatEntity } from './CombatSystem';
import {
	resolveEliteLoopResistance,
	resetEliteLoopResistance,
} from './EliteLoopResistanceSystem';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'target',
		x: 100,
		y: 100,
		w: 40,
		h: 40,
		vx: 0,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 20,
		maxHp: 20,
		invuln: 0,
		stun: 0,
		poise: 10,
		faction: 'enemy',
		...overrides,
	};
}

describe('EliteLoopResistanceSystem', () => {
	it('leaves standard enemies and damage semantics unchanged', () => {
		const target = entity({ combatRank: 'standard' });
		expect(resolveEliteLoopResistance(target, 'jab', 0, 0.5, 2)).toMatchObject({
			eligible: false,
			repeatCount: 1,
			stun: 0.5,
			poiseDamage: 2,
			resisted: false,
		});
		expect(target.loopResistanceMoveId).toBeUndefined();
	});

	it('scales repeated control on elites while different moves and pauses reset it', () => {
		const target = entity({ combatRank: 'elite' });
		expect(resolveEliteLoopResistance(target, 'jab', 0, 1, 4)).toMatchObject({
			repeatCount: 1,
			stunScale: 1,
			poiseScale: 1,
		});
		expect(resolveEliteLoopResistance(target, 'jab', 0.4, 1, 4)).toMatchObject({
			repeatCount: 2,
			stun: 0.72,
			poiseDamage: 3.4,
			resisted: true,
		});
		expect(resolveEliteLoopResistance(target, 'jab', 0.8, 1, 4)).toMatchObject({
			repeatCount: 3,
			stun: 0.48,
			poiseDamage: 2.6,
		});
		expect(resolveEliteLoopResistance(target, 'heavy', 1, 1, 4)).toMatchObject({
			repeatCount: 1,
			resisted: false,
		});
		expect(resolveEliteLoopResistance(target, 'heavy', 3, 1, 4)).toMatchObject({
			repeatCount: 1,
			resisted: false,
		});
		resetEliteLoopResistance(target);
		expect(target.loopResistanceRepeatCount).toBe(0);
	});

	it('integrates through attack resolution without reducing damage', () => {
		const combat = new CombatSystem();
		const attacker = entity({ id: 'moss', x: 0, faction: 'player', dir: 1 });
		const target = entity({ combatRank: 'boss', bossId: 'test-boss' });
		const onEvent = vi.fn();
		const attack = {
			id: 'rail-1',
			loopKey: 'rail',
			source: 'player' as const,
			damage: 2,
			stun: 1,
			poiseDamage: 2,
			knockbackX: 0,
			hitbox: { x: 90, y: 90, w: 80, h: 80 },
		};

		combat.resolveAttack(attacker, [target], attack, { onEvent }, 0);
		target.invuln = 0;
		target.stun = 0;
		combat.resolveAttack(attacker, [target], { ...attack, id: 'rail-2' }, { onEvent }, 0.4);

		expect(target.hp).toBe(16);
		expect(target.stun).toBeCloseTo(0.72);
		expect(onEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'loop-resisted',
				moveId: 'rail',
				repeatCount: 2,
				stunScale: 0.72,
			})
		);
	});
});

import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { CombatSystem } from './CombatSystem';
import { type LowerSprawlEnemyEvent, LowerSprawlEnemySystem } from './LowerSprawlEnemySystem';

function enemy(role: string, x = 100): CombatEntity {
	return {
		id: `${role}-enemy`,
		x,
		y: 100,
		w: 38,
		h: 34,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 3,
		maxHp: 3,
		invuln: 0,
		stun: 0,
		procgenRole: role,
	};
}

describe('LowerSprawlEnemySystem', () => {
	it('telegraphs and executes a patrol enemy melee instead of passive contact damage', () => {
		const system = new LowerSprawlEnemySystem();
		const target = createPlayer();
		target.x = 125;
		target.y = 100;
		const attacker = enemy('patrol');
		const events: LowerSprawlEnemyEvent[] = [];
		const combat = new CombatSystem();

		for (let frame = 0; frame < 90; frame += 1) {
			combat.step(target, [attacker], {} as never, 1 / 60);
			events.push(...system.step([attacker], target, 1 / 60, combat));
		}

		expect(events).toContainEqual({
			kind: 'enemy-telegraph',
			enemyId: 'patrol-enemy',
			attack: 'toll-swipe',
		});
		expect(events).toContainEqual({
			kind: 'enemy-attack',
			enemyId: 'patrol-enemy',
			attack: 'toll-swipe',
		});
		expect(attacker.usesPatternController).toBe(true);
		expect(target.hp).toBeLessThan(target.maxHp);
	});

	it('gives the turret a readable windup before its ranged pulse', () => {
		const system = new LowerSprawlEnemySystem();
		const target = createPlayer();
		target.x = 260;
		target.y = 100;
		const turret = enemy('turret');
		const events: LowerSprawlEnemyEvent[] = [];
		const combat = new CombatSystem();

		for (let frame = 0; frame < 100; frame += 1) {
			combat.step(target, [turret], {} as never, 1 / 60);
			events.push(...system.step([turret], target, 1 / 60, combat));
		}

		expect(events.some((event) => event.kind === 'enemy-telegraph')).toBe(true);
		expect(events.some((event) => event.kind === 'enemy-attack')).toBe(true);
		expect(typeof turret.attackTelegraph).toBe('number');
	});
});

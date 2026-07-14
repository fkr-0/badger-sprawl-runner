import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { DrainmarketEnemySystem } from './DrainmarketEnemySystem';

function enemy(family = 'knife_drone'): CombatEntity {
	return {
		id: family,
		x: 100,
		y: 420,
		w: 34,
		h: 32,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 2,
		maxHp: 2,
		invuln: 0,
		stun: 0,
		procgenFamily: family,
		procgenRole: family === 'clinic_collector' ? 'bruiser' : 'skirmisher',
	};
}

describe('DrainmarketEnemySystem', () => {
	it('telegraphs a readable knife lunge and assigns the knife-drone sprite', () => {
		const system = new DrainmarketEnemySystem();
		const target = createPlayer();
		target.x = 180;
		const knife = enemy();
		const combat = {
			resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })),
		};

		const events = system.step([knife], target, 0.4, combat);
		expect(events).toContainEqual({
			kind: 'enemy-telegraph',
			enemyId: 'knife_drone',
			attack: 'knife-lunge',
		});
		expect(knife.spriteSheetId).toBe('enemy_knife_drone');
		expect(knife.aiState).toBe('windup');
	});

	it('uses the clinic collector sprite and slower cleaver telegraph', () => {
		const system = new DrainmarketEnemySystem();
		const target = createPlayer();
		target.x = 150;
		const collector = enemy('clinic_collector');
		const combat = {
			resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })),
		};

		const events = system.step([collector], target, 0.8, combat);
		expect(events.some((event) => event.attack === 'invoice-cleaver')).toBe(true);
		expect(collector.spriteSheetId).toBe('enemy_clinic_repo');
	});
});

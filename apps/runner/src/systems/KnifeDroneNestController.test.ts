import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { KnifeDroneNestController } from './KnifeDroneNestController';

function boss(): CombatEntity {
	return {
		id: 'knife-drone-nest',
		x: 1650,
		y: 398,
		w: 64,
		h: 82,
		vx: 0,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 8,
		maxHp: 8,
		invuln: 0,
		stun: 0,
		bossId: 'knife-drone-nest',
	};
}

describe('KnifeDroneNestController', () => {
	it('uses the authored boss sheet and begins a telegraphed lunge', () => {
		const controller = new KnifeDroneNestController();
		const nest = boss();
		const player = createPlayer();
		player.x = 1560;
		const combat = {
			resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })),
		};

		controller.step(nest, player, null, 0.8, combat);
		const events = controller.step(nest, player, null, 1.1, combat);
		expect(events).toContainEqual({ kind: 'boss-telegraph', attack: 'knife-lunge' });
		expect(nest.bossSpriteSheetId).toBe('boss_boss_knife_drone_nest');
		expect(controller.getSnapshot().action).toBe('windup');
	});

	it('switches to phase two and emits a transition', () => {
		const controller = new KnifeDroneNestController();
		const nest = boss();
		nest.hp = 3;
		const player = createPlayer();
		const combat = {
			resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })),
		};
		const events = controller.step(nest, player, null, 0.1, combat);
		expect(events).toContainEqual({ kind: 'boss-phase-transition', phaseIndex: 1 });
	});
});

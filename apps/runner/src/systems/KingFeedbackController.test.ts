import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { KingFeedbackController } from './KingFeedbackController';

function boss(): CombatEntity {
	return {
		id: 'king-feedback',
		x: 2460,
		y: 330,
		w: 84,
		h: 96,
		vx: 0,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 15,
		maxHp: 15,
		invuln: 0,
		stun: 0,
		bossId: 'king-feedback',
	};
}

describe('KingFeedbackController', () => {
	it('uses the production amp-throne sheet and telegraphs Security Pulse', () => {
		const controller = new KingFeedbackController();
		const king = boss();
		const player = createPlayer();
		player.x = 2380;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };
		controller.step(king, player, null, 1, combat);
		const events = controller.step(king, player, null, 0.9, combat);
		expect(events).toContainEqual({ kind: 'boss-telegraph', attack: 'security-pulse' });
		expect(king.bossSpriteSheetId).toBe('boss_boss_king_feedback_ampthrone');
		expect(king.bossAnimation).toBe('windup');
	});

	it('enters phase three and cycles the Chorus Test signature attack', () => {
		const controller = new KingFeedbackController();
		const king = boss();
		king.hp = 4;
		const player = createPlayer();
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };
		const transition = controller.step(king, player, null, 0.1, combat);
		expect(transition).toContainEqual({ kind: 'boss-phase-transition', phaseIndex: 2 });
		for (let i = 0; i < 12; i += 1) controller.step(king, player, null, 0.8, combat);
		expect(
			controller.getSnapshot().pendingAttack === 'chorus-test' ||
				controller.getSnapshot().attackCount >= 3
		).toBe(true);
	});

	it('emits defeat once and selects the authored defeat animation', () => {
		const controller = new KingFeedbackController();
		const king = boss();
		king.hp = 0;
		const player = createPlayer();
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };
		expect(controller.step(king, player, null, 0.1, combat)).toEqual([{ kind: 'boss-defeated' }]);
		expect(controller.step(king, player, null, 0.1, combat)).toEqual([]);
		expect(controller.getSnapshot().animation).toBe('defeat');
	});
});

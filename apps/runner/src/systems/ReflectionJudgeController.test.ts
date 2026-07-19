import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { ReflectionJudgeController } from './ReflectionJudgeController';

const boss = (): CombatEntity => ({
	id: 'reflection-judge',
	x: 2280,
	y: 340,
	w: 76,
	h: 92,
	vx: 0,
	vy: 0,
	dir: -1,
	onGround: true,
	coyoteLeft: 0,
	jumpBuffered: 0,
	hp: 14,
	maxHp: 14,
	invuln: 0,
	stun: 0,
	bossId: 'reflection-judge',
});

const combat = {
	resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })),
};

describe('ReflectionJudgeController', () => {
	it('uses the court production sheet and opens with a contract-gavel telegraph', () => {
		const controller = new ReflectionJudgeController();
		const judge = boss();
		const player = createPlayer();
		player.x = 2180;

		controller.step(judge, player, null, 1, combat);
		const events = controller.step(judge, player, null, 1, combat);

		expect(events).toContainEqual({ kind: 'boss-telegraph', attack: 'contract-gavel' });
		expect(judge.bossSpriteSheetId).toBe('boss_boss_reflection_judge_court');
		expect(judge.bossAnimation).toBe('windup');
	});

	it('transitions through health phases and exposes the false-self dash', () => {
		const controller = new ReflectionJudgeController();
		const judge = boss();
		judge.hp = 4;
		const player = createPlayer();

		const transition = controller.step(judge, player, null, 0.1, combat);
		expect(transition).toContainEqual({ kind: 'boss-phase-transition', phaseIndex: 2 });

		for (let index = 0; index < 14; index += 1) controller.step(judge, player, null, 0.7, combat);
		expect(
			controller.getSnapshot().pendingAttack === 'false-self-dash' ||
				controller.getSnapshot().attackCount >= 3
		).toBe(true);
	});

	it('emits defeat only once', () => {
		const controller = new ReflectionJudgeController();
		const judge = boss();
		judge.hp = 0;
		const player = createPlayer();

		expect(controller.step(judge, player, null, 0.1, combat)).toEqual([
			{ kind: 'boss-defeated' },
		]);
		expect(controller.step(judge, player, null, 0.1, combat)).toEqual([]);
		expect(controller.getSnapshot().animation).toBe('defeat');
	});
});

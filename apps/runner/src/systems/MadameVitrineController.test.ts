import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { MadameVitrineController } from './MadameVitrineController';

const boss = (): CombatEntity => ({
	id: 'madame-vitrine',
	x: 2050,
	y: 340,
	w: 72,
	h: 90,
	vx: 0,
	vy: 0,
	dir: -1,
	onGround: true,
	coyoteLeft: 0,
	jumpBuffered: 0,
	hp: 12,
	maxHp: 12,
	invuln: 0,
	stun: 0,
	bossId: 'madame-vitrine',
});

describe('MadameVitrineController', () => {
	it('uses the production Glasscourt sheet and telegraphs the display-window lane', () => {
		const controller = new MadameVitrineController();
		const vitrine = boss();
		const player = createPlayer();
		player.x = 1940;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };

		controller.step(vitrine, player, null, 0.9, combat);
		const events = controller.step(vitrine, player, null, 0.95, combat);

		expect(events).toContainEqual({ kind: 'boss-telegraph', attack: 'glass-lane' });
		expect(vitrine.bossSpriteSheetId).toBe('boss_boss_madame_vitrine_glasscourt');
		expect(vitrine.bossAnimation).toBe('windup');
	});

	it('transitions into the third phase and cycles a mirror dash', () => {
		const controller = new MadameVitrineController();
		const vitrine = boss();
		vitrine.hp = 3;
		const player = createPlayer();
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };

		const transition = controller.step(vitrine, player, null, 0.1, combat);
		expect(transition).toContainEqual({ kind: 'boss-phase-transition', phaseIndex: 2 });

		controller.step(vitrine, player, null, 0.8, combat);
		controller.step(vitrine, player, null, 0.7, combat);
		controller.step(vitrine, player, null, 1, combat);
		controller.step(vitrine, player, null, 0.6, combat);
		controller.step(vitrine, player, null, 1, combat);
		const events = controller.step(vitrine, player, null, 0.7, combat);

		expect(
			events.some((event) => event.kind === 'boss-telegraph') ||
				controller.getSnapshot().pendingAttack === 'mirror-dash'
		).toBe(true);
	});

	it('emits defeat once and selects the defeat animation', () => {
		const controller = new MadameVitrineController();
		const vitrine = boss();
		vitrine.hp = 0;
		const player = createPlayer();
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };

		expect(controller.step(vitrine, player, null, 0.1, combat)).toEqual([
			{ kind: 'boss-defeated' },
		]);
		expect(controller.step(vitrine, player, null, 0.1, combat)).toEqual([]);
		expect(controller.getSnapshot().animation).toBe('defeat');
	});
});

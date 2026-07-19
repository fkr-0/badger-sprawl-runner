import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { MirrorPalaceEnemySystem } from './MirrorPalaceEnemySystem';

const enemy = (overrides: Partial<CombatEntity>): CombatEntity => ({
	id: 'enemy',
	x: 100,
	y: 420,
	w: 42,
	h: 48,
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
	...overrides,
});

describe('MirrorPalaceEnemySystem', () => {
	it('telegraphs banquet applause lunges using the bellhop production sheet', () => {
		const system = new MirrorPalaceEnemySystem();
		const usher = enemy({ id: 'usher', procgenFamily: 'banquet_usher', procgenRole: 'bruiser' });
		const player = createPlayer();
		player.x = 210;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };

		const events = system.step([usher], player, 0.5, combat);

		expect(events).toContainEqual({ kind: 'enemy-telegraph', enemyId: 'usher', attack: 'applause-lunge' });
		expect(usher.spriteSheetId).toBe('enemy_chrome_bellhop');
		expect(usher.spriteAnimation).toBe('windup');
	});

	it('gives mirror sentinels a long reflection-lane warning', () => {
		const system = new MirrorPalaceEnemySystem();
		const sentinel = enemy({ id: 'sentinel', procgenFamily: 'mirror_sentinel', procgenRole: 'ranged' });
		const player = createPlayer();
		player.x = 420;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };

		const events = system.step([sentinel], player, 0.8, combat);

		expect(events).toContainEqual({ kind: 'enemy-telegraph', enemyId: 'sentinel', attack: 'reflection-lane' });
		expect(sentinel.spriteSheetId).toBe('enemy_mirror_sentinel');
		expect(sentinel.vx).toBe(0);
	});
});

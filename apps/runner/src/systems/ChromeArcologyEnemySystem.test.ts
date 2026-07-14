import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { ChromeArcologyEnemySystem } from './ChromeArcologyEnemySystem';

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

describe('ChromeArcologyEnemySystem', () => {
	it('telegraphs the chrome bellhop luggage dash and assigns its production sprite', () => {
		const system = new ChromeArcologyEnemySystem();
		const bellhop = enemy({
			id: 'bellhop',
			procgenFamily: 'chrome_bellhop',
			procgenRole: 'bruiser',
		});
		const player = createPlayer();
		player.x = 210;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };

		const events = system.step([bellhop], player, 0.4, combat);

		expect(events).toContainEqual({
			kind: 'enemy-telegraph',
			enemyId: 'bellhop',
			attack: 'luggage-dash',
		});
		expect(bellhop.spriteSheetId).toBe('enemy_chrome_bellhop');
		expect(bellhop.spriteAnimation).toBe('windup');
	});

	it('uses a longer prism-lane warning for mirror sentinels', () => {
		const system = new ChromeArcologyEnemySystem();
		const sentinel = enemy({
			id: 'sentinel',
			procgenFamily: 'mirror_sentinel',
			procgenRole: 'ranged',
		});
		const player = createPlayer();
		player.x = 360;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };

		const events = system.step([sentinel], player, 0.8, combat);

		expect(events).toContainEqual({
			kind: 'enemy-telegraph',
			enemyId: 'sentinel',
			attack: 'prism-lane',
		});
		expect(sentinel.spriteSheetId).toBe('enemy_mirror_sentinel');
		expect(sentinel.vx).toBe(0);
	});
});

import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import type { ActionMap } from './InputSystem';
import { DubColonyEnemySystem } from './DubColonyEnemySystem';

const idleAction: ActionMap = {
	moveLeft: false,
	moveRight: false,
	jump: false,
	jumpPressed: false,
	fastFall: false,
	melee: false,
	meleePressed: false,
	shoot: false,
	shootPressed: false,
	item: false,
	itemPressed: false,
	parry: false,
	parryPressed: false,
	dodge: false,
	dodgePressed: false,
	hack: false,
	hackPressed: false,
	hackHeld: false,
	pause: false,
	pausePressed: false,
	debugToggle: false,
};

function enemy(family: 'signal_jammer_bat' | 'feedback_guard'): CombatEntity {
	return {
		id: family,
		x: 100,
		y: 380,
		w: 44,
		h: 48,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: family === 'feedback_guard',
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 4,
		maxHp: 4,
		invuln: 0,
		stun: 0,
		procgenFamily: family,
		procgenRole: family === 'signal_jammer_bat' ? 'ranged' : 'bruiser',
	};
}

describe('DubColonyEnemySystem', () => {
	it('assigns the jammer production sheet and emits a rhythm disruption', () => {
		const system = new DubColonyEnemySystem();
		const bat = enemy('signal_jammer_bat');
		const player = createPlayer();
		player.x = 210;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };
		let events = system.step([bat], player, idleAction, 0.5, combat);
		expect(events).toContainEqual({
			kind: 'enemy-telegraph',
			enemyId: 'signal_jammer_bat',
			attack: 'static-burst',
		});
		events = system.step([bat], player, idleAction, 0.8, combat);
		expect(events).toContainEqual({
			kind: 'rhythm-jammed',
			enemyId: 'signal_jammer_bat',
			duration: 1.15,
		});
		expect(bat.spriteSheetId).toBe('enemy_signal_jammer_bat');
	});

	it('lets Moss talk a conflicted feedback guard down during its warning', () => {
		const system = new DubColonyEnemySystem();
		const guard = enemy('feedback_guard');
		const player = createPlayer();
		player.x = 150;
		const combat = { resolveAttack: vi.fn(() => ({ hits: [], blocked: 0, kills: 0, attackId: '' })) };
		system.step([guard], player, idleAction, 0.5, combat);
		const events = system.step(
			[guard],
			player,
			{ ...idleAction, hackPressed: true },
			0.05,
			combat
		);
		expect(events).toContainEqual({ kind: 'guard-talked-down', enemyId: 'feedback_guard' });
		expect(guard.hp).toBe(0);
		expect(guard.spriteSheetId).toBe('enemy_feedback_guard');
	});
});

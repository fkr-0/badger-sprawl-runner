import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { EncounterReadinessSystem, inferDisposition } from './EncounterReadinessSystem';

function enemy(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'guard',
		x: 500,
		y: 462,
		w: 34,
		h: 32,
		vx: -60,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 2,
		maxHp: 2,
		stun: 0,
		invuln: 0,
		procgenRole: 'patrol',
		...overrides,
	};
}

describe('EncounterReadinessSystem', () => {
	it('starts enemies in role-appropriate inhabited-place dispositions', () => {
		expect(inferDisposition(enemy({ procgenRole: 'bruiser' }))).toBe('off-guard');
		expect(inferDisposition(enemy({ procgenRole: 'patrol' }))).toBe('routine');
		expect(inferDisposition(enemy({ procgenRole: 'turret' }))).toBe('alert');
		expect(inferDisposition(enemy({ bossId: 'captain' }))).toBe('alert');
	});

	it('keeps a distant boss dormant until approached or attacked', () => {
		const system = new EncounterReadinessSystem();
		const player = createPlayer();
		player.x = 0;
		const boss = enemy({ id: 'boss', bossId: 'captain', x: 1400 });

		expect(system.step([boss], player, 1)).toEqual([]);
		expect(boss.awarenessState).toBe('alert');
	});

	it('replaces fast full-room oscillation with a small calm routine patrol', () => {
		const system = new EncounterReadinessSystem();
		const player = createPlayer();
		player.x = 0;
		const guard = enemy();
		system.step([guard], player, 1);

		expect(guard.awarenessState).toBe('routine');
		expect(Math.abs(guard.vx)).toBeLessThan(30);
		expect(Math.abs(guard.x - 500)).toBeLessThanOrEqual(34);
	});

	it('does not see a close player immediately from behind', () => {
		const system = new EncounterReadinessSystem();
		const player = createPlayer();
		player.x = 545;
		const guard = enemy({ dir: -1, procgenRole: 'patrol' });
		for (let index = 0; index < 10; index += 1) system.step([guard], player, 0.03);

		expect(guard.awarenessState).not.toBe('engaged');
	});

	it('engages after sustained front-facing detection or when attacked', () => {
		const system = new EncounterReadinessSystem();
		const player = createPlayer();
		player.x = 390;
		const guard = enemy({ dir: -1 });
		for (let index = 0; index < 20; index += 1) system.step([guard], player, 0.03);
		expect(guard.awarenessState).toBe('engaged');

		const surprised = enemy({ id: 'surprised', procgenRole: 'bruiser', invuln: 0.12 });
		system.step([surprised], player, 0.01);
		expect(surprised.awarenessState).toBe('engaged');
	});
});

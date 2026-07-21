import { describe, expect, it } from 'vitest';
import { ENEMY_DEFS, createEnemy, getEnemyCost } from '../actors/EnemyFactory';
import {
	EnemySystem,
	type EnemyDef,
	resolveEnemySpriteAnimation,
} from './EnemySystem';

const crawlerDef: EnemyDef = {
	id: 'test_crawler',
	class: 'crawler',
	hp: 3,
	speed: 60,
	damage: 2,
	stun: 0.25,
	attackRange: 140,
	attackCd: 1.1,
	ai: { kind: 'patrol', patrolSpeed: 35, turnAtEdge: true },
};

describe('EnemySystem registry', () => {
	it('spawns enemies from definitions and exposes alive enemies', () => {
		const system = new EnemySystem();
		const enemy = system.spawnEnemy(crawlerDef, 120, 420);

		expect(enemy).toMatchObject({
			id: 'test_crawler',
			x: 120,
			y: 420,
			class: 'crawler',
			hp: 3,
			maxHp: 3,
			damage: 2,
			attackRange: 140,
			attackCd: 1.1,
			state: 'patrol',
			faction: 'enemy',
		});
		expect(system.getEnemies()).toEqual([enemy]);

		enemy.hp = 0;
		expect(system.getEnemies()).toEqual([]);
	});

	it('binds every horde archetype to a production sprite sheet', () => {
		expect(
			Object.fromEntries(
				Object.entries(ENEMY_DEFS).map(([id, definition]) => [id, definition.spriteSheetId])
			)
		).toEqual({
			toll_rat_crawler: 'enemy_turnstile_mite',
			scooter_bailiff: 'enemy_rent_cop_piker',
			cable_crawler: 'enemy_error_mite',
			drone_wasp: 'enemy_signal_jammer_bat',
			bass_turret_stub: 'enemy_feedback_guard',
		});
	});

	it('resolves sprite animation from combat and AI state', () => {
		const system = new EnemySystem();
		const enemy = system.spawnEnemy(crawlerDef, 120, 420);

		expect(resolveEnemySpriteAnimation(enemy)).toBe('patrol_or_move');
		enemy.state = 'windup';
		expect(resolveEnemySpriteAnimation(enemy)).toBe('windup');
		enemy.state = 'attack';
		expect(resolveEnemySpriteAnimation(enemy)).toBe('attack');
		enemy.flashTimer = 0.1;
		expect(resolveEnemySpriteAnimation(enemy)).toBe('hurt');
		enemy.flashTimer = 0;
		enemy.stun = 0.2;
		expect(resolveEnemySpriteAnimation(enemy)).toBe('stun_or_parried');
		enemy.stun = 0;
		enemy.hp = 0;
		expect(resolveEnemySpriteAnimation(enemy)).toBe('death');
	});

	it('clears all enemies and supports EnemyFactory creation/cost lookup', () => {
		const system = new EnemySystem();
		const created = createEnemy(system, 'toll_rat_crawler', 50, 410);

		expect(created).not.toBeNull();
		expect(created?.id).toBe('toll_rat_crawler');
		expect(created?.spriteSheetId).toBe('enemy_turnstile_mite');
		expect(created?.spriteAnimation).toBe('patrol_or_move');
		expect(system.getEnemies()).toHaveLength(1);
		expect(getEnemyCost('toll_rat_crawler')).toBeGreaterThan(0);

		system.clearEnemies();
		expect(system.getEnemies()).toEqual([]);
	});

	it('applies platform collision when a scene passes platforms to step', () => {
		const system = new EnemySystem();
		const enemy = system.spawnEnemy(crawlerDef, 120, 150);

		system.step([enemy], { ...enemy, x: 0, y: 0 }, [{ x: 0, y: 210, w: 400, h: 32 }], 1 / 5);

		expect(enemy.onGround).toBe(true);
		expect(enemy.y).toBe(210 - enemy.h);
		expect(enemy.vy).toBe(0);
	});
});

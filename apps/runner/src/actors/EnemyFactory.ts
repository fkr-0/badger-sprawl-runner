/**
 * EnemyFactory - creates enemy entities from definitions
 */

import type { EnemyDef, EnemyEntity } from '../systems/EnemySystem';
import type { EnemySystem } from '../systems/EnemySystem';

// Enemy definitions database
export const ENEMY_DEFS: Record<string, Omit<EnemyDef, 'id'>> = {
	// Sprawl enemies
	toll_rat_crawler: {
		class: 'crawler',
		hp: 2,
		speed: 40,
		damage: 1,
		stun: 0.3,
		attackRange: 200,
		attackCd: 1.2,
		ai: { kind: 'patrol', patrolSpeed: 30, turnAtEdge: true },
	},

	scooter_bailiff: {
		class: 'crawler',
		hp: 3,
		speed: 60,
		damage: 1,
		stun: 0.25,
		attackRange: 180,
		attackCd: 1.0,
		ai: { kind: 'chase', chaseSpeed: 80 },
	},

	cable_crawler: {
		class: 'crawler',
		hp: 1,
		speed: 50,
		damage: 1,
		stun: 0.4,
		attackRange: 150,
		attackCd: 0.8,
		ai: { kind: 'patrol', patrolSpeed: 40 },
	},

	drone_wasp: {
		class: 'drone',
		hp: 1,
		speed: 0,
		damage: 1,
		stun: 0.5,
		attackRange: 250,
		attackCd: 1.5,
		ai: { kind: 'sine', centerY: 0, amplitude: 32, frequency: 1.5 },
	},

	bass_turret_stub: {
		class: 'turret',
		hp: 4,
		speed: 0,
		damage: 2,
		stun: 0.6,
		attackRange: 300,
		attackCd: 2.0,
		ai: { kind: 'turret' },
	},

	// More enemies would be defined here
};

export function createEnemy(
	enemySystem: EnemySystem,
	enemyId: string,
	x: number,
	y: number
): EnemyEntity | null {
	const def = ENEMY_DEFS[enemyId];
	if (!def) {
		console.warn(`Unknown enemy ID: ${enemyId}`);
		return null;
	}

	return enemySystem.spawnEnemy(
		{
			id: enemyId,
			...def,
		},
		x,
		y
	);
}

export function getRandomEnemyForWave(waveNumber: number): string {
	const sprawlEnemies = ['toll_rat_crawler', 'cable_crawler'];

	if (waveNumber >= 3) {
		sprawlEnemies.push('drone_wasp');
	}
	if (waveNumber >= 5) {
		sprawlEnemies.push('scooter_bailiff');
	}
	if (waveNumber >= 7) {
		sprawlEnemies.push('bass_turret_stub');
	}

	return sprawlEnemies[Math.floor(Math.random() * sprawlEnemies.length)];
}

export function getEnemySpawnPoints(
	count: number,
	arenaWidth: number
): Array<{ x: number; y: number }> {
	const points: Array<{ x: number; y: number }> = [];
	const section = arenaWidth / (count + 1);

	for (let i = 1; i <= count; i++) {
		const x = section * i + (Math.random() - 0.5) * 50;
		const y = 400 + (Math.random() - 0.5) * 30;
		points.push({ x: Math.floor(x), y: Math.floor(y) });
	}

	return points;
}

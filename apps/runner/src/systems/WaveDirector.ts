/**
 * WaveDirector - manages horde mode wave spawning and progression
 */

import { type EntityRegistry, createEntityRegistry } from '../../../../vendor/arcade-runtime.mjs';
import {
	createEnemy,
	getEnemyCost,
	getEnemySpawnPoints,
	getRandomEnemyForWave,
} from '../actors/EnemyFactory';
import type { EnemyEntity } from './EnemySystem';
import type { EnemySystem } from './EnemySystem';

export interface WaveConfig {
	waveNumber: number;
	budget: number;
	enemies: string[];
	spawnDelay: number;
}

interface TrackedEnemy {
	id: string;
	enemy: EnemyEntity;
}

interface QueuedSpawn {
	id: string;
	enemyId: string;
	delay: number;
	x: number;
	y: number;
}

export class WaveDirector {
	private waveNumber = 0;
	private waveActive = false;
	private readonly spawnRegistry: EntityRegistry<QueuedSpawn> = createEntityRegistry();
	private readonly enemyRegistry: EntityRegistry<TrackedEnemy> = createEntityRegistry();
	private spawnSequence = 0;
	private spawnTimer = 0;
	private waveTimer = 0;
	private arenaWidth = 1600;

	// Wave budgets increase with difficulty
	private readonly waveBudgets = [5, 8, 12, 15, 20, 25, 30, 35, 40, 50];

	constructor(private enemySystem: EnemySystem) {}

	startWave(waveNumber: number): void {
		this.waveNumber = waveNumber;
		this.waveActive = true;
		this.spawnRegistry.reset();
		this.enemyRegistry.reset();
		this.spawnSequence = 0;
		this.spawnTimer = 0;
		this.waveTimer = 0;

		// Build spawn queue based on wave budget
		let budget = this.waveBudgets[Math.min(waveNumber - 1, this.waveBudgets.length - 1)];
		const spawnPoints = getEnemySpawnPoints(Math.ceil(budget / 2), this.arenaWidth);
		let pointIndex = 0;

		while (budget > 0) {
			const enemyId = getRandomEnemyForWave(waveNumber);
			const cost = getEnemyCost(enemyId);

			if (budget >= cost) {
				const spawnPoint = spawnPoints[pointIndex] ?? {
					x: Math.floor(this.arenaWidth / 2),
					y: 400,
				};
				this.spawnRegistry.queueSpawn({
					id: `wave-${waveNumber}-spawn-${this.spawnSequence++}`,
					enemyId,
					delay: Math.random() * 2, // Stagger spawns
					x: spawnPoint.x,
					y: spawnPoint.y,
				});
				budget -= cost;
				pointIndex++;
			} else {
				break;
			}
		}
		this.spawnRegistry.flush();

		console.log(`Wave ${waveNumber} started with ${this.spawnRegistry.values().length} enemies`);
	}

	getCurrentWave(): number {
		return this.waveNumber;
	}

	isWaveActive(): boolean {
		return this.waveActive;
	}

	getEnemiesRemaining(): number {
		return this.enemyRegistry.values().length + this.spawnRegistry.values().length;
	}

	getLifecycleSnapshot() {
		return {
			spawnQueue: this.spawnRegistry.snapshot(),
			enemies: this.enemyRegistry.snapshot(),
		};
	}

	getWaveProgress(): { current: number; total: number } {
		return { current: this.waveNumber, total: 10 };
	}

	step(dt: number, _playerX: number): void {
		if (!this.waveActive) return;

		this.spawnTimer += dt;
		this.waveTimer += dt;

		// Spawn enemies from queue
		for (const spawn of this.spawnRegistry.values()) {
			if (this.spawnTimer < spawn.delay) break;
			this.spawnTimer -= spawn.delay;
			this.spawnRegistry.queueDespawn(spawn.id, { onMissing: 'error' });
			const enemy = createEnemy(this.enemySystem, spawn.enemyId, spawn.x, spawn.y);
			if (enemy) {
				this.enemyRegistry.queueSpawn({ id: `${spawn.id}:enemy`, enemy });
			}
		}
		this.spawnRegistry.flush();
		this.enemyRegistry.flush();

		// Check for dead enemies
		const aliveEnemies = this.enemySystem.getEnemies();
		const aliveSet = new Set(aliveEnemies);
		for (const tracked of this.enemyRegistry.values()) {
			if (!aliveSet.has(tracked.enemy)) {
				this.enemyRegistry.queueDespawn(tracked.id, { onMissing: 'error' });
			}
		}
		this.enemyRegistry.flush();

		// Check wave completion
		if (this.spawnRegistry.values().length === 0 && this.enemyRegistry.values().length === 0) {
			this.waveActive = false;
			console.log(`Wave ${this.waveNumber} complete!`);
		}
	}

	reset(): void {
		this.waveNumber = 0;
		this.waveActive = false;
		this.spawnRegistry.reset();
		this.enemyRegistry.reset();
		this.spawnSequence = 0;
		this.spawnTimer = 0;
		this.waveTimer = 0;
		this.enemySystem.clearEnemies();
	}

	getTotalWaves(): number {
		return 10;
	}
}

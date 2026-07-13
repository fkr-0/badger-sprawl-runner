/**
 * WaveDirector - manages horde mode wave spawning and progression
 */

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

interface QueuedSpawn {
	enemyId: string;
	delay: number;
	x: number;
	y: number;
}

export class WaveDirector {
	private waveNumber = 0;
	private enemiesRemaining: EnemyEntity[] = [];
	private waveActive = false;
	private spawnQueue: QueuedSpawn[] = [];
	private spawnTimer = 0;
	private waveTimer = 0;
	private arenaWidth = 1600;

	// Wave budgets increase with difficulty
	private readonly waveBudgets = [5, 8, 12, 15, 20, 25, 30, 35, 40, 50];

	constructor(private enemySystem: EnemySystem) {}

	startWave(waveNumber: number): void {
		this.waveNumber = waveNumber;
		this.waveActive = true;
		this.enemiesRemaining = [];
		this.spawnQueue = [];
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
				this.spawnQueue.push({
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

		console.log(`Wave ${waveNumber} started with ${this.spawnQueue.length} enemies`);
	}

	getCurrentWave(): number {
		return this.waveNumber;
	}

	isWaveActive(): boolean {
		return this.waveActive;
	}

	getEnemiesRemaining(): number {
		return this.enemiesRemaining.length + this.spawnQueue.length;
	}

	getWaveProgress(): { current: number; total: number } {
		return { current: this.waveNumber, total: 10 };
	}

	step(dt: number, _playerX: number): void {
		if (!this.waveActive) return;

		this.spawnTimer += dt;
		this.waveTimer += dt;

		// Spawn enemies from queue
		while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
			const spawn = this.spawnQueue.shift();
			if (!spawn) break;
			this.spawnTimer -= spawn.delay;
			const enemy = createEnemy(this.enemySystem, spawn.enemyId, spawn.x, spawn.y);
			if (enemy) {
				this.enemiesRemaining.push(enemy);
			}
		}

		// Check for dead enemies
		const aliveEnemies = this.enemySystem.getEnemies();
		this.enemiesRemaining = aliveEnemies;

		// Check wave completion
		if (this.spawnQueue.length === 0 && this.enemiesRemaining.length === 0) {
			this.waveActive = false;
			console.log(`Wave ${this.waveNumber} complete!`);
		}
	}

	reset(): void {
		this.waveNumber = 0;
		this.waveActive = false;
		this.enemiesRemaining = [];
		this.spawnQueue = [];
		this.spawnTimer = 0;
		this.waveTimer = 0;
		this.enemySystem.clearEnemies();
	}

	getTotalWaves(): number {
		return 10;
	}
}

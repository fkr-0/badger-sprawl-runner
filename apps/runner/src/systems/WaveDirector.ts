/**
 * WaveDirector - manages horde mode wave spawning and progression
 */

import type { EnemyEntity } from './EnemySystem';
import type { EnemySystem } from './EnemySystem';
import { getRandomEnemyForWave, getEnemySpawnPoints, getEnemyCost } from '../actors/EnemyFactory';

export interface WaveConfig {
  waveNumber: number;
  budget: number;
  enemies: string[];
  spawnDelay: number;
}

export class WaveDirector {
  private waveNumber = 0;
  private enemiesRemaining: EnemyEntity[] = [];
  private waveActive = false;
  private spawnQueue: Array<{ enemyId: string; delay: number }> = [];
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
        this.spawnQueue.push({
          enemyId,
          delay: Math.random() * 2, // Stagger spawns
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

  step(dt: number, playerX: number): void {
    if (!this.waveActive) return;

    this.spawnTimer += dt;
    this.waveTimer += dt;

    // Spawn enemies from queue
    while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].delay) {
      const spawn = this.spawnQueue.shift();
      if (!spawn) break;
      const enemy = this.enemySystem.spawnEnemy(
        {
          id: spawn.enemyId,
          class: spawn.enemyId.includes('drone') ? 'drone' : spawn.enemyId.includes('turret') ? 'turret' : 'crawler',
          hp: 2,
          speed: 40,
          damage: 1,
          stun: 0.3,
          attackRange: 200,
          attackCd: 1.2,
          ai: { kind: 'patrol', patrolSpeed: 30, turnAtEdge: true },
        },
        playerX + 400 + Math.random() * 200, // Spawn ahead of player
        420
      );
      this.enemiesRemaining.push(enemy);
      this.spawnTimer = 0;
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

import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnemySystem } from './EnemySystem';
import { WaveDirector } from './WaveDirector';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('WaveDirector enemy integration', () => {
	it('starts a wave, spawns through EnemySystem, and clears through reset', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const enemySystem = new EnemySystem();
		const director = new WaveDirector(enemySystem);

		director.startWave(1);
		expect(director.isWaveActive()).toBe(true);
		expect(director.getEnemiesRemaining()).toBeGreaterThan(0);

		director.step(1, 100);
		expect(enemySystem.getEnemies().length).toBeGreaterThan(0);

		director.reset();
		expect(director.isWaveActive()).toBe(false);
		expect(enemySystem.getEnemies()).toEqual([]);
	});

	it('spawns enemies at generated spawn points rather than ad-hoc player offsets', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const enemySystem = new EnemySystem();
		const director = new WaveDirector(enemySystem);

		director.startWave(1);
		director.step(1, 100);

		const enemies = enemySystem.getEnemies();
		expect(enemies.map((enemy) => enemy.x)).toEqual([375, 775]);
		expect(enemies.map((enemy) => enemy.y)).toEqual([385, 385]);
	});

	it('preserves leftover spawn time so large dt can process multiple queued delays', () => {
		const randomValues = [
			0, 0, 0, 0, 0, 0, // spawn points: deterministic x/y offsets
			0, 0.5, // first enemy id + first delay of 1s
			0, 0.5, // second enemy id + second delay of 1s
		];
		vi.spyOn(Math, 'random').mockImplementation(() => randomValues.shift() ?? 0);
		const enemySystem = new EnemySystem();
		const director = new WaveDirector(enemySystem);

		director.startWave(1);
		director.step(2.1, 100);

		expect(enemySystem.getEnemies()).toHaveLength(2);
	});

	it('owns queued and active wave entities through deferred lifecycle snapshots', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const enemySystem = new EnemySystem();
		const director = new WaveDirector(enemySystem);

		director.startWave(1);
		const queued = director.getLifecycleSnapshot();
		expect(queued.spawnQueue.revision).toBe(1);
		expect(queued.spawnQueue.entities.map((entry) => entry.id)).toEqual([
			'wave-1-spawn-0',
			'wave-1-spawn-1',
		]);

		director.step(1, 100);
		const active = director.getLifecycleSnapshot();
		expect(active.spawnQueue.entities).toHaveLength(0);
		expect(active.enemies.entities.map((entry) => entry.id)).toEqual([
			'wave-1-spawn-0:enemy',
			'wave-1-spawn-1:enemy',
		]);

		for (const enemy of enemySystem.getEnemies()) enemy.hp = 0;
		director.step(0, 100);
		expect(director.getLifecycleSnapshot().enemies.entities).toHaveLength(0);
		expect(director.isWaveActive()).toBe(false);
	});
});

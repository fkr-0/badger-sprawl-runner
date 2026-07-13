import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { CombatSystem } from './CombatSystem';
import { LowerSprawlHazardSystem } from './LowerSprawlHazardSystem';

describe('LowerSprawlHazardSystem', () => {
	it('moves deterministic steam vents through idle, warning, and active states', () => {
		const system = new LowerSprawlHazardSystem([
			{
				id: 'test-vent',
				label: 'Test vent',
				x: 10,
				y: 20,
				w: 30,
				h: 40,
				period: 3,
				activeStart: 2,
				activeDuration: 0.5,
				warningDuration: 0.5,
			},
		]);
		const player = createPlayer();
		const combat = new CombatSystem();

		expect(system.getSnapshot()[0]?.state).toBe('idle');
		expect(system.step(player, 1.6, combat)).toContainEqual({
			kind: 'hazard-warning',
			id: 'test-vent',
		});
		expect(system.getSnapshot()[0]?.state).toBe('warning');
		expect(system.step(player, 0.5, combat)).toContainEqual({
			kind: 'hazard-active',
			id: 'test-vent',
		});
		expect(system.getSnapshot()[0]?.state).toBe('active');
	});

	it('damages and launches a player standing in an active vent', () => {
		const system = new LowerSprawlHazardSystem([
			{
				id: 'test-vent',
				label: 'Test vent',
				x: 0,
				y: 0,
				w: 80,
				h: 80,
				period: 2,
				activeStart: 0.1,
				activeDuration: 1,
				warningDuration: 0.1,
			},
		]);
		const player = createPlayer();
		player.x = 10;
		player.y = 10;
		const events = system.step(player, 0.15, new CombatSystem());

		expect(events).toContainEqual({ kind: 'hazard-hit', id: 'test-vent' });
		expect(player.hp).toBeLessThan(player.maxHp);
		expect(player.vy).toBeLessThan(0);
	});
});

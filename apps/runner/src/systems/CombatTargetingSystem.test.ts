import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { chooseTarget, scoreTargets } from './CombatTargetingSystem';

function entity(id: string, overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id, x: 0, y: 0, w: 10, h: 10, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 10, maxHp: 10, invuln: 0, stun: 0, faction: 'enemy',
		...overrides,
	};
}

describe('CombatTargetingSystem', () => {
	it('chooses targets deterministically by score, distance, then id', () => {
		const origin = entity('player', { faction: 'player' });
		const candidates = [
			entity('bravo', { x: 10, hp: 5 }),
			entity('alpha', { x: 10, hp: 5 }),
			entity('far', { x: 300, hp: 1 }),
		];

		const scores = scoreTargets({ origin, candidates, maxDistance: 100, weights: { lowHp: 0, threat: 0, lineOfSight: 0 } });

		expect(scores.map((score) => score.id)).toEqual(['alpha', 'bravo']);
		expect(chooseTarget({ origin, candidates, maxDistance: 100, weights: { lowHp: 0, threat: 0, lineOfSight: 0 } })?.id).toBe('alpha');
	});

	it('can prefer line of sight, low hp, and explicit threat while excluding same faction', () => {
		const origin = entity('player', { faction: 'player' });
		const candidates = [
			entity('ally', { faction: 'player', x: 1 }),
			entity('tank', { x: 30, hp: 10, maxHp: 10 }),
			entity('sniper', { x: 60, hp: 2, maxHp: 10 }),
		];

		const target = chooseTarget({
			origin,
			candidates,
			lineOfSightIds: ['sniper'],
			threatById: { sniper: 1 },
		});

		expect(target?.id).toBe('sniper');
	});
});

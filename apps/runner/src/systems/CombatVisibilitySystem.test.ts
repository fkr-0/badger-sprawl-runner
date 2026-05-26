import { describe, expect, it } from 'vitest';
import type { CombatEntity } from './CombatSystem';
import { computeCombatVisibility } from './CombatVisibilitySystem';

function entity(id: string, overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id,
		x: 0,
		y: 0,
		w: 10,
		h: 10,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 5,
		maxHp: 5,
		invuln: 0,
		stun: 0,
		faction: 'enemy',
		...overrides,
	};
}

describe('CombatVisibilitySystem', () => {
	it('computes visible and blocked combat targets deterministically', () => {
		const origin = entity('player', { faction: 'player', x: 0, y: 0 });
		const targets = [
			entity('blocked', { x: 40, y: 0 }),
			entity('visible', { x: 0, y: 40 }),
			entity('dead', { x: 0, y: 10, hp: 0 }),
			entity('far', { x: 200, y: 0 }),
		];

		const result = computeCombatVisibility(origin, targets, [
			{ id: 'wall', x: 20, y: -10, w: 10, h: 40, layer: 'solid' },
		], 100);

		expect(result.visibleIds).toEqual(['visible']);
		expect(result.blockedIds).toEqual(['blocked', 'far']);
		expect(result.blockersByTarget).toEqual({ blocked: 'wall', far: 'range' });
	});

	it('orders target checks by id for stable blocker reports', () => {
		const origin = entity('player', { faction: 'player' });
		const result = computeCombatVisibility(origin, [
			entity('zeta', { x: 40, y: 0 }),
			entity('alpha', { x: 40, y: 0 }),
		], [{ id: 'wall', x: 20, y: -10, w: 10, h: 40 }], 100);

		expect(result.blockedIds).toEqual(['alpha', 'zeta']);
	});
});

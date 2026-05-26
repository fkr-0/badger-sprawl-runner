import { describe, expect, it } from 'vitest';
import type { ProjectileHit } from '@badger/platformer-core';
import type { CombatEntity } from './CombatSystem';
import { resolveProjectileHitsAsCombat } from './ProjectileCombatBridge';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
		...overrides,
	};
}

describe('ProjectileCombatBridge', () => {
	it('turns physics projectile hits into deterministic combat damage and status effects', () => {
		const attacker = entity({ id: 'player', faction: 'player' });
		const drone = entity({ id: 'drone', faction: 'enemy', hp: 4 });
		const hits: ProjectileHit[] = [{ projectileId: 'rocket-1', targetId: 'drone', damage: 2, kind: 'rocket' }];
		const events: string[] = [];

		const result = resolveProjectileHitsAsCombat({
			attacker,
			targets: [drone],
			hits,
			time: 10,
			statusByProjectileKind: {
				rocket: [{
					id: 'rocket-burn', kind: 'burn', sourceId: 'rocket', duration: 1, remaining: 1,
					stacks: 1, maxStacks: 2, tickInterval: 0.5, tickTimer: 0.5, magnitude: 1,
				}],
			},
			events: { onEvent: (event) => events.push(event.status?.kind ?? event.kind) },
		});

		expect(result).toEqual({ resolved: 1, kills: 0, missingTargets: [] });
		expect(drone.hp).toBe(2);
		expect(drone.statusEffects?.[0]?.kind).toBe('burn');
		expect(events).toContain('applied');
		expect(attacker.comboCount).toBe(1);
	});

	it('reports missing projectile targets without mutating other targets', () => {
		const attacker = entity({ id: 'player', faction: 'player' });
		const drone = entity({ id: 'drone', faction: 'enemy', hp: 4 });
		const result = resolveProjectileHitsAsCombat({
			attacker,
			targets: [drone],
			hits: [{ projectileId: 'rail-ghost', targetId: 'missing', damage: 5, kind: 'rail' }],
			time: 2,
		});

		expect(result).toEqual({ resolved: 0, kills: 0, missingTargets: ['missing'] });
		expect(drone.hp).toBe(4);
	});
});

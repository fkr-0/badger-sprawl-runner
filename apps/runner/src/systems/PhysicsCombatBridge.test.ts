import { describe, expect, it } from 'vitest';
import type { PhysicsMaterialEvent } from '@badger/platformer-core';
import type { CombatEntity } from './CombatSystem';
import { resolveMaterialEventsAsCombat } from './PhysicsCombatBridge';

function entity(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
		...overrides,
	};
}

describe('PhysicsCombatBridge', () => {
	it('resolves physics material hazard events as combat damage and status', () => {
		const player = entity();
		const materialEvents: PhysicsMaterialEvent[] = [{
			actorId: 'player', materialId: 'acid-pool', tags: ['hazard', 'acid'], damage: 2, overlapArea: 1200,
		}];

		const result = resolveMaterialEventsAsCombat({
			materialEvents,
			combatants: [player],
			time: 3,
			statusByMaterialTag: {
				acid: [{ id: 'acid-burn', kind: 'burn', sourceId: 'acid', duration: 1, remaining: 1, stacks: 1, maxStacks: 2, tickInterval: 0.5, tickTimer: 0.5, magnitude: 1 }],
			},
		});

		expect(result).toEqual({ resolvedDamage: 2, missingActorIds: [], statusApplications: 1 });
		expect(player.hp).toBe(3);
		expect(player.statusEffects?.[0]?.kind).toBe('burn');
	});

	it('reports missing actors without guessing targets', () => {
		const result = resolveMaterialEventsAsCombat({
			materialEvents: [{ actorId: 'ghost', materialId: 'acid-pool', tags: ['hazard'], damage: 2, overlapArea: 10 }],
			combatants: [entity()],
			time: 1,
		});

		expect(result).toEqual({ resolvedDamage: 0, missingActorIds: ['ghost'], statusApplications: 0 });
	});
});

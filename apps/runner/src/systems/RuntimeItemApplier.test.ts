import { describe, expect, it } from 'vitest';
import type { PhysicsActorState } from '@badger/platformer-core';
import type { CombatEntity } from './CombatSystem';
import { applyRuntimeItemEffects } from './RuntimeItemApplier';
import type { RuntimeItemEffects } from './ItemEffectResolver';

const effects: RuntimeItemEffects = {
	physics: { airControlMultiplier: 1.25, maxFallSpeedBonus: 120, fuelRefundOnCombo: 1 },
	combat: {
		damageMitigation: 0.15,
		parryWindowBonus: 0.03,
		meleeStyleBonus: 1,
		finisherDamageBonus: 1,
		finisherEmp: true,
		decoyOnPerfectDodge: true,
	},
	hacking: { traceReduction: 0.25, beatGrace: 0.08 },
	statusesOnHit: [],
};

function actor(): PhysicsActorState {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: false,
		coyoteLeft: 0, jumpBuffered: 0, axisInput: 0, jumpPressed: false, jumpHeld: false, fastFall: false,
	};
}

function combatant(): CombatEntity {
	return {
		id: 'player', x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, dir: 1, onGround: true,
		coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player',
	};
}

describe('RuntimeItemApplier', () => {
	it('applies runtime item effects to physics actors and combat entities without mutating inputs', () => {
		const baseActor = actor();
		const baseCombatant = combatant();
		const applied = applyRuntimeItemEffects(baseActor, baseCombatant, effects);

		expect(applied.actor.airControlMultiplier).toBe(1.25);
		expect(applied.actor.maxFallSpeedBonus).toBe(120);
		expect(applied.combatant.itemSetEffects?.damageMitigation).toBe(0.15);
		expect(applied.combatant.itemSetEffects?.finisherEmp).toBe(true);
		expect(applied.combatant.itemSetEffects?.traceReduction).toBe(0.25);
		expect(baseActor.airControlMultiplier).toBeUndefined();
		expect(baseCombatant.itemSetEffects).toBeUndefined();
	});
});

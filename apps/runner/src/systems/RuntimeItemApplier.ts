import type { PhysicsActorState } from '@badger/platformer-core';
import type { CombatEntity } from './CombatSystem';
import { type RuntimeItemEffects, flattenRuntimeItemEffects } from './ItemEffectResolver';

export interface RuntimeAppliedState {
	actor: PhysicsActorState;
	combatant: CombatEntity;
	flatEffects: Record<string, number | boolean>;
}

export function applyRuntimeItemEffectsToActor(
	actor: PhysicsActorState,
	effects: RuntimeItemEffects
): PhysicsActorState {
	return {
		...actor,
		airControlMultiplier: effects.physics.airControlMultiplier,
		maxFallSpeedBonus: effects.physics.maxFallSpeedBonus,
	};
}

export function applyRuntimeItemEffectsToCombatEntity(
	combatant: CombatEntity,
	effects: RuntimeItemEffects
): CombatEntity {
	return {
		...combatant,
		itemSetEffects: {
			...(combatant.itemSetEffects ?? {}),
			damageMitigation: effects.combat.damageMitigation,
			parryWindowBonus: effects.combat.parryWindowBonus,
			meleeStyleBonus: effects.combat.meleeStyleBonus,
			finisherDamageBonus: effects.combat.finisherDamageBonus,
			finisherEmp: effects.combat.finisherEmp,
			decoyOnPerfectDodge: effects.combat.decoyOnPerfectDodge,
			traceReduction: effects.hacking.traceReduction,
			beatGrace: effects.hacking.beatGrace,
			fuelRefundOnCombo: effects.physics.fuelRefundOnCombo,
			landingShockwave: effects.physics.landingShockwave,
		},
	};
}

export function applyRuntimeItemEffects(
	actor: PhysicsActorState,
	combatant: CombatEntity,
	effects: RuntimeItemEffects
): RuntimeAppliedState {
	return {
		actor: applyRuntimeItemEffectsToActor(actor, effects),
		combatant: applyRuntimeItemEffectsToCombatEntity(combatant, effects),
		flatEffects: flattenRuntimeItemEffects(effects),
	};
}

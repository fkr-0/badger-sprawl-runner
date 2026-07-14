import type { LoadoutSummary } from './InventorySystem';
import type { StatusEffect } from './StatusEffectSystem';

export interface RuntimeItemEffects {
	physics: {
		airControlMultiplier: number;
		maxFallSpeedBonus: number;
		fuelRefundOnCombo: number;
		fuelRechargeBonus: number;
		rocketFuelBonus: number;
		boostCooldownReduction: number;
		landingShockwave: boolean;
	};
	combat: {
		damageMitigation: number;
		parryWindowBonus: number;
		meleeStyleBonus: number;
		finisherDamageBonus: number;
		finisherEmp: boolean;
		decoyOnPerfectDodge: boolean;
		parryDamageBonus: number;
		dodgeCooldownReduction: number;
		comboWindowBonus: number;
		railDamageBonus: number;
		railPierceBonus: number;
		railCooldownReduction: number;
		railRecoilReduction: number;
		empOnChargedShot: boolean;
		hackChargesMelee: boolean;
	};
	hacking: {
		traceReduction: number;
		beatGrace: number;
	};
	statusesOnHit: StatusEffect[];
}

export const EMPTY_RUNTIME_ITEM_EFFECTS: RuntimeItemEffects = {
	physics: {
		airControlMultiplier: 1,
		maxFallSpeedBonus: 0,
		fuelRefundOnCombo: 0,
		fuelRechargeBonus: 0,
		rocketFuelBonus: 0,
		boostCooldownReduction: 0,
		landingShockwave: false,
	},
	combat: {
		damageMitigation: 0,
		parryWindowBonus: 0,
		meleeStyleBonus: 0,
		finisherDamageBonus: 0,
		finisherEmp: false,
		decoyOnPerfectDodge: false,
		parryDamageBonus: 0,
		dodgeCooldownReduction: 0,
		comboWindowBonus: 0,
		railDamageBonus: 0,
		railPierceBonus: 0,
		railCooldownReduction: 0,
		railRecoilReduction: 0,
		empOnChargedShot: false,
		hackChargesMelee: false,
	},
	hacking: {
		traceReduction: 0,
		beatGrace: 0,
	},
	statusesOnHit: [],
};

function numberEffect(effects: Record<string, number | string | boolean>, key: string): number {
	const value = effects[key];
	return typeof value === 'number' ? value : 0;
}

function boolEffect(effects: Record<string, number | string | boolean>, key: string): boolean {
	return effects[key] === true;
}

export function resolveRuntimeItemEffects(summary: LoadoutSummary): RuntimeItemEffects {
	const effects = summary.effects;
	const statusesOnHit: StatusEffect[] = [];

	if (boolEffect(effects, 'finisherEmp')) {
		statusesOnHit.push({
			id: 'item-finisher-emp',
			kind: 'emp',
			sourceId: 'loadout',
			duration: 1.2,
			remaining: 1.2,
			stacks: 1,
			maxStacks: 1,
			tickInterval: 0.4,
			tickTimer: 0.4,
			magnitude: 0.35,
		});
	}

	if (numberEffect(effects, 'burnTrailDamage') > 0) {
		statusesOnHit.push({
			id: 'item-burn-trail',
			kind: 'burn',
			sourceId: 'loadout',
			duration: 1.5,
			remaining: 1.5,
			stacks: 1,
			maxStacks: 3,
			tickInterval: 0.5,
			tickTimer: 0.5,
			magnitude: numberEffect(effects, 'burnTrailDamage'),
		});
	}

	return {
		physics: {
			airControlMultiplier: 1 + numberEffect(effects, 'airControlBonus'),
			maxFallSpeedBonus: numberEffect(effects, 'maxFallSpeedBonus'),
			fuelRefundOnCombo: numberEffect(effects, 'fuelRefundOnCombo'),
			fuelRechargeBonus: numberEffect(effects, 'fuelRechargeBonus'),
			rocketFuelBonus: numberEffect(effects, 'rocketFuelBonus'),
			boostCooldownReduction: numberEffect(effects, 'boostCooldownReduction'),
			landingShockwave: boolEffect(effects, 'landingShockwave'),
		},
		combat: {
			damageMitigation: numberEffect(effects, 'damageMitigation'),
			parryWindowBonus: numberEffect(effects, 'parryWindowBonus'),
			meleeStyleBonus: numberEffect(effects, 'meleeStyleBonus'),
			finisherDamageBonus: numberEffect(effects, 'finisherDamageBonus'),
			finisherEmp: boolEffect(effects, 'finisherEmp'),
			decoyOnPerfectDodge: boolEffect(effects, 'decoyOnPerfectDodge'),
			parryDamageBonus: numberEffect(effects, 'parryDamageBonus'),
			dodgeCooldownReduction: numberEffect(effects, 'dodgeCooldownReduction'),
			comboWindowBonus: numberEffect(effects, 'comboWindowBonus'),
			railDamageBonus: numberEffect(effects, 'railDamageBonus'),
			railPierceBonus: numberEffect(effects, 'railPierceBonus'),
			railCooldownReduction: numberEffect(effects, 'railCooldownReduction'),
			railRecoilReduction: numberEffect(effects, 'railRecoilReduction'),
			empOnChargedShot: boolEffect(effects, 'empOnChargedShot'),
			hackChargesMelee: boolEffect(effects, 'hackChargesMelee'),
		},
		hacking: {
			traceReduction: numberEffect(effects, 'traceReduction'),
			beatGrace: numberEffect(effects, 'beatGrace'),
		},
		statusesOnHit,
	};
}

export function flattenRuntimeItemEffects(
	resolved: RuntimeItemEffects
): Record<string, number | boolean> {
	return {
		airControlMultiplier: resolved.physics.airControlMultiplier,
		maxFallSpeedBonus: resolved.physics.maxFallSpeedBonus,
		fuelRefundOnCombo: resolved.physics.fuelRefundOnCombo,
		fuelRechargeBonus: resolved.physics.fuelRechargeBonus,
		rocketFuelBonus: resolved.physics.rocketFuelBonus,
		boostCooldownReduction: resolved.physics.boostCooldownReduction,
		landingShockwave: resolved.physics.landingShockwave,
		damageMitigation: resolved.combat.damageMitigation,
		parryWindowBonus: resolved.combat.parryWindowBonus,
		meleeStyleBonus: resolved.combat.meleeStyleBonus,
		finisherDamageBonus: resolved.combat.finisherDamageBonus,
		finisherEmp: resolved.combat.finisherEmp,
		decoyOnPerfectDodge: resolved.combat.decoyOnPerfectDodge,
		parryDamageBonus: resolved.combat.parryDamageBonus,
		dodgeCooldownReduction: resolved.combat.dodgeCooldownReduction,
		comboWindowBonus: resolved.combat.comboWindowBonus,
		railDamageBonus: resolved.combat.railDamageBonus,
		railPierceBonus: resolved.combat.railPierceBonus,
		railCooldownReduction: resolved.combat.railCooldownReduction,
		railRecoilReduction: resolved.combat.railRecoilReduction,
		empOnChargedShot: resolved.combat.empOnChargedShot,
		hackChargesMelee: resolved.combat.hackChargesMelee,
		traceReduction: resolved.hacking.traceReduction,
		beatGrace: resolved.hacking.beatGrace,
	};
}

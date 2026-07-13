import type { LoadoutSummary } from './InventorySystem';
import type { StatusEffect } from './StatusEffectSystem';

export interface RuntimeItemEffects {
	physics: {
		airControlMultiplier: number;
		maxFallSpeedBonus: number;
		fuelRefundOnCombo: number;
		landingShockwave: boolean;
	};
	combat: {
		damageMitigation: number;
		parryWindowBonus: number;
		meleeStyleBonus: number;
		finisherDamageBonus: number;
		finisherEmp: boolean;
		decoyOnPerfectDodge: boolean;
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
		landingShockwave: false,
	},
	combat: {
		damageMitigation: 0,
		parryWindowBonus: 0,
		meleeStyleBonus: 0,
		finisherDamageBonus: 0,
		finisherEmp: false,
		decoyOnPerfectDodge: false,
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
			landingShockwave: boolEffect(effects, 'landingShockwave'),
		},
		combat: {
			damageMitigation: numberEffect(effects, 'damageMitigation'),
			parryWindowBonus: numberEffect(effects, 'parryWindowBonus'),
			meleeStyleBonus: numberEffect(effects, 'meleeStyleBonus'),
			finisherDamageBonus: numberEffect(effects, 'finisherDamageBonus'),
			finisherEmp: boolEffect(effects, 'finisherEmp'),
			decoyOnPerfectDodge: boolEffect(effects, 'decoyOnPerfectDodge'),
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
		landingShockwave: resolved.physics.landingShockwave,
		damageMitigation: resolved.combat.damageMitigation,
		parryWindowBonus: resolved.combat.parryWindowBonus,
		meleeStyleBonus: resolved.combat.meleeStyleBonus,
		finisherDamageBonus: resolved.combat.finisherDamageBonus,
		finisherEmp: resolved.combat.finisherEmp,
		decoyOnPerfectDodge: resolved.combat.decoyOnPerfectDodge,
		traceReduction: resolved.hacking.traceReduction,
		beatGrace: resolved.hacking.beatGrace,
	};
}

import type { RuntimeStageId } from '../world/stageLayoutRegistry';

export interface TraversalEnvironmentProfile {
	id: string;
	label: string;
	gravityMultiplier: number;
	airControlMultiplier: number;
	maxFallSpeedDelta: number;
	landingNoiseMultiplier: number;
}

const BASELINE_PROFILE: TraversalEnvironmentProfile = Object.freeze({
	id: 'city-standard',
	label: 'CITY GRAVITY // FAMILIAR WEIGHT',
	gravityMultiplier: 1,
	airControlMultiplier: 1,
	maxFallSpeedDelta: 0,
	landingNoiseMultiplier: 1,
});

const PROFILES: Record<RuntimeStageId, TraversalEnvironmentProfile> = {
	'lower-sprawl': BASELINE_PROFILE,
	drainmarket: BASELINE_PROFILE,
	'chrome-arcology': BASELINE_PROFILE,
	'mirror-palace': {
		id: 'mirror-spin',
		label: 'MIRROR SPIN // LUXURY BORROWS WEIGHT',
		gravityMultiplier: 0.84,
		airControlMultiplier: 1.08,
		maxFallSpeedDelta: -70,
		landingNoiseMultiplier: 0.82,
	},
	'dub-colony': {
		id: 'chorus-rail-light',
		label: 'CHORUS RAIL // LOW WEIGHT, LOUD LANDING',
		gravityMultiplier: 0.76,
		airControlMultiplier: 1.14,
		maxFallSpeedDelta: -105,
		landingNoiseMultiplier: 1.12,
	},
	'antenna-barrens': {
		id: 'dish-drift',
		label: 'DISH DRIFT // WIND OWNS THE SECOND JUMP',
		gravityMultiplier: 0.8,
		airControlMultiplier: 1.18,
		maxFallSpeedDelta: -90,
		landingNoiseMultiplier: 0.88,
	},
	'orbital-lift': {
		id: 'counterweight-transition',
		label: 'COUNTERWEIGHT BAND // GRAVITY IS A SCHEDULE',
		gravityMultiplier: 0.7,
		airControlMultiplier: 1.12,
		maxFallSpeedDelta: -125,
		landingNoiseMultiplier: 0.76,
	},
	'asteroid-redoubt': {
		id: 'redoubt-microgravity',
		label: 'REDOUBT ROOT // EVERY PUSH KEEPS TESTIFYING',
		gravityMultiplier: 0.62,
		airControlMultiplier: 1.2,
		maxFallSpeedDelta: -150,
		landingNoiseMultiplier: 0.65,
	},
};

export function getTraversalEnvironmentProfile(
	stageId: RuntimeStageId | undefined
): TraversalEnvironmentProfile {
	const profile = stageId ? PROFILES[stageId] : BASELINE_PROFILE;
	return { ...profile };
}

export function validateTraversalEnvironmentProfiles(): string[] {
	const errors: string[] = [];
	for (const [stageId, profile] of Object.entries(PROFILES)) {
		if (!(profile.gravityMultiplier > 0.5 && profile.gravityMultiplier <= 1)) {
			errors.push(`${stageId}: gravity multiplier must remain within readable bounds`);
		}
		if (!(profile.airControlMultiplier >= 1 && profile.airControlMultiplier <= 1.25)) {
			errors.push(`${stageId}: air control multiplier must remain within readable bounds`);
		}
		if (!(profile.maxFallSpeedDelta <= 0 && profile.maxFallSpeedDelta >= -180)) {
			errors.push(`${stageId}: max-fall delta must remain bounded`);
		}
		if (!(profile.landingNoiseMultiplier > 0.5 && profile.landingNoiseMultiplier <= 1.2)) {
			errors.push(`${stageId}: landing-noise multiplier must remain bounded`);
		}
	}
	return errors;
}

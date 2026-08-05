export type EnemyReportSourceKind =
	| 'witness'
	| 'civilian-witness'
	| 'sensor'
	| 'spoofed-sensor'
	| 'relay';

export interface EnemySourceTrustDecision {
	stageId: string;
	sourceKind: EnemyReportSourceKind;
	weight: number;
	doctrineLabel: string;
	rationale: string;
}

interface EnemySourceTrustProfile {
	label: string;
	weights: Record<EnemyReportSourceKind, number>;
	rationales: Partial<Record<EnemyReportSourceKind, string>>;
}

const DEFAULT_PROFILE: EnemySourceTrustProfile = {
	label: 'LOCAL PATROL PRAGMATISM',
	weights: {
		witness: 1,
		'civilian-witness': 0.72,
		sensor: 0.92,
		'spoofed-sensor': 0.48,
		relay: 0.82,
	},
	rationales: {
		'civilian-witness': 'Patrol doctrine treats civilian testimony as socially risky and operationally incomplete.',
		'spoofed-sensor': 'A report emitted during a compromised device state receives a severe integrity discount.',
		relay: 'Relayed knowledge loses source detail and positional confidence.',
	},
};

const STAGE_PROFILES: Partial<Record<string, EnemySourceTrustProfile>> = {
	'antenna-barrens': {
		label: 'PREDICTION OUTRANKS TESTIMONY',
		weights: {
			witness: 0.76,
			'civilian-witness': 0.46,
			sensor: 1,
			'spoofed-sensor': 0.34,
			relay: 0.84,
		},
		rationales: {
			witness: 'Forecast enforcement discounts observations that contradict the model.',
			'civilian-witness': 'Listener speech is classified as noisy unless it agrees with movement telemetry.',
			sensor: 'The Black-Ice doctrine treats calibrated prediction hardware as privileged truth.',
			'spoofed-sensor': 'Compromised forecast devices remain tempting but lose checksum authority.',
		},
	},
	'orbital-lift': {
		label: 'THE MANIFEST SPEAKS BEFORE THE PASSENGER',
		weights: {
			witness: 0.68,
			'civilian-witness': 0.42,
			sensor: 1,
			'spoofed-sensor': 0.38,
			relay: 0.9,
		},
		rationales: {
			witness: 'Customs doctrine accepts testimony only after classification.',
			'civilian-witness': 'A passenger not recognized by the manifest is treated as unverified cargo noise.',
			sensor: 'Cargo-authority eyes inherit executive claim priority.',
			relay: 'Formal chain-of-command reports retain more authority than direct local objections.',
		},
	},
	'asteroid-redoubt': {
		label: 'EXECUTIVE EYES DEFINE THE SKY',
		weights: {
			witness: 0.62,
			'civilian-witness': 0.4,
			sensor: 1,
			'spoofed-sensor': 0.3,
			relay: 0.92,
		},
		rationales: {
			witness: 'Skylock treats independent observation as an authorship challenge.',
			'civilian-witness': 'Unaffiliated receiving stations are presumed compromised until they obey executive timing.',
			sensor: 'The witness eye is trusted because Vane owns both its calibration and appeal process.',
			relay: 'Command-chain repetition is mistaken for corroboration.',
		},
	},
};

/**
 * Models institutional bias before a report reaches local consensus.
 *
 * The ledger still resolves compatible and contradictory claims. This policy
 * decides how much confidence a source receives before that neutral mechanism,
 * making district ideology legible without hard-coding behavior trees.
 */
export function resolveEnemySourceTrust(
	stageId: string,
	sourceKind: EnemyReportSourceKind
): EnemySourceTrustDecision {
	const profile = STAGE_PROFILES[stageId] ?? DEFAULT_PROFILE;
	return {
		stageId,
		sourceKind,
		weight: profile.weights[sourceKind],
		doctrineLabel: profile.label,
		rationale:
			profile.rationales[sourceKind] ??
			DEFAULT_PROFILE.rationales[sourceKind] ??
			'Local doctrine accepts the report at ordinary working confidence.',
	};
}

export function applyEnemySourceTrust(
	stageId: string,
	sourceKind: EnemyReportSourceKind,
	confidence: number
): EnemySourceTrustDecision & { rawConfidence: number; adjustedConfidence: number } {
	const decision = resolveEnemySourceTrust(stageId, sourceKind);
	const rawConfidence = clamp01(confidence);
	return {
		...decision,
		rawConfidence,
		adjustedConfidence: clamp01(rawConfidence * decision.weight),
	};
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

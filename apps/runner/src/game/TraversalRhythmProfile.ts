import type { RuntimeStageId } from '../world/stageLayoutRegistry';

export interface TraversalRhythmProfile {
	id: string;
	label: string;
	bpm: number;
	beatsPerCycle: number;
	openBeatIndices: number[];
	windowFraction: number;
	platformTravel: number;
	enabled: boolean;
}

export interface TraversalRhythmSnapshot {
	profileId: string;
	label: string;
	enabled: boolean;
	beatIndex: number;
	cycleBeatIndex: number;
	beatPhase: number;
	windowOpen: boolean;
	platformOffset: number;
	inputDelayMs: 0;
}

const CITY_PROFILE: TraversalRhythmProfile = Object.freeze({
	id: 'unmetered-city',
	label: 'UNMETERED WALK // INPUT IS NOT A SUBSCRIPTION',
	bpm: 86,
	beatsPerCycle: 4,
	openBeatIndices: [0, 1, 2, 3],
	windowFraction: 1,
	platformTravel: 0,
	enabled: false,
});

const PROFILES: Record<RuntimeStageId, TraversalRhythmProfile> = {
	'lower-sprawl': CITY_PROFILE,
	drainmarket: CITY_PROFILE,
	'chrome-arcology': CITY_PROFILE,
	'mirror-palace': {
		id: 'mirror-three-against-four',
		label: 'MIRROR POLYRHYTHM // FALSE DOORS MOVE ON THE THIRD BEAT',
		bpm: 92,
		beatsPerCycle: 4,
		openBeatIndices: [0, 2],
		windowFraction: 0.46,
		platformTravel: 26,
		enabled: true,
	},
	'dub-colony': {
		id: 'chorus-head-nod',
		label: 'CHORUS POCKET // BRIDGES ANSWER THE DOWNBEAT',
		bpm: 86,
		beatsPerCycle: 4,
		openBeatIndices: [0, 3],
		windowFraction: 0.52,
		platformTravel: 34,
		enabled: true,
	},
	'antenna-barrens': {
		id: 'forecast-five',
		label: 'FORECAST FIVE // THE DISH MISCOUNTS ON PURPOSE',
		bpm: 95,
		beatsPerCycle: 5,
		openBeatIndices: [0, 2, 4],
		windowFraction: 0.38,
		platformTravel: 30,
		enabled: true,
	},
	'orbital-lift': {
		id: 'counterweight-call-response',
		label: 'COUNTERWEIGHT CALL // RETURN ON THE NEXT BAR',
		bpm: 78,
		beatsPerCycle: 4,
		openBeatIndices: [1, 3],
		windowFraction: 0.5,
		platformTravel: 42,
		enabled: true,
	},
	'asteroid-redoubt': {
		id: 'static-prime-cycle',
		label: 'STATIC PRIME // ROOTS OPEN 2, 3, 5, 7',
		bpm: 72,
		beatsPerCycle: 8,
		openBeatIndices: [1, 2, 4, 6],
		windowFraction: 0.42,
		platformTravel: 38,
		enabled: true,
	},
};

export function getTraversalRhythmProfile(
	stageId: RuntimeStageId | undefined
): TraversalRhythmProfile {
	const profile = stageId ? PROFILES[stageId] : CITY_PROFILE;
	return { ...profile, openBeatIndices: [...profile.openBeatIndices] };
}

export function sampleTraversalRhythm(
	stageId: RuntimeStageId | undefined,
	elapsedSeconds: number
): TraversalRhythmSnapshot {
	const profile = getTraversalRhythmProfile(stageId);
	const safeTime = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
	const beats = safeTime * (profile.bpm / 60);
	const beatIndex = Math.floor(beats);
	const beatPhase = beats - beatIndex;
	const cycleBeatIndex = beatIndex % profile.beatsPerCycle;
	const centeredPhase = Math.min(beatPhase, 1 - beatPhase);
	const windowOpen =
		!profile.enabled ||
		(profile.openBeatIndices.includes(cycleBeatIndex) && centeredPhase <= profile.windowFraction / 2);
	const platformOffset = profile.enabled
		? Math.sin(beats * Math.PI * 2) * profile.platformTravel
		: 0;
	return {
		profileId: profile.id,
		label: profile.label,
		enabled: profile.enabled,
		beatIndex,
		cycleBeatIndex,
		beatPhase: round(beatPhase),
		windowOpen,
		platformOffset: round(platformOffset),
		inputDelayMs: 0,
	};
}

export function validateTraversalRhythmProfiles(): string[] {
	const errors: string[] = [];
	for (const [stageId, profile] of Object.entries(PROFILES)) {
		if (!(profile.bpm >= 60 && profile.bpm <= 120)) errors.push(`${stageId}: bpm outside traversal bounds`);
		if (!(profile.beatsPerCycle >= 2 && profile.beatsPerCycle <= 8)) {
			errors.push(`${stageId}: beat cycle outside traversal bounds`);
		}
		if (profile.openBeatIndices.some((beat) => beat < 0 || beat >= profile.beatsPerCycle)) {
			errors.push(`${stageId}: open beat outside cycle`);
		}
		if (!(profile.windowFraction > 0 && profile.windowFraction <= 1)) {
			errors.push(`${stageId}: invalid traversal window`);
		}
		if (!(profile.platformTravel >= 0 && profile.platformTravel <= 48)) {
			errors.push(`${stageId}: platform travel outside readable bounds`);
		}
	}
	return errors;
}

function round(value: number): number {
	return Math.round(value * 1000) / 1000;
}

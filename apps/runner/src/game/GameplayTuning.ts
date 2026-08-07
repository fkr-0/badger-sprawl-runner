export interface CameraProfile {
	zoom: number;
	logicalViewportWidth: number;
	playerScreenAnchorX: number;
	groundAnchorY: number;
	lookaheadScaleX: number;
	lookaheadMinX: number;
	lookaheadMaxX: number;
	followRateX: number;
	followRateFarX: number;
	farThreshold: number;
}

export interface EncounterReadinessProfile {
	offGuardNoticeSeconds: number;
	routineNoticeSeconds: number;
	alertNoticeSeconds: number;
	frontDetectionRange: number;
	rearDetectionRange: number;
	verticalDetectionRange: number;
	routinePatrolSpeed: number;
	routinePatrolRadius: number;
}

/**
 * Camera composition is presentation tuning, not simulation geometry.
 * A closer default can therefore evolve independently from movement speed.
 */
export const STORY_CAMERA_PROFILE: CameraProfile = Object.freeze({
	zoom: 1.16,
	logicalViewportWidth: 960,
	playerScreenAnchorX: 0.36,
	groundAnchorY: 494,
	lookaheadScaleX: 0.2,
	lookaheadMinX: -66,
	lookaheadMaxX: 78,
	followRateX: 4.8,
	followRateFarX: 7.8,
	farThreshold: 210,
});

export const TRAINING_CAMERA_PROFILE: CameraProfile = Object.freeze({
	...STORY_CAMERA_PROFILE,
	zoom: 1.08,
	playerScreenAnchorX: 0.42,
});

/**
 * Phase-1 readiness values intentionally create readable calm space. Full
 * stealth perception (hearing, occlusion, search, alarms) remains a later
 * encounter-layer system and can replace these heuristics without save changes.
 */
export const STORY_ENCOUNTER_READINESS_PROFILE: EncounterReadinessProfile = Object.freeze({
	offGuardNoticeSeconds: 0.72,
	routineNoticeSeconds: 0.44,
	alertNoticeSeconds: 0.16,
	frontDetectionRange: 250,
	rearDetectionRange: 92,
	verticalDetectionRange: 118,
	routinePatrolSpeed: 18,
	routinePatrolRadius: 34,
});

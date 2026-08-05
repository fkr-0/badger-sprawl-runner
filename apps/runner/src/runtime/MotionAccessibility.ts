import type { TraversalRhythmSnapshot } from '../game/TraversalRhythmProfile';

export interface TraversalMotionSnapshot extends TraversalRhythmSnapshot {
	reducedMotion: boolean;
	visualPlatformOffset: number;
	screenShakeEnabled: boolean;
	motionCue: string;
}

export interface MotionPreferenceSource {
	matchMedia?: (query: string) => { matches: boolean };
}

export function prefersReducedMotion(source: MotionPreferenceSource | undefined): boolean {
	try {
		return source?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
	} catch {
		return false;
	}
}

export function applyTraversalMotionPreference(
	snapshot: TraversalRhythmSnapshot,
	reducedMotion: boolean
): TraversalMotionSnapshot {
	return {
		...snapshot,
		reducedMotion,
		visualPlatformOffset: reducedMotion ? 0 : snapshot.platformOffset,
		screenShakeEnabled: !reducedMotion,
		motionCue: reducedMotion
			? snapshot.windowOpen
				? 'ROUTE WINDOW OPEN // STATIC PRESENTATION'
				: 'ROUTE WINDOW CLOSED // STATIC PRESENTATION'
			: snapshot.label,
	};
}

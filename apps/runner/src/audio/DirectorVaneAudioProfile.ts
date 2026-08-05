import type { DirectorVaneEvent } from '../systems/DirectorVaneController';

export type DirectorVaneWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface DirectorVaneAudioCue {
	id: string;
	label: string;
	waveform: DirectorVaneWaveform;
	frequencyHz: number;
	secondaryFrequencyHz?: number;
	durationMs: number;
	attackMs: number;
	releaseMs: number;
	gain: number;
	pan: number;
}

const STATIC_CUES: Record<string, DirectorVaneAudioCue> = {
	'phase-competence-proof': {
		id: 'vane.competence-proof',
		label: 'Benchmarked authority statement',
		waveform: 'square',
		frequencyHz: 110,
		secondaryFrequencyHz: 165,
		durationMs: 520,
		attackMs: 18,
		releaseMs: 180,
		gain: 0.24,
		pan: 0,
	},
	'phase-chromatic-lock': {
		id: 'vane.chromatic-lock',
		label: 'Conflict graph lock cycle',
		waveform: 'sawtooth',
		frequencyHz: 146.83,
		secondaryFrequencyHz: 220,
		durationMs: 640,
		attackMs: 12,
		releaseMs: 210,
		gain: 0.22,
		pan: -0.15,
	},
	'phase-counterclaim': {
		id: 'vane.counterclaim',
		label: 'Completeness claim carrier',
		waveform: 'triangle',
		frequencyHz: 196,
		secondaryFrequencyHz: 185,
		durationMs: 720,
		attackMs: 20,
		releaseMs: 260,
		gain: 0.2,
		pan: 0.15,
	},
	'phase-ownership-collapse': {
		id: 'vane.ownership-collapse',
		label: 'Command channel loses exclusivity',
		waveform: 'sawtooth',
		frequencyHz: 82.41,
		secondaryFrequencyHz: 123.47,
		durationMs: 900,
		attackMs: 8,
		releaseMs: 420,
		gain: 0.26,
		pan: 0,
	},
	contradiction: {
		id: 'vane.contradiction-closed',
		label: 'Contradiction proof closure',
		waveform: 'triangle',
		frequencyHz: 261.63,
		secondaryFrequencyHz: 246.94,
		durationMs: 680,
		attackMs: 5,
		releaseMs: 320,
		gain: 0.28,
		pan: 0,
	},
	witness: {
		id: 'vane.witness-interruption',
		label: 'Independent witness channel',
		waveform: 'sine',
		frequencyHz: 329.63,
		secondaryFrequencyHz: 392,
		durationMs: 430,
		attackMs: 35,
		releaseMs: 180,
		gain: 0.18,
		pan: 0.28,
	},
	unprotected: {
		id: 'vane.doctrine-unprotected',
		label: 'Unsupported broadcast integrity loss',
		waveform: 'square',
		frequencyHz: 73.42,
		secondaryFrequencyHz: 69.3,
		durationMs: 760,
		attackMs: 4,
		releaseMs: 350,
		gain: 0.21,
		pan: -0.25,
	},
	defeated: {
		id: 'vane.defeated',
		label: 'Operation without ownership',
		waveform: 'sine',
		frequencyHz: 130.81,
		secondaryFrequencyHz: 196,
		durationMs: 1200,
		attackMs: 60,
		releaseMs: 620,
		gain: 0.2,
		pan: 0,
	},
};

export function resolveDirectorVaneAudioCue(event: DirectorVaneEvent): DirectorVaneAudioCue {
	if (event.kind === 'vane-phase-transition') {
		return cloneCue(
			STATIC_CUES[
				event.action === 'chromatic-lock'
					? 'phase-chromatic-lock'
					: event.action === 'counterclaim'
						? 'phase-counterclaim'
						: event.action === 'ownership-collapse'
							? 'phase-ownership-collapse'
							: 'phase-competence-proof'
			] as DirectorVaneAudioCue
		);
	}
	if (event.kind === 'vane-color-window') {
		const base = 174.61 * 2 ** (event.color / 12);
		return {
			id: `vane.color-${event.color}.${event.open ? 'open' : 'closed'}`,
			label: `Skylock color ${event.color + 1} ${event.open ? 'open' : 'closed'}`,
			waveform: event.open ? 'sine' : 'square',
			frequencyHz: round(base),
			secondaryFrequencyHz: round(event.open ? base * 1.5 : base * 0.5),
			durationMs: event.open ? 240 : 310,
			attackMs: event.open ? 25 : 3,
			releaseMs: event.open ? 120 : 170,
			gain: event.open ? 0.16 : 0.2,
			pan: event.color % 2 === 0 ? -0.32 : 0.32,
		};
	}
	if (event.kind === 'vane-contradiction-closed')
		return cloneCue(STATIC_CUES.contradiction as DirectorVaneAudioCue);
	if (event.kind === 'vane-witness-interruption') {
		const cue = cloneCue(STATIC_CUES.witness as DirectorVaneAudioCue);
		cue.secondaryFrequencyHz = round(
			(cue.secondaryFrequencyHz ?? cue.frequencyHz) + event.count * 7
		);
		return cue;
	}
	if (event.kind === 'vane-doctrine-unprotected')
		return cloneCue(STATIC_CUES.unprotected as DirectorVaneAudioCue);
	return cloneCue(STATIC_CUES.defeated as DirectorVaneAudioCue);
}

export function getDirectorVaneBaselineCues(): DirectorVaneAudioCue[] {
	return [
		STATIC_CUES['phase-competence-proof'],
		STATIC_CUES['phase-chromatic-lock'],
		STATIC_CUES['phase-counterclaim'],
		STATIC_CUES['phase-ownership-collapse'],
		STATIC_CUES.contradiction,
		STATIC_CUES.witness,
		STATIC_CUES.unprotected,
		STATIC_CUES.defeated,
	].map((cue) => cloneCue(cue as DirectorVaneAudioCue));
}

function cloneCue(cue: DirectorVaneAudioCue): DirectorVaneAudioCue {
	return { ...cue };
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

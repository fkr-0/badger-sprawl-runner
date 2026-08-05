import { describe, expect, it } from 'vitest';
import { getDirectorVaneBaselineCues, resolveDirectorVaneAudioCue } from './DirectorVaneAudioProfile';

describe('DirectorVaneAudioProfile', () => {
	it('defines bounded deterministic baseline cues for every capstone function', () => {
		const cues = getDirectorVaneBaselineCues();
		expect(cues.map((cue) => cue.id)).toEqual([
			'vane.competence-proof',
			'vane.chromatic-lock',
			'vane.counterclaim',
			'vane.ownership-collapse',
			'vane.contradiction-closed',
			'vane.witness-interruption',
			'vane.doctrine-unprotected',
			'vane.defeated',
		]);
		expect(cues.every((cue) => cue.gain > 0 && cue.gain <= 0.3)).toBe(true);
		expect(cues.every((cue) => cue.durationMs >= 200 && cue.durationMs <= 1500)).toBe(true);
	});

	it('derives chromatic and witness variations from public event data', () => {
		expect(resolveDirectorVaneAudioCue({ kind: 'vane-color-window', color: 1, open: true })).toMatchObject({
			id: 'vane.color-1.open',
			waveform: 'sine',
			pan: 0.32,
		});
		expect(resolveDirectorVaneAudioCue({ kind: 'vane-witness-interruption', count: 3 })).toMatchObject({
			id: 'vane.witness-interruption',
			secondaryFrequencyHz: 413,
		});
	});
});

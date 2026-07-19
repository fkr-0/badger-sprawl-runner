import { describe, expect, it } from 'vitest';
import { getDialoguePortrait } from './DialoguePortraitRenderer';

describe('DALLE-backed story portraits', () => {
	it.each([
		['Mina', 'character_dr_mina_suture'],
		['Juno', 'character_juno_jar'],
		['Lio', 'character_lio'],
		['Little Ix', 'character_little_ix'],
		['Vitrine', 'character_madame_vitrine'],
		['Reflection Judge', 'character_reflection_judge'],
		['King Feedback', 'character_king_feedback'],
		['Mara', 'character_mara_modulo'],
		['Fox', 'character_black_ice_fox'],
		['Elevator Angel', 'character_elevator_angel'],
		['Vane', 'character_director_vane'],
	] as const)('maps %s to %s', (speaker, sheetId) => {
		expect(getDialoguePortrait(speaker)).toMatchObject({ sheetId, animation: 'talk' });
	});

	it('retains a readable fallback for unbound speakers', () => {
		expect(getDialoguePortrait('Unknown Signal')).toMatchObject({
			sheetId: '',
			fallbackLabel: 'UNK',
		});
	});
});

import type { SpriteRenderer } from './SpriteRenderer';

export interface DialoguePortrait {
	speaker: string;
	sheetId: string;
	animation: string;
	fallbackLabel: string;
}

const SPEAKER_PORTRAITS: Record<string, DialoguePortrait> = {
	Auntie: {
		speaker: 'Auntie',
		sheetId: 'character_auntie_subharmonic',
		animation: 'talk',
		fallbackLabel: 'AUN',
	},
	'Auntie Subharmonic': {
		speaker: 'Auntie Subharmonic',
		sheetId: 'character_auntie_subharmonic',
		animation: 'talk',
		fallbackLabel: 'AUN',
	},
	Lio: {
		speaker: 'Lio',
		sheetId: 'character_lio',
		animation: 'talk',
		fallbackLabel: 'LIO',
	},
	Juno: {
		speaker: 'Juno',
		sheetId: 'character_juno_jar',
		animation: 'talk',
		fallbackLabel: 'JUN',
	},
	Mina: {
		speaker: 'Mina',
		sheetId: 'character_dr_mina_suture',
		animation: 'talk',
		fallbackLabel: 'MIN',
	},
	Pell: {
		speaker: 'Pell',
		sheetId: 'character_foreman_pell',
		animation: 'talk',
		fallbackLabel: 'PEL',
	},
	Vitrine: {
		speaker: 'Vitrine',
		sheetId: 'character_madame_vitrine',
		animation: 'talk',
		fallbackLabel: 'VIT',
	},
	'Reflection Judge': {
		speaker: 'Reflection Judge',
		sheetId: 'character_reflection_judge',
		animation: 'talk',
		fallbackLabel: 'JDG',
	},
	Cobalt: {
		speaker: 'Cobalt',
		sheetId: 'character_cobalt_carmine',
		animation: 'talk',
		fallbackLabel: 'COB',
	},
	'DJ Calculus': {
		speaker: 'DJ Calculus',
		sheetId: 'character_dj_calculus',
		animation: 'talk',
		fallbackLabel: 'DJC',
	},
	'Little Ix': {
		speaker: 'Little Ix',
		sheetId: 'character_little_ix',
		animation: 'talk',
		fallbackLabel: 'LIX',
	},
	'King Feedback': {
		speaker: 'King Feedback',
		sheetId: 'character_king_feedback',
		animation: 'talk',
		fallbackLabel: 'KNG',
	},
	Mara: {
		speaker: 'Mara',
		sheetId: 'character_mara_modulo',
		animation: 'talk',
		fallbackLabel: 'MAR',
	},
	Fox: {
		speaker: 'Fox',
		sheetId: 'character_black_ice_fox',
		animation: 'talk',
		fallbackLabel: 'FOX',
	},
	'Elevator Angel': {
		speaker: 'Elevator Angel',
		sheetId: 'character_elevator_angel',
		animation: 'talk',
		fallbackLabel: 'ANG',
	},
	Vane: {
		speaker: 'Vane',
		sheetId: 'character_director_vane',
		animation: 'talk',
		fallbackLabel: 'VAN',
	},
	Moss: {
		speaker: 'Moss',
		sheetId: 'moss_badger',
		animation: 'idle',
		fallbackLabel: 'MOS',
	},
	'Murr Murrby': {
		speaker: 'Murr Murrby',
		sheetId: 'character_murr_murrby',
		animation: 'talk',
		fallbackLabel: 'MUR',
	},
	'Naya Root': {
		speaker: 'Naya Root',
		sheetId: 'character_naya_root',
		animation: 'talk',
		fallbackLabel: 'NAY',
	},
	'Pirate Chorus': {
		speaker: 'Pirate Chorus',
		sheetId: 'character_auntie_subharmonic',
		animation: 'assist',
		fallbackLabel: 'CHO',
	},
	Rook: {
		speaker: 'Rook',
		sheetId: 'character_rook_null',
		animation: 'talk',
		fallbackLabel: 'ROO',
	},
	'Rook Null': {
		speaker: 'Rook Null',
		sheetId: 'character_rook_null',
		animation: 'talk',
		fallbackLabel: 'ROO',
	},
	'Sister Version': {
		speaker: 'Sister Version',
		sheetId: 'character_sister_version',
		animation: 'talk',
		fallbackLabel: 'SIS',
	},
	'The Choir of Static': {
		speaker: 'The Choir of Static',
		sheetId: 'character_auntie_subharmonic',
		animation: 'assist',
		fallbackLabel: 'STA',
	},
};

export function getDialoguePortrait(speaker: string): DialoguePortrait {
	return (
		SPEAKER_PORTRAITS[speaker] ?? {
			speaker,
			sheetId: '',
			animation: 'talk',
			fallbackLabel: speaker.slice(0, 3).toUpperCase(),
		}
	);
}

export class DialoguePortraitRenderer {
	render(
		ctx: CanvasRenderingContext2D,
		spriteRenderer: SpriteRenderer | undefined,
		speaker: string,
		x: number,
		y: number,
		size = 72
	): void {
		const portrait = getDialoguePortrait(speaker);
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.84)';
		ctx.fillRect(x, y, size, size);
		ctx.strokeStyle = '#67f3c4';
		ctx.lineWidth = 2;
		ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

		if (portrait.sheetId && spriteRenderer?.hasSheet(portrait.sheetId)) {
			ctx.save();
			ctx.translate(x + 12, y + 12);
			ctx.scale(1, 1);
			spriteRenderer.drawFrame(
				portrait.sheetId,
				portrait.animation,
				Math.floor(Date.now() / 180) % 6,
				0,
				0
			);
			ctx.restore();
		} else {
			ctx.fillStyle = '#1a1d26';
			ctx.fillRect(x + 10, y + 10, size - 20, size - 20);
			ctx.fillStyle = '#eaf2ff';
			ctx.font = '700 16px ui-monospace, monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(portrait.fallbackLabel, x + size / 2, y + size / 2);
		}
		ctx.restore();
	}
}

import type { SpriteRenderer } from './SpriteRenderer';

export interface DialoguePortrait {
	speaker: string;
	sheetId: string;
	animation: string;
	fallbackLabel: string;
}

const SPEAKER_PORTRAITS: Record<string, DialoguePortrait> = {
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
			spriteRenderer.drawFrame(portrait.sheetId, portrait.animation, Math.floor(Date.now() / 180) % 6, 0, 0);
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

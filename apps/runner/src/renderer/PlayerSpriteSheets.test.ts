import type { LoadedSheet, SpriteSheet } from '@badger/sprite-contracts';
import { describe, expect, it } from 'vitest';
import {
	PLAYER_REMAINING_GAPS_SPRITE_SHEET_ID,
	PLAYER_SPRITE_SHEET_ID,
	resolvePlayerSpriteSheet,
} from './PlayerSpriteSheets';

function loaded(id: string, animations: string[]): LoadedSheet {
	const sheet = {
		id,
		file: `${id}.png`,
		frameSize: [48, 48],
		animations: Object.fromEntries(
			animations.map((name) => [name, { frames: 1, fps: 1, anchor: [24, 44] }])
		),
	} as SpriteSheet;
	return { sheet } as LoadedSheet;
}

function lookup(sheets: LoadedSheet[]) {
	const byId = new Map(sheets.map((sheet) => [sheet.sheet.id, sheet]));
	return { getSheet: (id: string) => byId.get(id) };
}

describe('resolvePlayerSpriteSheet', () => {
	it('uses an expansion sheet for an authored expansion animation', () => {
		const production = loaded(PLAYER_SPRITE_SHEET_ID, ['idle']);
		const expansion = loaded(PLAYER_REMAINING_GAPS_SPRITE_SHEET_ID, ['air_dodge']);

		expect(resolvePlayerSpriteSheet(lookup([production, expansion]), 'air_dodge')).toBe(expansion);
	});

	it('keeps existing player animations on the production sheet', () => {
		const production = loaded(PLAYER_SPRITE_SHEET_ID, ['idle']);
		const expansion = loaded(PLAYER_REMAINING_GAPS_SPRITE_SHEET_ID, ['air_dodge']);

		expect(resolvePlayerSpriteSheet(lookup([production, expansion]), 'idle')).toBe(production);
	});

	it('falls back to the production sheet for an unknown animation', () => {
		const production = loaded(PLAYER_SPRITE_SHEET_ID, ['idle']);

		expect(resolvePlayerSpriteSheet(lookup([production]), 'future_clip')).toBe(production);
	});
});

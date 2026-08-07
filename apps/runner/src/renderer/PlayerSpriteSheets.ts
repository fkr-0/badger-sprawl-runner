import type { LoadedSheet } from '@badger/sprite-contracts';
import type { SpriteRenderer } from './SpriteRenderer';

export const PLAYER_SPRITE_SHEET_ID = 'moss_badger_production';
export const PLAYER_REMAINING_GAPS_SPRITE_SHEET_ID = 'moss_remaining_animation_gaps';

const PLAYER_EXTENSION_SHEET_IDS = [PLAYER_REMAINING_GAPS_SPRITE_SHEET_ID] as const;

type PlayerSheetLookup = Pick<SpriteRenderer, 'getSheet'>;

/**
 * Resolve the authored sheet that owns a player animation.
 *
 * Expansion sheets take precedence for their explicitly authored clips while
 * the production atlas remains the stable fallback for all existing states.
 */
export function resolvePlayerSpriteSheet(
	sprites: PlayerSheetLookup,
	animationName: string
): LoadedSheet | null {
	for (const sheetId of PLAYER_EXTENSION_SHEET_IDS) {
		const sheet = sprites.getSheet(sheetId);
		if (sheet?.sheet.animations[animationName]) return sheet;
	}

	const production = sprites.getSheet(PLAYER_SPRITE_SHEET_ID);
	if (production?.sheet.animations[animationName]) return production;
	if (production) return production;

	for (const sheetId of PLAYER_EXTENSION_SHEET_IDS) {
		const sheet = sprites.getSheet(sheetId);
		if (sheet) return sheet;
	}
	return null;
}

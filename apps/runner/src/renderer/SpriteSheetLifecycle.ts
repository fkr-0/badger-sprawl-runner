import type { SpriteSheet } from '@badger/sprite-contracts';

export function isRuntimeSpriteSheet(sheet: SpriteSheet): boolean {
	return sheet.source?.classification !== 'archival';
}

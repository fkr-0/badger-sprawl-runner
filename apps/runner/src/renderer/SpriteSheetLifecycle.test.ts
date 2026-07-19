import { describe, expect, it } from 'vitest';
import type { SpriteSheet } from '@badger/sprite-contracts';
import { isRuntimeSpriteSheet } from './SpriteSheetLifecycle';

function sheet(source?: Record<string, unknown>): SpriteSheet {
	return {
		id: 'test',
		file: 'assets/sprites/test.png',
		frameSize: [16, 16],
		animations: { idle: { frames: 1, fps: 1 } },
		...(source ? { source } : {}),
	};
}

describe('sprite sheet lifecycle', () => {
	it('loads runtime sheets and excludes explicit archival sources', () => {
		expect(isRuntimeSpriteSheet(sheet())).toBe(true);
		expect(isRuntimeSpriteSheet(sheet({ revision: 'production' }))).toBe(true);
		expect(isRuntimeSpriteSheet(sheet({ classification: 'archival' }))).toBe(false);
	});
});

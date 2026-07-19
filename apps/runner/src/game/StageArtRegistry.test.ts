import { describe, expect, it } from 'vitest';
import { RUNTIME_STAGE_IDS } from '../world/stageLayoutRegistry';
import { STAGE_PLATFORM_ART, getStagePlatformArt } from './StageArtRegistry';

describe('StageArtRegistry', () => {
	it('provides sprite-backed platform art for every runtime stage', () => {
		expect(Object.keys(STAGE_PLATFORM_ART).sort()).toEqual([...RUNTIME_STAGE_IDS].sort());
		for (const stageId of RUNTIME_STAGE_IDS) {
			const art = getStagePlatformArt(stageId);
			expect(art.sheetId).toMatch(/_tiles$/);
			expect(art.surfaceAnimation).toBeTruthy();
			expect(art.bodyAnimation).toBeTruthy();
			expect(art.decorations.length).toBeGreaterThanOrEqual(3);
		}
	});
});

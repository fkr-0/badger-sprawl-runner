import { describe, expect, it } from 'vitest';
import {
	EXTENDED_ITEM_ICON_SHEET_ID,
	EXTENDED_ITEM_SHEET_ID,
	FIRST_RELEASE_ITEM_CATALOG,
	getFirstReleaseItem,
} from './FirstReleaseItemCatalog';

describe('FirstReleaseItemCatalog', () => {
	it('registers the complete 23-item release catalog', () => {
		expect(FIRST_RELEASE_ITEM_CATALOG).toHaveLength(23);
		expect(new Set(FIRST_RELEASE_ITEM_CATALOG.map((item) => item.id)).size).toBe(23);
		expect(FIRST_RELEASE_ITEM_CATALOG.every((item) => Boolean(item.iconAnimation))).toBe(true);
		expect(FIRST_RELEASE_ITEM_CATALOG.every((item) => Boolean(item.pickupAnimation))).toBe(true);
	});

	it('binds the eight new gear pieces to their dedicated pickup and icon sheets', () => {
		for (const itemId of [
			'capacitor_coil',
			'phase_mantle',
			'ledger_lens',
			'echo_spurs',
			'rail_heat_sink',
			'rootkit_badge',
			'shock_fern',
			'mirror_thread',
		]) {
			expect(getFirstReleaseItem(itemId)).toMatchObject({
				iconSheetId: EXTENDED_ITEM_ICON_SHEET_ID,
				pickupSheetId: EXTENDED_ITEM_SHEET_ID,
				effects: expect.any(Object),
			});
		}
	});
});

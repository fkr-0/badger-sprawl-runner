import { describe, expect, it } from 'vitest';
import { rollDropTable, type DropTable } from './ItemDropSystem';

const table: DropTable = {
	id: 'drone-cache',
	guaranteed: [{ itemId: 'scrap', weight: 1, minQuantity: 1, maxQuantity: 1 }],
	entries: [
		{ itemId: 'stim_cache', weight: 4, minQuantity: 1, maxQuantity: 1 },
		{ itemId: 'black_ice_tooth', weight: 1, minQuantity: 1, maxQuantity: 1, requiresTag: 'elite' },
		{ itemId: 'bassline_boots', weight: 2, minQuantity: 1, maxQuantity: 2 },
	],
};

describe('ItemDropSystem', () => {
	it('rolls identical drops for identical seed, run, source, and table', () => {
		const context = { seed: 'release-run', runId: 'r1', sourceId: 'drone-a', sourceTags: ['elite'] };
		const first = rollDropTable(table, context, 3);
		const second = rollDropTable(table, context, 3);

		expect(first).toEqual(second);
		expect(first[0]).toEqual({ itemId: 'scrap', quantity: 1, sourceId: 'drone-a', tableId: 'drone-cache' });
	});

	it('filters entries by source tags deterministically', () => {
		const drops = rollDropTable(table, { seed: 'release-run', runId: 'r1', sourceId: 'drone-b', sourceTags: [] }, 20);

		expect(drops.every((drop) => drop.itemId !== 'black_ice_tooth')).toBe(true);
	});
});

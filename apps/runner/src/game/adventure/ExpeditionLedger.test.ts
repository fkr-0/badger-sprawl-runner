import { describe, expect, it } from 'vitest';
import {
	buildExpeditionLaunchState,
	createDefaultExpeditionState,
	degradeEquippedItems,
} from './ExpeditionLedger';

describe('expedition ledger', () => {
	it('hydrates only owned, serviceable equipment into an expedition', () => {
		const launch = buildExpeditionLaunchState({
			inventory: [
				{ itemId: 'signal_jammer', quantity: 1 },
				{ itemId: 'phase_pick', quantity: 1 },
			],
			equippedItemIds: ['signal_jammer', 'phase_pick', 'missing'],
			itemStates: {
				signal_jammer: { condition: 0, maxCondition: 100, repairCount: 0 },
				phase_pick: {
					condition: 75,
					maxCondition: 100,
					modificationId: 'public-audit-port',
					repairCount: 1,
				},
			},
			expedition: createDefaultExpeditionState({ integrity: 4, injuries: 1 }),
		});

		expect(launch.equippedItemIds).toEqual(['phase_pick']);
		expect(launch.itemStates.phase_pick).toMatchObject({
			condition: 75,
			modificationId: 'public-audit-port',
		});
		expect(launch).toMatchObject({ integrity: 4, injuries: 1 });
	});

	it('applies bounded wear only to equipped non-starter gear', () => {
		const result = degradeEquippedItems(
			{
				claws: { condition: 100, maxCondition: 100, repairCount: 0 },
				signal_jammer: { condition: 30, maxCondition: 100, repairCount: 0 },
				phase_pick: { condition: 50, maxCondition: 100, repairCount: 0 },
			},
			['claws', 'signal_jammer'],
			12
		);

		expect(result.claws?.condition).toBe(100);
		expect(result.signal_jammer?.condition).toBe(18);
		expect(result.phase_pick?.condition).toBe(50);
	});
});

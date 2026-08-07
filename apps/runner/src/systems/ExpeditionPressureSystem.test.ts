import { describe, expect, it } from 'vitest';
import { ExpeditionPressureSystem } from './ExpeditionPressureSystem';
import { STORY_CONTINUITY_RESET_POLICY } from './StageCheckpointSystem';

describe('ExpeditionPressureSystem', () => {
	it('deduplicates salvage, banks at checkpoints, and settles remaining field value', () => {
		const pressure = new ExpeditionPressureSystem();
		expect(pressure.collect('guard-a', 2)).toEqual([
			expect.objectContaining({ kind: 'salvage-collected', amount: 2 }),
		]);
		expect(pressure.collect('guard-a', 2)).toEqual([]);
		pressure.collect('relay-cache', 3);
		expect(pressure.activateCheckpoint('market-relay')).toEqual([
			expect.objectContaining({ kind: 'salvage-banked', amount: 5, bankedSalvage: 5 }),
		]);
		pressure.collect('guard-b', 4);
		expect(pressure.settleExpedition()).toEqual([
			expect.objectContaining({ kind: 'expedition-settled', amount: 4, bankedSalvage: 9 }),
		]);
		expect(pressure.settleExpedition()).toEqual([]);
		expect(pressure.getSnapshot()).toMatchObject({
			unbankedSalvage: 0,
			bankedSalvage: 9,
			lostSalvage: 0,
		});
	});

	it('loses only the policy-bounded unbanked share on respawn', () => {
		const pressure = new ExpeditionPressureSystem();
		pressure.collect('banked', 6);
		pressure.activateCheckpoint('clinic-crossing');
		pressure.collect('at-risk', 5);

		const events = pressure.respawn('clinic-crossing', STORY_CONTINUITY_RESET_POLICY);
		expect(events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: 'salvage-lost',
					amount: 2,
					remainingUnbanked: 3,
				}),
				expect.objectContaining({
					kind: 'pressure-reset-applied',
					policy: expect.objectContaining({ enemies: 'preserve-defeated' }),
				}),
			])
		);
		expect(pressure.getSnapshot()).toMatchObject({
			bankedSalvage: 6,
			unbankedSalvage: 3,
			lostSalvage: 2,
			deaths: 1,
		});
	});
});

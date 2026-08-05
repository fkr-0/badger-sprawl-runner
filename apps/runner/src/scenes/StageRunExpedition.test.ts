import { describe, expect, it } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene persistent expedition projection', () => {
	it('hydrates inventory, equipment, condition, modification effects, and integrity', () => {
		const scene = new StageRunScene({
			stageId: 'lower-sprawl',
			expedition: {
				inventory: [
					{ itemId: 'signal_jammer', quantity: 1 },
					{ itemId: 'stim_pack', quantity: 2 },
				],
				equippedItemIds: ['signal_jammer'],
				itemStates: {
					signal_jammer: {
						condition: 72,
						maxCondition: 100,
						modificationId: 'subharmonic-tuning',
						repairCount: 1,
					},
					stim_pack: { condition: 100, maxCondition: 100, repairCount: 0 },
				},
				integrity: 4,
				maxIntegrity: 7,
				injuries: 1,
			},
		});

		expect(scene.getExpeditionSnapshot()).toMatchObject({
			inventory: expect.arrayContaining([
				expect.objectContaining({ itemId: 'signal_jammer', quantity: 1 }),
				expect.objectContaining({ itemId: 'stim_pack', quantity: 2 }),
			]),
			equippedItemIds: ['signal_jammer'],
			integrity: 4,
			maxIntegrity: 7,
			injuries: 1,
		});
		expect(scene.getLoadoutSnapshot().effects).toMatchObject({
			traceReduction: 0.14,
			beatGrace: 0.045,
		});
		expect(scene.getPlayerSnapshot().stims).toBe(2);
	});

	it('does not equip broken persistent items and preserves the starter fallback', () => {
		const scene = new StageRunScene({
			stageId: 'lower-sprawl',
			expedition: {
				inventory: [{ itemId: 'signal_jammer', quantity: 1 }],
				equippedItemIds: ['signal_jammer'],
				itemStates: {
					signal_jammer: { condition: 0, maxCondition: 100, repairCount: 0 },
				},
				integrity: 6,
				maxIntegrity: 6,
				injuries: 0,
			},
		});

		expect(scene.getExpeditionSnapshot().equippedItemIds).toEqual(['claws']);
	});
});

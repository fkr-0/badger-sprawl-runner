import { describe, expect, it } from 'vitest';
import { WorldDirector } from './WorldDirector';
import { ExpeditionDirector } from './ExpeditionDirector';

describe('ExpeditionDirector', () => {
	it('commits the bounded stage ledger and reward journal atomically', () => {
		const world = new WorldDirector();
		const director = new ExpeditionDirector(world);

		expect(
			director.commitStageResult({
				stageId: 'lower-sprawl',
				completedQuestIds: [],
				completedMinigameIds: [],
				completedTutorialIds: [],
				rewardDrops: [
					{
						itemId: 'stim_pack',
						quantity: 1,
						tableId: 'story:lower-sprawl',
						sourceId: 'stage-complete:lower-sprawl',
					},
				],
				expeditionCommit: {
					runId: 'run:lower-sprawl:test:1',
					stageId: 'lower-sprawl',
					inventory: [{ itemId: 'stim_pack', quantity: 1 }],
					equippedItemIds: [],
					itemStates: {
						stim_pack: { condition: 100, maxCondition: 100, repairCount: 0 },
					},
					integrity: 5,
					maxIntegrity: 6,
					injuries: 1,
					bankedSalvage: 7,
				},
			})
		).toMatchObject({ ok: true, changed: true, salvageCredchips: 7 });
	
		expect(world.getState()).toMatchObject({
			inventory: [{ itemId: 'stim_pack', quantity: 1 }],
			expedition: {
				completedRuns: 1,
				lastStageId: 'lower-sprawl',
				integrity: 5,
				settledRunIds: ['run:lower-sprawl:test:1'],
			},
			economy: { rewardItemCount: 1, earnedCredchips: 7 },
		});

		expect(
			director.commitStageResult({
				stageId: 'lower-sprawl',
				completedQuestIds: [],
				completedMinigameIds: [],
				completedTutorialIds: [],
				expeditionCommit: {
					runId: 'run:lower-sprawl:test:1',
					stageId: 'lower-sprawl',
					inventory: [{ itemId: 'stim_pack', quantity: 1 }],
					equippedItemIds: [],
					itemStates: {},
					integrity: 5,
					maxIntegrity: 6,
					injuries: 1,
					bankedSalvage: 7,
				},
			})
		).toMatchObject({ ok: true, changed: false, salvageCredchips: 0 });
	});
});

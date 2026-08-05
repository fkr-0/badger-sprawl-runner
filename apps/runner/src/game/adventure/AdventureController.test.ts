import { describe, expect, it } from 'vitest';
import { createGameFlow, type GameFlow } from '../GameFlow';
import { AdventureController } from './AdventureController';
import { WorldDirector } from './WorldDirector';

function enterCurrentStage(flow: GameFlow): void {
	flow.selectMenu('story');
	if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
	for (let safety = 0; safety < 20 && flow.getState().mode === 'dialogue'; safety += 1) {
		flow.advanceDialogue();
	}
}

describe('AdventureController', () => {
	it('completes story, world, and global quest progress through one application boundary', () => {
		const flow = createGameFlow();
		const world = new WorldDirector();
		const adventure = new AdventureController(flow, world);
		enterCurrentStage(flow);

		adventure.completeStoryStage({
			stageId: 'lower-sprawl',
			completedQuestIds: ['lower-sprawl:main'],
			completedMinigameIds: [],
			completedTutorialIds: [],
			resolutionApproaches: ['hacking', 'ghoststep'],
			resolutionConstraints: { nonLethal: true, undetected: false },
			rewardDrops: [
				{
					itemId: 'stim_pack',
					quantity: 1,
					tableId: 'story:lower-sprawl',
					sourceId: 'stage-complete:lower-sprawl',
				},
			],
			expeditionCommit: {
				runId: 'run:lower-sprawl:controller:1',
				stageId: 'lower-sprawl',
				inventory: [
					{ itemId: 'claws', quantity: 1 },
					{ itemId: 'stim_pack', quantity: 1 },
				],
				equippedItemIds: ['claws'],
				itemStates: {
					claws: { condition: 100, maxCondition: 100, repairCount: 0 },
					stim_pack: { condition: 100, maxCondition: 100, repairCount: 0 },
				},
				integrity: 4,
				maxIntegrity: 5,
				injuries: 1,
				bankedSalvage: 6,
			},
		});

		expect(flow.getStoryProgress().completedStageIds).toContain('lower-sprawl');
		expect(flow.getMeta().credchips).toBe(6);
		expect(world.getState()).toMatchObject({
			districtPhases: { 'lower-sprawl': 'transformed' },
			questStates: {
				'main:the-city-moves': { status: 'active', stepId: 'open-the-floodline' },
			},
		});
		expect(world.getState().unlockedRouteIds).toContain('transit:lower-sprawl:drainmarket');
		expect(world.getState().advancement).toMatchObject({
			level: 2,
			mastery: { hacking: 1, ghoststep: 1 },
			claimedRewardIds: expect.arrayContaining([
				'quest:lower-sprawl:main-song-of-the-toll',
				'resolution:lower-sprawl:story-stage-complete',
			]),
		});
		expect(world.getState()).toMatchObject({
			inventory: expect.arrayContaining([
				expect.objectContaining({ itemId: 'stim_pack', quantity: 1 }),
			]),
			expedition: {
				integrity: 4,
				injuries: 1,
				completedRuns: 1,
				lastStageId: 'lower-sprawl',
				settledRunIds: ['run:lower-sprawl:controller:1'],
			},
			economy: { rewardItemCount: 1, earnedCredchips: 6 },
		});
	});

	it('settles an optional expedition without advancing authored story or quests', () => {
		const flow = createGameFlow();
		const world = new WorldDirector();
		const adventure = new AdventureController(flow, world);
		const beforeStory = flow.getStoryProgress();
		const beforeQuestStates = world.getState().questStates;

		const result = adventure.completeOptionalExpedition({
			stageId: 'lower-sprawl',
			completedQuestIds: ['lower-sprawl:main'],
			completedMinigameIds: ['toll-gate-rhythm'],
			completedTutorialIds: [],
			expeditionCommit: {
				runId: 'undercity:controller:1',
				stageId: 'lower-sprawl',
				inventory: [{ itemId: 'claws', quantity: 1 }],
				equippedItemIds: ['claws'],
				itemStates: {
					claws: { condition: 96, maxCondition: 100, repairCount: 0 },
				},
				integrity: 5,
				maxIntegrity: 5,
				injuries: 0,
				bankedSalvage: 4,
			},
		});

		expect(result).toEqual({ salvageCredchips: 4 });
		expect(flow.getMeta().credchips).toBe(4);
		expect(flow.getStoryProgress()).toEqual(beforeStory);
		expect(world.getState().questStates).toEqual(beforeQuestStates);
		expect(world.getState().expedition).toMatchObject({
			completedRuns: 1,
			settledRunIds: ['undercity:controller:1'],
		});
	});
});


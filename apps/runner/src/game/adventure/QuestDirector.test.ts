import { describe, expect, it } from 'vitest';
import { QuestDirector } from './QuestDirector';
import { WorldDirector } from './WorldDirector';

describe('QuestDirector', () => {
	it('advances an authored step after all objectives reach target', () => {
		const world = new WorldDirector();
		const quests = new QuestDirector(world);

		const result = quests.recordObjective(
			'main:the-city-moves',
			'lower-sprawl-resolved',
			1
		);

		expect(result).toMatchObject({ ok: true, stepCompleted: true, stepId: 'open-the-floodline' });
		expect(world.getState().questStates['main:the-city-moves']).toMatchObject({
			status: 'active',
			stepId: 'open-the-floodline',
		});
		expect(world.getState().worldFlags).toContain('main:blue-mercy-awake');
	});

	it('applies a single authored consequence through world commands', () => {
		const world = new WorldDirector();
		const quests = new QuestDirector(world);
		quests.startQuest('lower-sprawl:side-last-fare-home');
		quests.recordObjective('lower-sprawl:side-last-fare-home', 'ghost-stops', 3);
		const result = quests.recordObjective(
			'lower-sprawl:side-last-fare-home',
			'survivor-consent',
			3
		);

		expect(result.questCompleted).toBe(true);
		expect(world.getState().worldFlags).toContain('lower-sprawl:mercy-stops-restored');
	});

	it('requires an explicit branch choice for multi-consequence evidence quests', () => {
		const world = new WorldDirector();
		const quests = new QuestDirector(world);
		quests.startQuest('lower-sprawl:side-no-receipt-for-grief');
		quests.recordObjective('lower-sprawl:side-no-receipt-for-grief', 'warrants', 6);
		const pending = quests.recordObjective(
			'lower-sprawl:side-no-receipt-for-grief',
			'record-choice',
			1
		);

		expect(pending).toMatchObject({ failure: 'consequence-required', stepCompleted: true });
		expect(pending.awaitingConsequenceIds).toContain('redacted-case');
		const resolved = quests.chooseConsequence(
			'lower-sprawl:side-no-receipt-for-grief',
			'redacted-case'
		);
		expect(resolved.questCompleted).toBe(true);
		expect(world.getState().worldFlags).toContain('lower-sprawl:warrants-redacted-public');
	});

	it('maps stage completion through the global story quest', () => {
		const world = new WorldDirector();
		const quests = new QuestDirector(world);
		quests.recordStoryStageCompletion('lower-sprawl');
		quests.recordStoryStageCompletion('drainmarket');

		expect(world.getState().questStates['main:the-city-moves'].stepId).toBe(
			'steal-the-elevator-seed'
		);
	});
});


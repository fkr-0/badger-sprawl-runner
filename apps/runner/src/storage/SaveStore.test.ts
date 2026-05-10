import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { createMemorySaveDriver, loadGameFlow, saveGameFlow } from './SaveStore';

describe('save store', () => {
	it('round-trips game meta through a storage driver', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow({ blueprintShards: 1 });

		expect(flow.purchaseSkill('double_swipe').ok).toBe(true);
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getMeta()).toMatchObject({
			blueprintShards: 0,
			purchasedSkills: ['double_swipe'],
		});
	});



	it('round-trips story progress through a storage driver', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow();

		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		while (flow.getState().mode === 'dialogue') flow.advanceDialogue();
		flow.completeStage();
		while (flow.getState().mode === 'debrief') flow.advanceDebrief();
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'drainmarket',
			completedStageIds: ['lower-sprawl'],
			acquiredPayloads: ['wafer_key'],
		});
	});



	it('persists the Lio trust branch through save/load', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow(undefined, { currentStageId: 'mirror-palace' });

		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		while (flow.getState().mode === 'dialogue') flow.advanceDialogue();
		flow.chooseStageChoice(2);
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'mirror-palace',
			lioTrust: 'baited',
			resultFlags: ['lio_baited'],
		});
	});



	it('persists the colony alignment branch through save/load', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow(undefined, { currentStageId: 'dub-colony' });

		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		while (flow.getState().mode === 'dialogue') flow.advanceDialogue();
		flow.chooseStageChoice(2);
		saveGameFlow(driver, flow);

		const loaded = loadGameFlow(driver);
		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'dub-colony',
			colonyAlignment: 'supplier',
			resultFlags: ['colony_alignment_supplier'],
		});
	});



	it('persists final broadcast doctrine and campaign completion', () => {
		const driver = createMemorySaveDriver();
		const flow = createGameFlow(undefined, {
			currentStageId: 'asteroid-redoubt',
			campaignComplete: true,
			finalBroadcastDoctrine: 'abolish-skylock',
			resultFlags: ['broadcast_abolish_skylock'],
		});

		saveGameFlow(driver, flow);
		const loaded = loadGameFlow(driver);

		expect(loaded.getStoryProgress()).toMatchObject({
			currentStageId: 'asteroid-redoubt',
			campaignComplete: true,
			finalBroadcastDoctrine: 'abolish-skylock',
			resultFlags: ['broadcast_abolish_skylock'],
		});
	});

	it('falls back to a new flow when stored data is corrupt', () => {
		const driver = createMemorySaveDriver();
		driver.setItem('badger-sprawl-runner.save.v1', '{not-json');

		const loaded = loadGameFlow(driver);

		expect(loaded.getMeta()).toMatchObject({ blueprintShards: 0, purchasedSkills: [] });
	});
});

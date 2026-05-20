import { describe, expect, it } from 'vitest';
import { createGameFlow } from './GameFlow';

function advanceCurrentDialogue(flow: ReturnType<typeof createGameFlow>): void {
	for (let safety = 0; safety < 16 && flow.getState().mode === 'dialogue'; safety += 1) {
		flow.advanceDialogue();
	}
}

function advanceCurrentDebrief(flow: ReturnType<typeof createGameFlow>): void {
	for (let safety = 0; safety < 16 && flow.getState().mode === 'debrief'; safety += 1) {
		flow.advanceDebrief();
	}
}

function enterCurrentStage(flow: ReturnType<typeof createGameFlow>): void {
	if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
	advanceCurrentDialogue(flow);
}

describe('Badger Sprawl Runner game flow', () => {
	it('starts on a working menu with story, versus, training, and skills entries', () => {
		const flow = createGameFlow();

		expect(flow.getState().mode).toBe('menu');
		expect(flow.getMenuOptions().map((option) => option.id)).toEqual([
			'story',
			'versus',
			'training',
			'skills',
		]);
	});

	it('shows a placard title card before briefing and routes stage completion through debrief and boss contract', () => {
		const flow = createGameFlow();

		flow.selectMenu('story');
		expect(flow.getState()).toMatchObject({
			mode: 'title-card',
			stageId: 'lower-sprawl',
			placard: 'A city that charges for crossing the street will one day charge for breathing.',
		});
		expect(flow.getCurrentBossContract()).toMatchObject({
			id: 'tollbooth-captain-grin',
			name: 'Tollbooth Captain Grin',
			phaseCount: 2,
		});

		flow.advanceTitleCard();
		expect(flow.getState()).toMatchObject({
			mode: 'dialogue',
			dialogueId: 'lower-sprawl-briefing',
		});

		advanceCurrentDialogue(flow);
		flow.completeStage();
		expect(flow.getState()).toMatchObject({
			mode: 'debrief',
			stageId: 'lower-sprawl',
			debriefId: 'lower-sprawl-debrief',
			lineIndex: 0,
		});
		expect(flow.getCurrentDebrief()?.lines).toEqual([
			'You stole a key and found a map of hunger.',
			'Next time, steal the rulebook too.',
		]);

		flow.advanceDebrief();
		flow.advanceDebrief();
		expect(flow.getState()).toMatchObject({
			mode: 'title-card',
			stageId: 'drainmarket',
			placard: 'A market under the street sells medicine priced by fear.',
		});
	});

	it('runs the first two campaign stages through dialogue beats', () => {
		const flow = createGameFlow();

		flow.selectMenu('story');
		expect(flow.getState()).toMatchObject({ mode: 'title-card', stageId: 'lower-sprawl' });

		enterCurrentStage(flow);
		expect(flow.getState()).toMatchObject({
			mode: 'stage',
			stageId: 'lower-sprawl',
			stageIndex: 0,
		});

		flow.completeStage();
		expect(flow.getState()).toMatchObject({ mode: 'debrief', debriefId: 'lower-sprawl-debrief' });
		advanceCurrentDebrief(flow);
		expect(flow.getState()).toMatchObject({ mode: 'title-card', stageId: 'drainmarket' });

		enterCurrentStage(flow);
		expect(flow.getState()).toMatchObject({
			mode: 'stage',
			stageId: 'drainmarket',
			stageIndex: 1,
		});
	});

	it('routes story mode through the complete eight-stage Brechtian campaign skeleton', () => {
		const flow = createGameFlow();
		const reachedStageIds: string[] = [];

		flow.selectMenu('story');
		for (let safety = 0; safety < 64 && flow.getState().mode !== 'menu'; safety += 1) {
			const state = flow.getState();
			if (state.mode === 'title-card') {
				flow.advanceTitleCard();
				continue;
			}
			if (state.mode === 'dialogue') {
				flow.advanceDialogue();
				continue;
			}
			if (state.mode === 'debrief') {
				flow.advanceDebrief();
				continue;
			}
			if (state.mode === 'stage') {
				reachedStageIds.push(state.stageId);
				flow.completeStage();
			}
		}

		expect(reachedStageIds).toEqual([
			'lower-sprawl',
			'drainmarket',
			'chrome-arcology',
			'mirror-palace',
			'dub-colony',
			'antenna-barrens',
			'orbital-lift',
			'asteroid-redoubt',
		]);
	});

	it('records the Stage 2 stim-cache result flag when Drainmarket is completed', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'drainmarket' });

		flow.selectMenu('story');
		enterCurrentStage(flow);
		flow.completeStage();

		expect(flow.getStoryProgress()).toMatchObject({
			completedStageIds: ['drainmarket'],
			acquiredPayloads: ['stim_cache'],
			resultFlags: ['stim_cache_secured'],
		});
	});

	it('stores the Mirror Palace Lio trust branch and result flag from the selected choice', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'mirror-palace' });

		flow.selectMenu('story');
		enterCurrentStage(flow);
		const result = flow.chooseStageChoice(1);

		expect(result).toEqual({
			ok: true,
			stageId: 'mirror-palace',
			branch: 'protected',
			resultFlag: 'lio_protected',
		});
		expect(flow.getStoryProgress()).toMatchObject({
			lioTrust: 'protected',
			resultFlags: ['lio_protected'],
		});
	});

	it('stores the Dub Colony colonyAlignment branch and result flag from the selected choice', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'dub-colony' });

		flow.selectMenu('story');
		enterCurrentStage(flow);
		const result = flow.chooseStageChoice(0);

		expect(result).toEqual({
			ok: true,
			stageId: 'dub-colony',
			branch: 'chorus',
			resultFlag: 'colony_alignment_chorus',
		});
		expect(flow.getStoryProgress()).toMatchObject({
			colonyAlignment: 'chorus',
			resultFlags: ['colony_alignment_chorus'],
		});
	});

	it('applies ledger release choice flags and heat/favor deltas', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'antenna-barrens' });

		flow.selectMenu('story');
		enterCurrentStage(flow);
		const result = flow.chooseStageChoice(0);

		expect(result).toEqual({
			ok: true,
			stageId: 'antenna-barrens',
			branch: 'public-dump',
			resultFlag: 'ledger_public_dump',
		});
		expect(flow.getStoryProgress()).toMatchObject({ resultFlags: ['ledger_public_dump'] });
		expect(flow.getMeta()).toMatchObject({ dubFavor: 2, orbitHeat: 2 });
	});

	it('applies cargo reversal choice flags and heat/favor deltas', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'orbital-lift' });

		flow.selectMenu('story');
		enterCurrentStage(flow);
		const result = flow.chooseStageChoice(1);

		expect(result).toEqual({
			ok: true,
			stageId: 'orbital-lift',
			branch: 'full-release',
			resultFlag: 'cargo_full_release',
		});
		expect(flow.getStoryProgress()).toMatchObject({ resultFlags: ['cargo_full_release'] });
		expect(flow.getMeta()).toMatchObject({ dubFavor: 3, orbitHeat: 2 });
	});

	it('stores the final broadcast doctrine and marks the campaign complete after the ending debrief', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'asteroid-redoubt' });

		flow.selectMenu('story');
		enterCurrentStage(flow);
		const result = flow.chooseStageChoice(2);
		expect(result).toEqual({
			ok: true,
			stageId: 'asteroid-redoubt',
			branch: 'publish-tools',
			resultFlag: 'broadcast_publish_tools',
		});

		flow.completeStage();
		while (flow.getState().mode === 'debrief') flow.advanceDebrief();

		expect(flow.getStoryProgress()).toMatchObject({
			campaignComplete: true,
			finalBroadcastDoctrine: 'publish-tools',
			resultFlags: ['broadcast_publish_tools'],
		});
		expect(flow.getState()).toEqual({ mode: 'menu' });
	});

	it('opens versus mode and dummy training mode from the menu', () => {
		const flow = createGameFlow();

		flow.selectMenu('versus');
		expect(flow.getState()).toMatchObject({ mode: 'versus', arenaId: 'duel-yard', winScore: 3 });

		flow.returnToMenu();
		flow.selectMenu('training');
		expect(flow.getState()).toMatchObject({
			mode: 'training',
			dummy: { invincible: true, label: 'Dummy Badger' },
		});
	});

	it('tracks versus tags until a player reaches the win score', () => {
		const flow = createGameFlow();

		flow.selectMenu('versus');
		expect(flow.scoreVersusTag('player')).toEqual({
			winner: undefined,
			playerScore: 1,
			rivalScore: 0,
		});
		expect(flow.scoreVersusTag('rival')).toEqual({
			winner: undefined,
			playerScore: 1,
			rivalScore: 1,
		});
		expect(flow.scoreVersusTag('player')).toEqual({
			winner: undefined,
			playerScore: 2,
			rivalScore: 1,
		});
		expect(flow.scoreVersusTag('player')).toEqual({
			winner: 'player',
			playerScore: 3,
			rivalScore: 1,
		});
		expect(flow.getState()).toMatchObject({ mode: 'versus', playerScore: 3, rivalScore: 1 });
	});

	it('operates the skill tree from earned blueprint shards', () => {
		const flow = createGameFlow({ blueprintShards: 1 });

		flow.selectMenu('skills');
		const result = flow.purchaseSkill('double_swipe');

		expect(result.ok).toBe(true);
		expect(flow.getMeta().blueprintShards).toBe(0);
		expect(flow.getMeta().purchasedSkills).toEqual(['double_swipe']);
	});
});




	it('connects chapter ids to story stage progression', () => {
		const flow = createGameFlow();
		expect(flow.getStages()[0]).toMatchObject({ chapter: 1, chapterId: 'ch01' });
		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		expect(flow.getCurrentChapterId()).toBe('ch01');
		advanceCurrentDialogue(flow);
		expect(flow.getState().mode).toBe('stage');
		expect(flow.getCurrentChapterId()).toBe('ch01');
		flow.completeStage();
		expect(flow.getStoryProgress().completedChapterIds).toContain('ch01');
	});

	it('exposes cloned side quests through stage specs', () => {
		const flow = createGameFlow();
		const stage = flow.getStages()[0];
		expect(stage?.sideQuests?.[0]?.id).toBe('meter-maidens-ledger');
		if (!stage?.sideQuests) throw new Error('expected side quests');
		stage.sideQuests[0].title = 'mutated side quest';
		expect(flow.getStages()[0]?.sideQuests?.[0]?.title).toBe('Meter Maidens Ledger');
	});

	it('exposes a cloned current stage with choice outcomes while story mode is staged', () => {
		const flow = createGameFlow();
		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		advanceCurrentDialogue(flow);
		const stage = flow.getCurrentStage();
		expect(stage?.id).toBe('lower-sprawl');
		expect(stage?.choiceOutcomes?.length).toBe(3);
		if (!stage?.choiceOutcomes) throw new Error('expected stage choice outcomes');
		stage.choiceOutcomes[0].prompt = 'mutated outside flow';
		expect(flow.getCurrentStage()?.choiceOutcomes?.[0]?.prompt).not.toBe('mutated outside flow');
	});


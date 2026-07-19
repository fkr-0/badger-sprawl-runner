import { describe, expect, it } from 'vitest';
import { createGameFlow } from './GameFlow';
import { buildStageRunSceneOptions } from './StageRunOptions';

function enterCurrentStage(flow: ReturnType<typeof createGameFlow>): void {
	if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
	for (let safety = 0; safety < 16 && flow.getState().mode === 'dialogue'; safety += 1) {
		flow.advanceDialogue();
	}
}

describe('buildStageRunSceneOptions', () => {
	it('maps saved payloads and current boss phases into StageRunScene options', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'chrome-arcology',
			acquiredPayloads: ['wafer_key'],
		});
		flow.selectMenu('story');
		enterCurrentStage(flow);

		const options = buildStageRunSceneOptions(flow);
		expect(options.stageId).toBe('chrome-arcology');
		expect(options.acquiredPayloadIds).toEqual(['wafer_key']);
		expect(options.bossPhases?.[0]).toMatchObject({ id: 'display-window' });
		expect(options.bossPlaceholder).toMatchObject({ id: 'madame-vitrine', name: 'Madame Vitrine' });
		expect(options.tutorialBeats?.[0]).toMatchObject({ id: 'railgun-sightline' });
		expect(options.procgenSeed).toContain('chrome-arcology');
		expect(options.balanceRules).toMatchObject({
			merchantPriceModifier: expect.any(Number),
			allyAssistLevel: expect.any(String),
			hazardIntensity: expect.any(String),
			endingTone: expect.any(String),
		});
		expect(options.runtimeConfig).toMatchObject({
			stageId: 'chrome-arcology',
			payloadRewardId: 'elevator_seed',
			bossPlaceholderId: 'madame-vitrine',
		});
		expect(options.generatedEnemyPacks?.[0]?.enemies.length).toBeGreaterThan(0);
		expect(options.generatedSideRooms?.[0]?.platforms.length).toBeGreaterThan(0);
	});

	it('maps only stage-relevant branch consequences into gameplay hooks', () => {
		const lioFlow = createGameFlow(undefined, {
			currentStageId: 'dub-colony',
			resultFlags: ['lio_protected', 'colony_alignment_chorus'],
		});
		lioFlow.selectMenu('story');
		enterCurrentStage(lioFlow);

		const lioOptions = buildStageRunSceneOptions(lioFlow);
		expect(lioOptions.branchGameplayHooks).toContain('companion_assist_ready');
		expect(lioOptions.branchGameplayHooks).not.toContain('naya_shield_bonus');

		const colonyFlow = createGameFlow(undefined, {
			currentStageId: 'orbital-lift',
			resultFlags: ['lio_protected', 'colony_alignment_chorus'],
		});
		colonyFlow.selectMenu('story');
		enterCurrentStage(colonyFlow);

		const colonyOptions = buildStageRunSceneOptions(colonyFlow);
		expect(colonyOptions.branchGameplayHooks).not.toContain('companion_assist_ready');
		expect(colonyOptions.branchGameplayHooks).toContain('naya_shield_bonus');
		expect(colonyOptions.generatedEnemyPacks?.[0]?.stageId).toBe('orbital-lift');
		expect(colonyOptions.generatedSideRooms?.[0]?.stageId).toBe('orbital-lift');
	});

	it('turns late-stage hack duels and behavior protocols into runtime boss phases', () => {
		const antennaFlow = createGameFlow(undefined, { currentStageId: 'antenna-barrens' });
		antennaFlow.selectMenu('story');
		enterCurrentStage(antennaFlow);
		const antennaOptions = buildStageRunSceneOptions(antennaFlow);
		expect(antennaOptions.bossPhases).toHaveLength(3);
		expect(antennaOptions.bossPhases?.[0]).toMatchObject({
			id: 'hack-duel-1',
			mechanic: 'fasttype bursts',
		});

		const liftFlow = createGameFlow(undefined, { currentStageId: 'orbital-lift' });
		liftFlow.selectMenu('story');
		enterCurrentStage(liftFlow);
		const liftOptions = buildStageRunSceneOptions(liftFlow);
		expect(liftOptions.bossPhases).toHaveLength(3);
		expect(liftOptions.bossPhases?.[2]).toMatchObject({
			id: 'mercy-exception',
			label: 'Mercy Exception',
		});
	});

	it('returns safe defaults outside a stage state', () => {
		const options = buildStageRunSceneOptions(createGameFlow());
		expect(options.acquiredPayloadIds).toEqual([]);
		expect(options.branchGameplayHooks).toEqual([]);
		expect(options.bossPhases).toEqual([]);
		expect(options.generatedSideRooms).toEqual([]);
	});
});

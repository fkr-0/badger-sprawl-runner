import { describe, expect, it } from 'vitest';
import { createGameFlow } from './GameFlow';
import { buildStageRuntimeConfig } from './StageRuntimeConfig';

function enterCurrentStage(flow: ReturnType<typeof createGameFlow>): void {
	flow.selectMenu('story');
	if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
	for (let safety = 0; safety < 16 && flow.getState().mode === 'dialogue'; safety += 1) {
		flow.advanceDialogue();
	}
}

describe('buildStageRuntimeConfig', () => {
	it('maps beat timing modifiers into rhythm camera pressure and enemy tags', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'dub-colony' });
		enterCurrentStage(flow);
		const config = buildStageRuntimeConfig(flow.getCurrentStage());
		expect(config).toMatchObject({
			stageId: 'dub-colony',
			cameraPressure: 'rhythm',
			payloadRewardId: 'bass_reactor_core',
			bossPlaceholderId: 'king-feedback',
		});
		expect(config?.modifierRules[0]).toMatchObject({
			id: 'bass-reactor-sync',
			kind: 'beat-timing',
			effect: 'rhythm window 90ms at 140bpm',
		});
		expect(config?.enemyMixTags).toEqual(expect.arrayContaining(['beat-timing']));
	});

	it('maps code gate modifiers into code-gate pressure', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'antenna-barrens' });
		enterCurrentStage(flow);
		const config = buildStageRuntimeConfig(flow.getCurrentStage());
		expect(config).toMatchObject({
			stageId: 'antenna-barrens',
			cameraPressure: 'code-gate',
			payloadRewardId: 'debt_ledger_shard',
			bossPlaceholderId: 'black-ice-fox',
		});
		expect(config?.modifierRules[0]?.effect).toBe('spawn 4 code gates/min, minimum 5');
	});
});

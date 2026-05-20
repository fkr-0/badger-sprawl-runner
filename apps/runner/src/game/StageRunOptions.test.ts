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
		expect(options.acquiredPayloadIds).toEqual(['wafer_key']);
		expect(options.bossPhases?.[0]).toMatchObject({ id: 'display-window' });
	});

	it('maps active branch consequences into branchGameplayHooks', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'dub-colony',
			resultFlags: ['lio_protected', 'colony_alignment_chorus'],
		});
		flow.selectMenu('story');
		enterCurrentStage(flow);

		const options = buildStageRunSceneOptions(flow);
		expect(options.branchGameplayHooks).toContain('companion_assist_ready');
		expect(options.branchGameplayHooks).toContain('naya_shield_bonus');
	});

	it('returns safe defaults outside a stage state', () => {
		const options = buildStageRunSceneOptions(createGameFlow());
		expect(options.acquiredPayloadIds).toEqual([]);
		expect(options.branchGameplayHooks).toEqual([]);
		expect(options.bossPhases).toEqual([]);
	});
});

import { describe, expect, it, vi } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { StoryFlowScene } from './StoryFlowScene';

function enterCurrentStage(flow: ReturnType<typeof createGameFlow>): void {
	if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
	for (let safety = 0; safety < 16 && flow.getState().mode === 'dialogue'; safety += 1) {
		flow.advanceDialogue();
	}
}

describe('StoryFlowScene stage launch', () => {
	it('records and emits a branch recap when a stage choice is committed', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'mirror-palace' });
		flow.selectMenu('story');
		enterCurrentStage(flow);
		const scene = new StoryFlowScene(flow);
		const recapEvents: unknown[] = [];
		window.addEventListener('badger:story-choice-recap', (event) => recapEvents.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });

		window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
		scene.onExit();

		expect(scene.getLastChoiceRecap()).toMatchObject({
			stageId: 'mirror-palace',
			selectedPrompt: 'protect Lio from the room',
			branch: 'protected',
			resultFlag: 'lio_protected',
			orbitHeatDelta: 1,
			dubFavorDelta: 1,
		});
		expect(recapEvents[0]).toMatchObject({ resultFlag: 'lio_protected' });
	});



	it('records autosave feedback after a committed story choice', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'lower-sprawl' });
		flow.selectMenu('story');
		enterCurrentStage(flow);
		const scene = new StoryFlowScene(flow, {
			onAutosave: (reason) => ({ reason, label: 'Autosaved branch choice', timestamp: 42 }),
		});
		scene.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });

		window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
		scene.onExit();

		expect(scene.getLastAutosaveFeedback()).toEqual({
			reason: 'branch-choice',
			label: 'Autosaved branch choice',
			timestamp: 42,
		});
	});

	it('toggles and emits the development stage debug detail panel', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'antenna-barrens',
			resultFlags: ['ledger_public_dump'],
		});
		flow.selectMenu('story');
		enterCurrentStage(flow);
		const scene = new StoryFlowScene(flow);
		const debugEvents: unknown[] = [];
		window.addEventListener('badger:stage-debug-detail', (event) => debugEvents.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
		scene.onExit();

		expect(scene.getLastDebugDetail()).toMatchObject({
			stageId: 'antenna-barrens',
			payloadId: 'debt_ledger_shard',
			bossId: 'black_ice_fox',
			resultFlags: ['ledger_public_dump'],
		});
		expect(scene.getLastDebugDetail()?.branchOutcomes).toContain('ledger_public_dump');
		expect(debugEvents[0]).toMatchObject({ payloadId: 'debt_ledger_shard' });
	});

	it('builds StageRunSceneOptions when R is pressed in stage mode', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'dub-colony',
			acquiredPayloads: ['wafer_key'],
			resultFlags: ['lio_protected', 'colony_alignment_chorus'],
		});
		flow.selectMenu('story');
		enterCurrentStage(flow);
		const onStartStage = vi.fn();
		const scene = new StoryFlowScene(flow, { onStartStage });
		scene.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
		scene.onExit();

		expect(onStartStage).toHaveBeenCalledWith(
			expect.objectContaining({
				acquiredPayloadIds: ['wafer_key'],
				branchGameplayHooks: expect.arrayContaining(['companion_assist_ready', 'naya_shield_bonus']),
			})
		);
	});
});

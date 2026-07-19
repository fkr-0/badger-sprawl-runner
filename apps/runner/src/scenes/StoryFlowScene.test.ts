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
	it('exposes authored chapter placard and animated dialogue presentation metadata', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'mirror-palace' });
		flow.selectMenu('story');
		const scene = new StoryFlowScene(flow);

		expect(scene.getPresentationSnapshot()).toMatchObject({
			mode: 'title-card',
			stageId: 'mirror-palace',
			chapter: 4,
			stageName: 'Treason at the Mirror Banquet',
			placard: 'Debt can make a friend wear the enemy mask before they stop loving you.',
		});

		flow.advanceTitleCard();
		expect(scene.getPresentationSnapshot()).toMatchObject({
			mode: 'dialogue',
			stageId: 'mirror-palace',
			speaker: 'Auntie Subharmonic',
			lineIndex: 0,
			lineCount: 2,
		});
	});

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
			bossId: 'black-ice-fox',
			resultFlags: ['ledger_public_dump'],
		});
		expect(scene.getLastDebugDetail()?.branchOutcomes).toContain('ledger_public_dump');
		expect(debugEvents[0]).toMatchObject({ payloadId: 'debt_ledger_shard' });
	});

	it('commits a newly highlighted branch before Enter launches it', () => {
		const flow = createGameFlow(undefined, { currentStageId: 'lower-sprawl' });
		flow.selectMenu('story');
		enterCurrentStage(flow);
		const onStartStage = vi.fn();
		const scene = new StoryFlowScene(flow, { onStartStage });
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
		});

		window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

		expect(onStartStage).not.toHaveBeenCalled();
		expect(scene.getLastChoiceRecap()).toMatchObject({ resultFlag: 'wafer_broadcast' });
		expect(flow.getStoryProgress().resultFlags).toEqual(['wafer_broadcast']);
		expect(flow.getMeta()).toMatchObject({ dubFavor: 1, orbitHeat: 1 });

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
		scene.onExit();

		expect(onStartStage).toHaveBeenCalledOnce();
	});

	it('restores a persisted branch before R launches the stage', () => {
		const flow = createGameFlow(
			{ dubFavor: 1, orbitHeat: 0 },
			{ currentStageId: 'lower-sprawl', resultFlags: ['wafer_safe_routes'] }
		);
		flow.selectMenu('story');
		enterCurrentStage(flow);
		const onStartStage = vi.fn();
		const scene = new StoryFlowScene(flow, { onStartStage });
		scene.onEnter({
			eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
			canvas: document.createElement('canvas'),
		});

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
		scene.onExit();

		expect(scene.getLastChoiceRecap()).toMatchObject({ resultFlag: 'wafer_safe_routes' });
		expect(flow.getStoryProgress().resultFlags).toEqual(['wafer_safe_routes']);
		expect(flow.getMeta()).toMatchObject({ dubFavor: 1, orbitHeat: 0 });
		expect(onStartStage).toHaveBeenCalledOnce();
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
				branchGameplayHooks: expect.arrayContaining(['companion_assist_ready']),
			})
		);
	});
});

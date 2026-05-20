import { describe, expect, it, vi } from 'vitest';
import { createDefaultModeSceneFactories } from './ModeSceneFactories';
import { StageRunScene } from './StageRunScene';
import { StoryFlowScene } from './StoryFlowScene';

describe('createDefaultModeSceneFactories', () => {
	it('creates StoryFlowScene with a stage launch callback', () => {
		const factories = createDefaultModeSceneFactories();
		const scene = factories.story();
		expect(scene).toBeInstanceOf(StoryFlowScene);
	});

	it('creates Endless Sprawl as a generated StageRunScene', () => {
		const factories = createDefaultModeSceneFactories();
		expect(factories.endless()).toBeInstanceOf(StageRunScene);
	});

	it('routes StoryFlow stage launch callback to a StageRunScene', () => {
		const onStartStoryStage = vi.fn();
		const factories = createDefaultModeSceneFactories({ onStartStoryStage });
		const story = factories.story() as StoryFlowScene;
		const flow = story.getFlow();
		flow.selectMenu('story');
		if (flow.getState().mode === 'title-card') flow.advanceTitleCard();
		for (let safety = 0; safety < 16 && flow.getState().mode === 'dialogue'; safety += 1) {
			flow.advanceDialogue();
		}
		story.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
		story.onExit();
		expect(onStartStoryStage).toHaveBeenCalledWith(expect.any(StageRunScene));
	});
});

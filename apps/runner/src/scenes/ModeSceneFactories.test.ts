import { describe, expect, it } from 'vitest';
import { createDefaultModeSceneFactories } from './ModeSceneFactories';
import { StoryFlowScene } from './StoryFlowScene';

describe('createDefaultModeSceneFactories', () => {
	it('creates StoryFlowScene with a stage launch callback', () => {
		const factories = createDefaultModeSceneFactories();
		const scene = factories.story();
		expect(scene).toBeInstanceOf(StoryFlowScene);
	});
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		environmentMatchGlobs: [
			['src/scenes/ConcreteSceneReturn.test.ts', 'jsdom'],
			['src/scenes/ModeSceneFactories.test.ts', 'jsdom'],
			['src/scenes/StageRunScene*.test.ts', 'jsdom'],
			['src/scenes/StoryFlowScene.test.ts', 'jsdom'],
			['src/scenes/TitleScene.test.ts', 'jsdom'],
			['src/storage/AutosaveFeedback.test.ts', 'jsdom'],
		],
	},
});

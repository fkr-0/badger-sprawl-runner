import { describe, expect, it } from 'vitest';
import { createGameFlow } from './GameFlow';
import { MODE_OPTIONS, MODE_SCENE_ROUTES } from './ModeMenu';
import { TitleScene } from '../scenes/TitleScene';
import { createDefaultModeSceneFactories } from '../scenes/ModeSceneFactories';
import { SkillTreeScene } from '../scenes/SkillTreeScene';
import { StoryFlowScene } from '../scenes/StoryFlowScene';
import { TrainingScene } from '../scenes/TrainingScene';
import { VersusScene } from '../scenes/VersusScene';

describe('mode menu integration', () => {
	it('provides a dedicated VS scene target', () => {
		const scene = new VersusScene();

		expect(scene.name).toBe('VersusScene');
		expect(scene.getScore()).toMatchObject({ playerScore: 0, rivalScore: 0, winScore: 3 });
	});

	it('uses one canonical mode option list for GameFlow and TitleScene', () => {
		const flow = createGameFlow();

		expect(flow.getMenuOptions()).toEqual(MODE_OPTIONS);
		expect(TitleScene.getMenuOptions()).toEqual(MODE_OPTIONS);
	});



	it('accepts menu focus, confirm, and cancel commands without DOM events', () => {
		const selected: string[] = [];
		const cancelled: string[] = [];
		const scene = new TitleScene({
			onSelectMode: (modeId) => selected.push(modeId),
			onCancel: () => cancelled.push('cancel'),
		});

		scene.handleMenuCommand('down');
		scene.handleMenuCommand('down');
		expect(scene.getSelectedOption().id).toBe('training');
		scene.handleMenuCommand('up');
		expect(scene.getSelectedOption().id).toBe('versus');
		scene.handleMenuCommand('confirm');
		scene.handleMenuCommand('cancel');

		expect(selected).toEqual(['versus']);
		expect(cancelled).toEqual(['cancel']);
	});

	it('has a route target for every advertised mode', () => {
		expect(Object.keys(MODE_SCENE_ROUTES).sort()).toEqual(
			MODE_OPTIONS.map((option) => option.id).sort()
		);

		for (const option of MODE_OPTIONS) {
			expect(MODE_SCENE_ROUTES[option.id].sceneName).toMatch(/Scene$/);
			expect(MODE_SCENE_ROUTES[option.id].status).toBe('implemented');
		}
	});

	it('lets the title scene navigate options and confirm the selected canonical mode', () => {
		const selected: string[] = [];
		const scene = new TitleScene({ onSelectMode: (modeId) => selected.push(modeId) });

		expect(scene.getSelectedOption().id).toBe('story');
		scene.moveSelection(1);
		expect(scene.getSelectedOption().id).toBe('versus');
		scene.confirmSelection();

		expect(selected).toEqual(['versus']);
	});
});

import { createModeScene, routeModeSelection } from './ModeRouter';


function installWindowStub(): void {
	const globalWithWindow = globalThis as typeof globalThis & {
		window?: { addEventListener: () => void; removeEventListener: () => void };
	};
	globalWithWindow.window ??= {
		addEventListener: () => {},
		removeEventListener: () => {},
	};
}

describe('mode router', () => {
	it('constructs concrete scene instances for every advertised route', () => {
		installWindowStub();
		const factories = createDefaultModeSceneFactories();

		expect(createModeScene('story', factories)).toBeInstanceOf(StoryFlowScene);
		expect(createModeScene('training', factories)).toBeInstanceOf(TrainingScene);
		expect(createModeScene('versus', factories)).toBeInstanceOf(VersusScene);
		expect(createModeScene('skills', factories)).toBeInstanceOf(SkillTreeScene);
	});

	it('replaces the current scene with the selected concrete mode scene', () => {
		installWindowStub();
		installWindowStub();
		const factories = createDefaultModeSceneFactories();
		const replaced: string[] = [];
		const sceneManager = { replace: (scene: { name: string }) => replaced.push(scene.name) };

		routeModeSelection(sceneManager, 'training', factories);
		routeModeSelection(sceneManager, 'versus', factories);
		routeModeSelection(sceneManager, 'skills', factories);

		expect(replaced).toEqual(['TrainingScene', 'VersusScene', 'SkillTreeScene']);
	});

	it('routes TitleScene selection through a SceneManager-compatible replacement path', () => {
		const factories = createDefaultModeSceneFactories();
		const replaced: string[] = [];
		const sceneManager = { replace: (scene: { name: string }) => replaced.push(scene.name) };
		const title = new TitleScene({
			onSelectMode: (modeId) => routeModeSelection(sceneManager, modeId, factories),
		});

		title.moveSelection(2);
		title.confirmSelection();

		expect(replaced).toEqual(['TrainingScene']);
	});

	it('enters the story flow path when the story route is opened', () => {
		const factories = createDefaultModeSceneFactories();
		const scene = createModeScene('story', factories);
		expect(scene).toBeInstanceOf(StoryFlowScene);
		const story = scene as StoryFlowScene;

		expect(story.getFlow().getState()).toEqual({ mode: 'menu' });
		story.onEnter({ eventBus: {}, canvas: {} } as never);

		expect(story.getFlow().getState()).toMatchObject({ mode: 'title-card', stageId: 'lower-sprawl' });
	});
});

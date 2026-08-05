import type { Page } from '@playwright/test';
import type { BadgerTestHarness } from '../../../apps/runner/src/main';

interface StoryDeploymentWindow extends Window {
	__badger: BadgerTestHarness;
	__app?: { getCurrentScene(): unknown };
}

/**
 * Deploy a save-seeded campaign slice through the persistent city map.
 *
 * The debug travel only positions the already-authored save at its current
 * district route. Selection and deployment are still owned by SubwayMapScene,
 * so E2E evidence follows the shipped Title → Subway → Story boundary.
 */
export async function deployStoryStageFromTitle(page: Page, stageId: string): Promise<void> {
	await page.goto('/?debug=1');
	await page.waitForFunction(() => Boolean((window as Partial<StoryDeploymentWindow>).__badger));
	await waitForScene(page, 'TitleScene');
	await page.locator('#game').click();
	await page.keyboard.press('Enter');
	await waitForScene(page, 'SubwayMapScene');
	await deployStoryStageFromMap(page, stageId);
}

export async function deployStoryStageFromMap(page: Page, stageId: string): Promise<void> {
	await waitForScene(page, 'SubwayMapScene');
	await page.evaluate((requestedStageId) => {
		const runtime = window as StoryDeploymentWindow;
		const destinationId = `${requestedStageId}:route`;
		const travel = runtime.__badger.debugTravelTo(destinationId);
		if (!travel.ok) {
			throw new Error(`Could not position ${requestedStageId} recorder: ${travel.reason}`);
		}
		const scene = runtime.__app?.getCurrentScene() as {
			selectLocation(locationId: string): boolean;
			confirmSelection(): unknown;
		};
		if (!scene?.selectLocation(destinationId)) {
			throw new Error(`${destinationId} is not selectable in the persistent subway map`);
		}
		scene.confirmSelection();
	}, stageId);

	await waitForScene(page, 'StoryFlowScene');
	await page.waitForFunction(
		(requestedStageId) => {
			const state = (window as StoryDeploymentWindow).__badger.getStoryState();
			return state.mode === 'title-card' && state.stageId === requestedStageId;
		},
		stageId,
		{ timeout: 15_000 }
	);
}

async function waitForScene(page: Page, sceneName: string): Promise<void> {
	await page.waitForFunction(
		(expected) =>
			(window as Partial<StoryDeploymentWindow>).__badger?.getSceneName() === expected,
		sceneName,
		{ timeout: 15_000 }
	);
}

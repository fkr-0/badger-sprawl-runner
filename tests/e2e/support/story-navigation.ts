import { expect, type Page } from '@playwright/test';

export async function waitForBadgerScene(
	page: Page,
	name: string,
	timeout = 8_000
): Promise<void> {
	await page.waitForFunction(
		(expected) => window.__badger?.getSceneName() === expected,
		name,
		{ timeout }
	);
}

/**
 * Enter the authored story flow through the current persistent-city route.
 *
 * Feature tests should not duplicate title-menu indexes or the transit graph.
 * The test harness selects the active district route, while production still
 * exercises SubwayMapScene and its deploy callback.
 */
export async function enterStoryFlow(page: Page): Promise<void> {
	await page.waitForFunction(() => Boolean(window.__badger && window.__app));
	await page.evaluate(() => window.__badger?.routeMode('story'));
	await waitForBadgerScene(page, 'SubwayMapScene');
	await page.evaluate(() => {
		const travel = window.__badger?.debugTravelTo('lower-sprawl:route');
		if (!travel?.ok) throw new Error(`failed to prepare story route: ${travel?.reason ?? 'unknown'}`);
		const scene = window.__app?.getCurrentScene() as
			| { selectLocation?(id: string): boolean; confirmSelection?(): unknown }
			| undefined;
		if (!scene?.selectLocation?.('lower-sprawl:route')) {
			throw new Error('SubwayMapScene could not select the active story route');
		}
		scene.confirmSelection?.();
	});
	await waitForBadgerScene(page, 'StoryFlowScene');
	await expect.poll(() => page.evaluate(() => window.__badger?.getStoryState()?.mode)).not.toBeUndefined();
}

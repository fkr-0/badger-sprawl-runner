import { expect, test } from '@playwright/test';
import { enterStoryFlow } from './support/story-navigation';

test.describe('StoryFlow stage debug panel', () => {
	test('emits stage debug detail after toggling D in story stage mode', async ({ page }) => {
		await page.addInitScript(() => {
			window.__badgerStageDebugDetails = [];
			window.addEventListener('badger:stage-debug-detail', (event) => {
				window.__badgerStageDebugDetails.push((event as CustomEvent).detail);
			});
		});

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await enterStoryFlow(page);

		for (let index = 0; index < 12; index += 1) {
			const mode = await page.evaluate(() => window.__badger?.getStoryState()?.mode);
			if (mode === 'stage') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
		await expect.poll(() => page.evaluate(() => window.__badger?.getStoryState()?.mode)).toBe('stage');
		await page.keyboard.press('d');
		await expect.poll(() => page.evaluate(() => window.__badgerStageDebugDetails.length)).toBeGreaterThan(0);

		const detail = await page.evaluate(() => window.__badgerStageDebugDetails[0]);
		expect(detail).toMatchObject({
			stageId: 'lower-sprawl',
			payloadId: 'wafer_key',
			bossId: 'tollbooth-captain-grin',
		});
		expect(detail.branchOutcomes).toEqual(expect.arrayContaining(['wafer_sold', 'wafer_broadcast']));
	});
});

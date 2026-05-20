import { expect, test } from '@playwright/test';

test.describe('StoryFlow stage debug panel', () => {
	test('emits stage debug detail after toggling D in story stage mode', async ({ page }) => {
		await page.addInitScript(() => {
			window.__badgerStageDebugDetails = [];
			window.addEventListener('badger:stage-debug-detail', (event) => {
				window.__badgerStageDebugDetails.push((event as CustomEvent).detail);
			});
		});

		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await page.locator('#game').click();
		await page.keyboard.press('Enter');
		await expect.poll(() => consoleMessages).toContain('StoryFlowScene entered');

		for (let index = 0; index < 10; index += 1) {
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
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

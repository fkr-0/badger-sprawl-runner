import { expect, test } from '@playwright/test';

test.describe('Stage boss placeholder', () => {
	test('emits structured boss placeholder when story launches a stage run', async ({ page }) => {
		await page.addInitScript(() => {
			window.__badgerBossPlaceholders = [];
			window.addEventListener('badger:boss-placeholder', (event) => {
				window.__badgerBossPlaceholders.push((event as CustomEvent).detail);
			});
		});

		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await page.locator('#game').click();
		await page.keyboard.press('Enter');
		await expect.poll(() => consoleMessages).toContain('StoryFlowScene entered');

		for (let index = 0; index < 12; index += 1) {
			const mode = await page.evaluate(() => window.__badger?.getStoryState()?.mode);
			if (mode === 'stage') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
		await expect.poll(() => page.evaluate(() => window.__badger?.getStoryState()?.mode)).toBe('stage');
		await page.keyboard.press('r');
		await expect.poll(() => consoleMessages).toContain('StageRunScene entered');
		await expect.poll(() => page.evaluate(() => window.__badgerBossPlaceholders.length)).toBeGreaterThan(0);

		const boss = await page.evaluate(() => window.__badgerBossPlaceholders[0]);
		expect(boss).toMatchObject({
			id: 'tollbooth-captain-grin',
			name: 'Tollbooth Captain Grin',
			phaseCount: 2,
		});
		expect(boss.argument).toContain('Fees');
	});
});

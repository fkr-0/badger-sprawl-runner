import { expect, test } from '@playwright/test';

test.describe('Story choice recap', () => {
	test('emits branch recap event after committing a story choice', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();

		await page.evaluate(() => {
			window.__badgerChoiceRecaps = [];
			window.addEventListener('badger:story-choice-recap', (event) => {
				window.__badgerChoiceRecaps.push((event as CustomEvent).detail);
			});
		});

		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.locator('#game').click();
		await page.keyboard.press('Enter');
		await expect.poll(() => consoleMessages).toContain('StoryFlowScene entered');

		for (let index = 0; index < 10; index += 1) {
			await page.keyboard.press('Enter');
			await page.waitForTimeout(50);
		}
		await page.keyboard.press('1');
		await expect.poll(() => page.evaluate(() => window.__badgerChoiceRecaps.length)).toBeGreaterThan(0);

		const recap = await page.evaluate(() => window.__badgerChoiceRecaps[0]);
		expect(recap).toMatchObject({
			stageId: 'lower-sprawl',
			resultFlag: 'wafer_sold',
		});
		expect(recap.selectedPrompt).toContain('sell');
		expect(typeof recap.consequence).toBe('string');
	});
});

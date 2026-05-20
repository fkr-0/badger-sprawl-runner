import { expect, test } from '@playwright/test';

test.describe('Autosave feedback', () => {
	test('emits visible autosave feedback after committing a story branch choice', async ({ page }) => {
		await page.addInitScript(() => {
			window.__badgerAutosaves = [];
			window.addEventListener('badger:autosave-feedback', (event) => {
				window.__badgerAutosaves.push((event as CustomEvent).detail);
			});
		});

		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await page.locator('#game').click();
		await page.keyboard.press('Enter');
		await expect.poll(() => consoleMessages).toContain('StoryFlowScene entered');

		for (let index = 0; index < 3; index += 1) {
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
		await page.keyboard.press('1');
		await expect.poll(() => page.evaluate(() => window.__badgerAutosaves.length)).toBeGreaterThan(0);

		const feedback = await page.evaluate(() => window.__badgerAutosaves[0]);
		expect(feedback).toMatchObject({
			reason: 'branch-choice',
			label: 'Autosaved branch choice',
		});
		expect(typeof feedback.timestamp).toBe('number');

		const rawSave = await page.evaluate(() => window.localStorage.getItem('badger-sprawl-runner.save.v1'));
		expect(rawSave).toContain('wafer_sold');
	});
});

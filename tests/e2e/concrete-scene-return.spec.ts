import { expect, test } from '@playwright/test';

test.describe('Concrete scene return navigation', () => {
	test('returns from TrainingScene to TitleScene with Escape', async ({ page }) => {
		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await page.locator('#game').click();

		// Story is selected by default; Training is two slots below it.
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect.poll(() => consoleMessages).toContain('TrainingScene entered');

		await page.keyboard.press('Escape');
		await expect.poll(() => consoleMessages.filter((message) => message === 'TitleScene entered').length).toBeGreaterThan(1);
	});
});

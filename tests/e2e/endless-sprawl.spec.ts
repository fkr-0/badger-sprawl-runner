import { expect, test } from '@playwright/test';

test.describe('Endless Sprawl mode', () => {
	test('selects Endless Sprawl from the title menu and enters StageRunScene', async ({ page }) => {
		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await page.locator('#game').click();

		for (let index = 0; index < 4; index += 1) {
			await page.keyboard.press('ArrowDown');
		}
		await page.keyboard.press('Enter');
		await page.waitForTimeout(250);

		expect(consoleMessages).toContain('StageRunScene entered');
	});
});

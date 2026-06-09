/**
 * E2E Tests for Training Mode
 */

import { test, expect } from '@playwright/test';

async function waitForScene(page: import('@playwright/test').Page, name: string, timeout = 5000): Promise<void> {
	await page.waitForFunction(
		(n) => (window as any).__badger?.getSceneName() === n,
		name,
		{ timeout },
	);
}

async function sceneName(page: import('@playwright/test').Page): Promise<string> {
	return page.evaluate(() => (window as any).__badger?.getSceneName() ?? 'none');
}

test.describe('Training Scene', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForScene(page, 'TitleScene');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'TrainingScene');
	});

	test('should enter TrainingScene', async ({ page }) => {
		expect(await sceneName(page)).toBe('TrainingScene');
	});

	test('Escape should return to TitleScene', async ({ page }) => {
		await page.keyboard.press('Escape');
		await waitForScene(page, 'TitleScene');
		expect(await sceneName(page)).toBe('TitleScene');
	});

	test('R key should reset training state', async ({ page }) => {
		await page.keyboard.press('J');
		await page.waitForTimeout(100);
		await page.keyboard.press('KeyR');
		await page.waitForTimeout(100);
		expect(await sceneName(page)).toBe('TrainingScene');
	});

	test('J key should record practice hits', async ({ page }) => {
		for (let i = 0; i < 3; i++) {
			await page.keyboard.press('J');
			await page.waitForTimeout(100);
		}
		expect(await sceneName(page)).toBe('TrainingScene');
	});
});

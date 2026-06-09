/**
 * E2E Tests for Versus Mode
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

test.describe('Versus Scene', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForScene(page, 'TitleScene');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'VersusScene');
	});

	test('should enter VersusScene', async ({ page }) => {
		expect(await sceneName(page)).toBe('VersusScene');
	});

	test('Escape should return to TitleScene', async ({ page }) => {
		await page.keyboard.press('Escape');
		await waitForScene(page, 'TitleScene');
		expect(await sceneName(page)).toBe('TitleScene');
	});

	test('scene should remain stable during play', async ({ page }) => {
		await page.waitForTimeout(500);
		expect(await sceneName(page)).toBe('VersusScene');
	});
});

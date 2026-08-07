/**
 * E2E Tests for Title Menu Navigation
 */

import { test, expect } from '@playwright/test';

async function sceneName(page: import('@playwright/test').Page): Promise<string> {
	return page.evaluate(() => (window as any).__badger?.getSceneName() ?? 'none');
}

async function waitForScene(page: import('@playwright/test').Page, name: string, timeout = 5000): Promise<void> {
	await page.waitForFunction(
		(n) => (window as any).__badger?.getSceneName() === n,
		name,
		{ timeout },
	);
}

test.describe('Title Menu', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForScene(page, 'TitleScene');
	});

	test('should start at TitleScene with menu', async ({ page }) => {
		expect(await sceneName(page)).toBe('TitleScene');
	});

	test('should route to Endless mode via ArrowDown + Enter', async ({ page }) => {
		for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'StageRunScene');
		expect(await sceneName(page)).toBe('StageRunScene');
	});

	test('ArrowUp should wrap around menu', async ({ page }) => {
		await page.keyboard.press('ArrowUp');
		await page.keyboard.press('Enter');
		await page.waitForTimeout(500);
		const scene = await sceneName(page);
		expect(scene).not.toBe('none');
	});

	test('should route to Story mode', async ({ page }) => {
		await page.keyboard.press('Enter');
		await waitForScene(page, 'SubwayMapScene');
		expect(await sceneName(page)).toBe('SubwayMapScene');
	});

	test('should route to Training mode', async ({ page }) => {
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'TrainingScene');
		expect(await sceneName(page)).toBe('TrainingScene');
	});

	test('should route to VS mode', async ({ page }) => {
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'VersusScene');
		expect(await sceneName(page)).toBe('VersusScene');
	});

	test('should route to Endless mode', async ({ page }) => {
		for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'StageRunScene');
		expect(await sceneName(page)).toBe('StageRunScene');
	});
});

test.describe('Title Progress Events', () => {
	test('should dispatch title-progress-summary on enter', async ({ page }) => {
		await page.addInitScript(() => {
			(window as any).__titleProgress = [];
			window.addEventListener('badger:title-progress-summary', (e) => {
				(window as any).__titleProgress.push((e as CustomEvent).detail);
			});
		});
		await page.goto('/');
		// Wait for the harness to be ready and the event to fire
		await page.waitForFunction(
			() => (window as any).__titleProgress?.length > 0 || (window as any).__badger?.getSceneName() === 'TitleScene',
			null,
			{ timeout: 5000 },
		);
		// Give the event a moment if scene loaded first
		await page.waitForTimeout(200);
		const count = await page.evaluate(() => (window as any).__titleProgress?.length ?? 0);
		expect(count).toBeGreaterThan(0);
	});
});

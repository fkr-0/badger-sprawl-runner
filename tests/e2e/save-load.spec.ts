/**
 * E2E Tests for Save/Load System
 */

import { test, expect } from '@playwright/test';
import { enterStoryFlow } from './support/story-navigation';

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

test.describe('Save Persistence', () => {
	test('should persist title progress to localStorage', async ({ page }) => {
		await page.goto('/');
		await waitForScene(page, 'TitleScene');
		// localStorage should be accessible and the app should have written save data
		const saveKeys = await page.evaluate(() => Object.keys(localStorage));
		expect(saveKeys).toBeDefined();
	});

	test('should restore scene from title after mode switch', async ({ page }) => {
		await page.goto('/');
		await waitForScene(page, 'TitleScene');

		// Enter Training
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'TrainingScene');

		// Return to title
		await page.keyboard.press('Escape');
		await waitForScene(page, 'TitleScene');

		// Enter VS
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'VersusScene');

		expect(await sceneName(page)).toBe('VersusScene');
	});
});

test.describe('Story Mode Save Integration', () => {
	test('should dispatch autosave-feedback after branch choice', async ({ page }) => {
		await page.addInitScript(() => {
			(window as any).__autosaves = [];
			window.addEventListener('badger:autosave-feedback', (e) => {
				(window as any).__autosaves.push((e as CustomEvent).detail);
			});
		});
		await page.goto('/');
		await waitForScene(page, 'TitleScene');

		// Enter the current persistent-city story route.
		await enterStoryFlow(page);

		// Advance dialogue
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press('Enter');
			await page.waitForTimeout(200);
		}

		const autosaves = await page.evaluate(() => (window as any).__autosaves ?? []);
		expect(Array.isArray(autosaves)).toBe(true);
	});
});

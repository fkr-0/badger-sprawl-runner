import { expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface ReturnWindow extends Window {
	__badger: BadgerTestHarness;
}

test.describe('Concrete scene return navigation', () => {
	test('returns from TrainingScene to TitleScene with Escape', async ({ page }) => {
		await page.goto('/');
		await page.waitForFunction(() => Boolean((window as ReturnWindow).__badger));
		await page.evaluate(() => (window as ReturnWindow).__badger.routeMode('training'));
		await expect
			.poll(() => page.evaluate(() => (window as ReturnWindow).__badger.getSceneName()))
			.toBe('TrainingScene');
		await expect
			.poll(() => page.evaluate(() => (window as ReturnWindow).__badger.getTraining()))
			.not.toBeNull();

		await page.keyboard.press('Escape');
		await expect
			.poll(() => page.evaluate(() => (window as ReturnWindow).__badger.getSceneName()))
			.toBe('TitleScene');
	});
});

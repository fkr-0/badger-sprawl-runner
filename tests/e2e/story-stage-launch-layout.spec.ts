import { expect, test } from '@playwright/test';
import { enterStoryFlow } from './support/story-navigation';

test.describe('Story branch screen', () => {
	test('keeps dialogue rows separated and launches the committed branch with Enter', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await page.locator('#game').click();

		await enterStoryFlow(page);

		for (let index = 0; index < 12; index += 1) {
			const mode = await page.evaluate(() => (window as any).__badger?.getStoryState()?.mode);
			if (mode === 'stage') break;
			await page.keyboard.press('Enter');
		}
		await expect
			.poll(() => page.evaluate(() => (window as any).__badger?.getStoryState()?.mode))
			.toBe('stage');

		await expect
			.poll(() => page.evaluate(() => (window as any).__badger?.getStoryPanelLayout()))
			.not.toBeNull();
		const snapshot = await page.evaluate(() => (window as any).__badger.getStoryPanelLayout());
		expect(snapshot.choiceRows).toHaveLength(3);
		expect(snapshot.panelTop).toBeLessThan(snapshot.choiceRows[0].top);
		for (let index = 1; index < snapshot.choiceRows.length; index += 1) {
			expect(snapshot.choiceRows[index - 1].bottom).toBeLessThan(snapshot.choiceRows[index].top);
		}
		expect(snapshot.choiceRows.at(-1).bottom).toBeLessThan(snapshot.detailsTop);
		expect(snapshot.detailsBottom).toBeLessThan(snapshot.controlsTop);
		expect(snapshot.controlsBottom).toBeLessThan(snapshot.recapTop);
		expect(snapshot.recapBottom).toBeLessThan(snapshot.panelBottom);
		expect(snapshot.recapRight).toBeLessThan(snapshot.autosaveLeft);

		await page.keyboard.press('3');
		await expect
			.poll(() => page.evaluate(() => (window as any).__badger?.getStoryProgress()?.resultFlags))
			.toContain('wafer_safe_routes');

		await page.keyboard.press('Enter');
		await expect
			.poll(() => page.evaluate(() => (window as any).__badger?.getSceneName()))
			.toBe('StageRunScene');
	});
});

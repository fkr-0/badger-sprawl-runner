import { expect, test } from '@playwright/test';
import { enterStoryFlow } from './support/story-navigation';

test.describe('Stage tutorial overlay', () => {
	test('emits tutorial beat overlay when story launches a stage run', async ({ page }) => {
		await page.addInitScript(() => {
			window.__badgerTutorialOverlays = [];
			window.addEventListener('badger:tutorial-overlay', (event) => {
				window.__badgerTutorialOverlays.push((event as CustomEvent).detail);
			});
		});

		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await enterStoryFlow(page);

		for (let index = 0; index < 12; index += 1) {
			const mode = await page.evaluate(() => window.__badger?.getStoryState()?.mode);
			if (mode === 'stage') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
		await expect.poll(() => page.evaluate(() => window.__badger?.getStoryState()?.mode)).toBe('stage');
		await page.keyboard.press('r');
		await expect.poll(() => consoleMessages).toContain('StageRunScene entered');
		await expect.poll(() => page.evaluate(() => window.__badgerTutorialOverlays.length)).toBeGreaterThan(0);

		const beats = await page.evaluate(() => window.__badgerTutorialOverlays[0]);
		expect(beats).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'jump-coyote', label: 'Coyote-hop over toll arms' }),
			])
		);
	});
});

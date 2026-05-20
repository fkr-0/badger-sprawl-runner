import { expect, test } from '@playwright/test';

test.describe('Title story progress summary', () => {
	test('emits visible title progress summary for the current story save', async ({ page }) => {
		await page.addInitScript(() => {
			window.__badgerTitleProgressSummaries = [];
			window.addEventListener('badger:title-progress-summary', (event) => {
				window.__badgerTitleProgressSummaries.push((event as CustomEvent).detail);
			});
		});

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await expect.poll(() => page.evaluate(() => window.__badgerTitleProgressSummaries?.length ?? 0)).toBeGreaterThan(0);

		const summary = await page.evaluate(() => window.__badgerTitleProgressSummaries[0]);
		expect(summary).toMatchObject({
			ctaLabel: 'New Story',
			currentChapter: 'Chapter 1: Lower Sprawl',
			currentStageName: 'The Song of the Toll',
			finalBroadcastDoctrine: 'Undecided',
		});
	});
});

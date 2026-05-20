import { expect, test } from '@playwright/test';

test.describe('Legacy save migration', () => {
	test('migrates legacy story progress into title progress summary', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: { blueprintShards: 2 },
					storyProgress: {
						currentStageId: 'asteroid-redoubt',
						completedStageIds: ['lower-sprawl', 'lower-sprawl'],
						completedChapterIds: ['ch01', 'ch01'],
						acquiredPayloads: ['wafer_key'],
						resultFlags: ['lio_protected', 'colony_alignment_supplier', 'broadcast_publish_tools'],
					},
				})
			);
			window.__badgerTitleProgressSummaries = [];
			window.addEventListener('badger:title-progress-summary', (event) => {
				window.__badgerTitleProgressSummaries.push((event as CustomEvent).detail);
			});
		});

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await expect.poll(() => page.evaluate(() => window.__badgerTitleProgressSummaries.length)).toBeGreaterThan(0);

		const summary = await page.evaluate(() => window.__badgerTitleProgressSummaries[0]);
		expect(summary).toMatchObject({
			ctaLabel: 'Continue',
			currentChapter: 'Chapter 8: Asteroid Redoubt',
			currentStageName: 'Final Broadcast',
			completedChapters: 1,
			completedStages: 1,
			finalBroadcastDoctrine: 'Publish Tools',
		});
	});
});

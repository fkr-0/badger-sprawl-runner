import { expect, test } from '@playwright/test';

test.describe('Title continue CTA', () => {
	test('shows Continue when a save points at a non-first current stage with no completed stages', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: { credchips: 0, blueprintShards: 0, purchasedSkills: [], dubFavor: 0, orbitHeat: 0 },
					storyProgress: {
						currentStageId: 'mirror-palace',
						completedStageIds: [],
						completedChapterIds: [],
						acquiredPayloads: [],
						resultFlags: [],
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
			currentChapter: 'Chapter 4: Mirror Palace',
			currentStageName: 'Treason at the Mirror Banquet',
			completedStages: 0,
		});
	});
});

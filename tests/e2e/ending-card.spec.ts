import { expect, test } from '@playwright/test';

test.describe('Campaign ending card', () => {
	test('emits the completed-save ending card for the final broadcast doctrine', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: { credchips: 0, blueprintShards: 0, purchasedSkills: [], dubFavor: 0, orbitHeat: 0 },
					storyProgress: {
						currentStageId: 'asteroid-redoubt',
						completedStageIds: ['asteroid-redoubt'],
						completedChapterIds: ['chapter-08'],
						acquiredPayloads: ['public_toolkit'],
						resultFlags: ['broadcast_publish_tools'],
						campaignComplete: true,
						finalBroadcastDoctrine: 'publish-tools',
					},
				})
			);
			window.__badgerEndingCards = [];
			window.addEventListener('badger:ending-card', (event) => {
				window.__badgerEndingCards.push((event as CustomEvent).detail);
			});
		});

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await expect.poll(() => page.evaluate(() => window.__badgerEndingCards.length)).toBeGreaterThan(0);

		const endingCard = await page.evaluate(() => window.__badgerEndingCards[0]);
		expect(endingCard).toMatchObject({
			doctrine: 'publish-tools',
			title: 'Publish the Tools',
			resultFlag: 'broadcast_publish_tools',
		});
		expect(endingCard.body).toContain('exploit kit');
	});
});

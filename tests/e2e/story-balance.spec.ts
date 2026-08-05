import { expect, test } from '@playwright/test';
import { enterStoryFlow } from './support/story-navigation';

test.describe('Story heat/favor balance', () => {
	test('projects seeded heat and favor into stage runtime balance rules', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 0,
						blueprintShards: 0,
						purchasedSkills: ['silver_tongue'],
						dubFavor: 3,
						orbitHeat: 6,
					},
					storyProgress: {
						currentStageId: 'lower-sprawl',
						completedStageIds: [],
						completedChapterIds: [],
						acquiredPayloads: [],
						resultFlags: ['lio_protected', 'ledger_public_dump'],
					},
				})
			);
			window.__badgerStoryBalances = [];
			window.addEventListener('badger:story-balance', (event) => {
				window.__badgerStoryBalances.push((event as CustomEvent).detail);
			});
		});

		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await enterStoryFlow(page);

		for (let index = 0; index < 3; index += 1) {
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
		await page.keyboard.press('r');
		await expect.poll(() => consoleMessages).toContain('StageRunScene entered');
		await expect.poll(() => page.evaluate(() => window.__badgerStoryBalances.length)).toBeGreaterThan(0);

		const balance = await page.evaluate(() => window.__badgerStoryBalances[0]);
		expect(balance).toMatchObject({
			allyAssistLevel: 'high',
			hazardIntensity: 'extreme',
			endingTone: 'mercy',
		});
		expect(balance.merchantPriceModifier).toBeGreaterThan(1);
		expect(balance.activeReasons).toEqual(expect.arrayContaining(['heat:6', 'favor:3', 'ledger:public']));
	});
});

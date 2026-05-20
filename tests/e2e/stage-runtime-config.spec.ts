import { expect, test } from '@playwright/test';

test.describe('Stage runtime config', () => {
	test('projects stage modifiers into StageRunScene runtime config', async ({ page }) => {
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: { credchips: 0, blueprintShards: 0, purchasedSkills: [], dubFavor: 0, orbitHeat: 0 },
					storyProgress: {
						currentStageId: 'dub-colony',
						completedStageIds: [],
						completedChapterIds: [],
						acquiredPayloads: [],
						resultFlags: [],
					},
				})
			);
			window.__badgerStageRuntimeConfigs = [];
			window.addEventListener('badger:stage-runtime-config', (event) => {
				window.__badgerStageRuntimeConfigs.push((event as CustomEvent).detail);
			});
		});

		const consoleMessages: string[] = [];
		page.on('console', (message) => consoleMessages.push(message.text()));

		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
		await page.locator('#game').click();
		await page.keyboard.press('Enter');
		await expect.poll(() => consoleMessages).toContain('StoryFlowScene entered');

		for (let index = 0; index < 3; index += 1) {
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
		await page.keyboard.press('r');
		await expect.poll(() => consoleMessages).toContain('StageRunScene entered');
		await expect.poll(() => page.evaluate(() => window.__badgerStageRuntimeConfigs.length)).toBeGreaterThan(0);

		const config = await page.evaluate(() => window.__badgerStageRuntimeConfigs[0]);
		expect(config).toMatchObject({
			stageId: 'dub-colony',
			cameraPressure: 'rhythm',
			payloadRewardId: 'bass_reactor_core',
			bossPlaceholderId: 'king-feedback',
		});
		expect(config.modifierRules).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'bass-reactor-sync', effect: 'rhythm window 90ms at 140bpm' }),
			])
		);
		expect(config.enemyMixTags).toEqual(expect.arrayContaining(['beat-timing']));
	});
});

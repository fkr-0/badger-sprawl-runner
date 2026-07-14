import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface ProgressionWindow extends Window {
	__badger: BadgerTestHarness;
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as ProgressionWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 10_000 }
	);
}

async function enterSkillTree(page: Page): Promise<void> {
	await page.goto('/');
	await waitForScene(page, 'TitleScene');
	await page.locator('#game').click();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await waitForScene(page, 'SkillTreeScene');
	await page.waitForFunction(
		() => (window as ProgressionWindow).__badger?.hasSheet('skill_icons'),
		null,
		{ timeout: 10_000 }
	);
}

test.describe('expanded progression skill graph', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 0,
						blueprintShards: 20,
						dubFavor: 0,
						orbitHeat: 0,
						unlockedBoons: [],
						purchasedSkills: [],
					},
					storyProgress: {
						currentStageId: 'lower-sprawl',
						completedStageIds: [],
						completedChapterIds: [],
						acquiredPayloads: [],
						resultFlags: [],
						campaignComplete: false,
					},
				})
			);
		});
	});

	test('renders twenty sprite-backed nodes and installs each track root', async ({ page }) => {
		await enterSkillTree(page);
		await expect
			.poll(() => page.evaluate(() => (window as ProgressionWindow).__badger.getSkillTree()))
			.toMatchObject({
				selectedSkillId: 'double_swipe',
				selectedTrack: 'clawline',
				selectedTier: 1,
				blueprintShards: 20,
				trackProgress: { clawline: 0, railgun: 0, rocket: 0, hacking: 0 },
			});
		await expect
			.poll(() =>
				page.evaluate(() => (window as ProgressionWindow).__badger.getSkillTree()?.skills.length)
			)
			.toBe(20);

		await page.keyboard.press('Enter');
		await page.keyboard.press('ArrowRight');
		await expect
			.poll(() =>
				page.evaluate(() => (window as ProgressionWindow).__badger.getSkillTree()?.selectedSkillId)
			)
			.toBe('rail_mastery');
		await page.keyboard.press('Enter');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Enter');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Enter');

		await expect
			.poll(() => page.evaluate(() => (window as ProgressionWindow).__badger.getSkillTree()))
			.toMatchObject({
				blueprintShards: 15,
				purchasedSkills: ['double_swipe', 'rail_mastery', 'fuel_sipper', 'street_syntax'],
				trackProgress: { clawline: 1, railgun: 1, rocket: 1, hacking: 1 },
				message: 'Street Syntax unlocked',
			});
	});
});

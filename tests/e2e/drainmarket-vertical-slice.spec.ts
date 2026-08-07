import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';
import { deployStoryStageFromTitle } from './helpers/deploy-story-stage';

type Present<T> = Exclude<T, null>;

interface DrainmarketHarness
	extends Omit<
		BadgerTestHarness,
		'getCheckpoint' | 'getDrainmarketObjectives' | 'getEnemies' | 'getKnifeDroneNest' | 'getPickups'
	> {
	getCheckpoint: () => Present<ReturnType<BadgerTestHarness['getCheckpoint']>>;
	getDrainmarketObjectives: () => Present<
		ReturnType<BadgerTestHarness['getDrainmarketObjectives']>
	>;
	getEnemies: () => Present<ReturnType<BadgerTestHarness['getEnemies']>>;
	getKnifeDroneNest: () => Present<ReturnType<BadgerTestHarness['getKnifeDroneNest']>>;
	getPickups: () => Present<ReturnType<BadgerTestHarness['getPickups']>>;
}

interface DrainmarketWindow extends Window {
	__badger: DrainmarketHarness;
	__drainmarketEvents: unknown[];
	__stageCompletions: unknown[];
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as DrainmarketWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 10_000 }
	);
}

async function teleportTo(page: Page, x: number, y: number): Promise<void> {
	await page.evaluate(
		([targetX, targetY]) =>
			(window as DrainmarketWindow).__badger.teleportPlayer(targetX - 17, targetY - 23),
		[x, y]
	);
	await page.waitForTimeout(60);
}

async function enterDrainmarket(page: Page): Promise<void> {
	await deployStoryStageFromTitle(page, 'drainmarket');

	for (let safety = 0; safety < 8; safety += 1) {
		const mode = await page.evaluate(
			() => (window as DrainmarketWindow).__badger.getStoryState().mode
		);
		if (mode === 'stage') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(40);
	}
	await expect
		.poll(() => page.evaluate(() => (window as DrainmarketWindow).__badger.getStoryState().mode))
		.toBe('stage');

	await page.keyboard.press('2');
	await page.keyboard.press('KeyR');
	await waitForScene(page, 'StageRunScene');
	await page.waitForFunction(
		() =>
			(window as DrainmarketWindow).__badger?.hasSheet('drainmarket_parallax') &&
			(window as DrainmarketWindow).__badger?.hasSheet('enemy_knife_drone') &&
			(window as DrainmarketWindow).__badger?.hasSheet('boss_boss_knife_drone_nest'),
		null,
		{ timeout: 10_000 }
	);
}

test.describe('Drainmarket complete vertical slice', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 1,
						blueprintShards: 0,
						dubFavor: 0,
						orbitHeat: 0,
						unlockedBoons: [],
						purchasedSkills: [],
					},
					storyProgress: {
						currentStageId: 'drainmarket',
						completedStageIds: ['lower-sprawl'],
						acquiredPayloadIds: ['wafer_key'],
						resultFlags: ['wafer_key_acquired'],
						completedQuestIds: ['meter-maidens-ledger'],
						completedMinigameIds: ['toll-gate-rhythm'],
						completedTutorialIds: ['jump-coyote', 'public-route-reading'],
						branchHistory: [],
						branchRecaps: [],
						stageRuntimeHistory: [],
					},
				})
			);
			const e2eWindow = window as DrainmarketWindow;
			e2eWindow.__drainmarketEvents = [];
			e2eWindow.__stageCompletions = [];
			window.addEventListener('badger:drainmarket-progress', (event) => {
				e2eWindow.__drainmarketEvents.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:stage-complete', (event) => {
				e2eWindow.__stageCompletions.push((event as CustomEvent).detail);
			});
		});
	});

	test('renders authored Drainmarket combat and teaches the red-flash parry', async ({ page }) => {
		await enterDrainmarket(page);
		await expect
			.poll(() =>
				page.evaluate(() => (window as DrainmarketWindow).__badger.getCheckpoint().activeId)
			)
			.toBe('drain-entry');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as DrainmarketWindow).__badger.getDrainmarketObjectives().stageId
				)
			)
			.toBe('drainmarket');

		const knife = await page.evaluate(() =>
			(window as DrainmarketWindow).__badger
				.getEnemies()
				.find((enemy) => enemy.id === 'knife-drone-west')
		);
		expect(knife).toBeTruthy();
		expect(
			await page.evaluate(() =>
				(window as DrainmarketWindow).__badger.hasSheet('enemy_knife_drone')
			)
		).toBe(true);
		await teleportTo(page, (knife?.x ?? 560) + 70, knife?.y ?? 405);
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as DrainmarketWindow).__badger.getDrainmarketObjectives().parryWindowSeen
				)
			)
			.toBe(true);
		await page.keyboard.press('KeyL');
		await expect
			.poll(() =>
				page.evaluate(
					() =>
						(window as DrainmarketWindow).__badger.getDrainmarketObjectives().parryTutorialComplete
				)
			)
			.toBe(true);
	});

	test('completes invoices, triage, Knife-drone Nest, and advances to Chrome Arcology', async ({
		page,
	}) => {
		await enterDrainmarket(page);
		const objectives = await page.evaluate(() =>
			(window as DrainmarketWindow).__badger.getDrainmarketObjectives()
		);
		for (const invoice of objectives.invoices) {
			await teleportTo(page, invoice.x, invoice.y);
			await page.keyboard.press('KeyM');
			await expect
				.poll(() =>
					page.evaluate(
						(invoiceId) =>
							(window as DrainmarketWindow).__badger
								.getDrainmarketObjectives()
								.invoices.find((entry) => entry.id === invoiceId)?.delivered,
						invoice.id
					)
				)
				.toBe(true);
		}
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as DrainmarketWindow).__badger.getDrainmarketObjectives().questComplete
				)
			)
			.toBe(true);

		await teleportTo(page, objectives.clinic.x, objectives.clinic.y);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as DrainmarketWindow).__badger.getDrainmarketObjectives().expectedInput
				)
			)
			.toBe('parry');
		await page.keyboard.press('KeyL');
		await page.waitForTimeout(60);
		await page.keyboard.press('KeyJ');
		await page.waitForTimeout(60);
		await page.keyboard.press('KeyK');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as DrainmarketWindow).__badger.getDrainmarketObjectives().triageStatus
				)
			)
			.toBe('solved');

		await expect
			.poll(() =>
				page.evaluate(() => (window as DrainmarketWindow).__badger.getKnifeDroneNest().attackCount)
			)
			.toBeGreaterThan(0);
		await page.evaluate(() => (window as DrainmarketWindow).__badger.setBossHp(0));
		const payload = await page.evaluate(() =>
			(window as DrainmarketWindow).__badger
				.getPickups()
				.find((pickup) => pickup.kind === 'story_payload')
		);
		expect(payload).toBeTruthy();
		await teleportTo(page, payload?.x ?? 1880, payload?.y ?? 395);

		await waitForScene(page, 'StoryFlowScene');
		await expect
			.poll(() => page.evaluate(() => (window as DrainmarketWindow).__badger.getStoryState().mode))
			.toBe('debrief');
		for (let safety = 0; safety < 5; safety += 1) {
			const currentStageId = await page.evaluate(
				() => (window as DrainmarketWindow).__badger.getStoryProgress().currentStageId
			);
			if (currentStageId === 'chrome-arcology') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(45);
		}
		await expect
			.poll(() => page.evaluate(() => (window as DrainmarketWindow).__badger.getStoryProgress()))
			.toMatchObject({
				currentStageId: 'chrome-arcology',
				completedStageIds: ['lower-sprawl', 'drainmarket'],
			});
		await expect
			.poll(() =>
				page.evaluate(() => (window as DrainmarketWindow).__badger.getStoryProgress().resultFlags)
			)
			.toContain('stim_cache_secured');
	});
});

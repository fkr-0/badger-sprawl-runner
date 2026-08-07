import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';
import { deployStoryStageFromTitle } from './helpers/deploy-story-stage';

type Present<T> = Exclude<T, null>;

interface ArcologyHarness
	extends Omit<
		BadgerTestHarness,
		| 'getCheckpoint'
		| 'getChromeArcologyObjectives'
		| 'getEnemies'
		| 'getMadameVitrine'
		| 'getPickups'
	> {
	getCheckpoint: () => Present<ReturnType<BadgerTestHarness['getCheckpoint']>>;
	getChromeArcologyObjectives: () => Present<
		ReturnType<BadgerTestHarness['getChromeArcologyObjectives']>
	>;
	getEnemies: () => Present<ReturnType<BadgerTestHarness['getEnemies']>>;
	getMadameVitrine: () => Present<ReturnType<BadgerTestHarness['getMadameVitrine']>>;
	getPickups: () => Present<ReturnType<BadgerTestHarness['getPickups']>>;
}

async function collectGear(page: Page, itemId: string): Promise<void> {
	const pickup = await page.evaluate(
		(id) => (window as ArcologyWindow).__badger.getPickups().find((entry) => entry.itemId === id),
		itemId
	);
	expect(pickup).toBeTruthy();
	expect(pickup?.spriteSheetId).toBe('items_extended');
	await teleportTo(page, pickup?.x ?? 470, pickup?.y ?? 315);
	await expect
		.poll(() =>
			page.evaluate(
				(id) => (window as ArcologyWindow).__badger.getLoadout()?.equippedItemIds.includes(id),
				itemId
			)
		)
		.toBe(true);
}

interface ArcologyWindow extends Window {
	__badger: ArcologyHarness;
	__arcologyEvents: unknown[];
	__stageCompletions: unknown[];
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as ArcologyWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 10_000 }
	);
}

async function teleportTo(page: Page, x: number, y: number): Promise<void> {
	await page.evaluate(
		([targetX, targetY]) =>
			(window as ArcologyWindow).__badger.teleportPlayer(targetX - 17, targetY - 23),
		[x, y]
	);
	await page.waitForTimeout(70);
}

async function enterChromeArcology(page: Page): Promise<void> {
	await deployStoryStageFromTitle(page, 'chrome-arcology');

	for (let safety = 0; safety < 8; safety += 1) {
		const mode = await page.evaluate(() => (window as ArcologyWindow).__badger.getStoryState().mode);
		if (mode === 'stage') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(40);
	}
	await expect
		.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getStoryState().mode))
		.toBe('stage');

	await page.keyboard.press('2');
	await page.keyboard.press('KeyR');
	await waitForScene(page, 'StageRunScene');
	await page.waitForFunction(
		() =>
			(window as ArcologyWindow).__badger?.hasSheet('chrome_arcology_parallax') &&
			(window as ArcologyWindow).__badger?.hasSheet('items_extended') &&
			(window as ArcologyWindow).__badger?.hasSheet('item_icons_extended') &&
			(window as ArcologyWindow).__badger?.hasSheet('skill_icons') &&
			(window as ArcologyWindow).__badger?.hasSheet('enemy_chrome_bellhop') &&
			(window as ArcologyWindow).__badger?.hasSheet('enemy_mirror_sentinel') &&
			(window as ArcologyWindow).__badger?.hasSheet(
				'boss_boss_madame_vitrine_glasscourt'
			),
		null,
		{ timeout: 10_000 }
	);
}

async function collectRailgun(page: Page): Promise<void> {
	const railgun = await page.evaluate(() =>
		(window as ArcologyWindow).__badger
			.getPickups()
			.find((pickup) => pickup.kind === 'railgun')
	);
	expect(railgun).toBeTruthy();
	await teleportTo(page, railgun?.x ?? 245, railgun?.y ?? 382);
	await expect
		.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getPlayer()?.hasRailgun))
		.toBe(true);
}

test.describe('Chrome Arcology complete vertical slice', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 2,
						blueprintShards: 1,
						dubFavor: 0,
						orbitHeat: 0,
						unlockedBoons: [],
						purchasedSkills: ['rail_mastery', 'piercing_shot'],
					},
					storyProgress: {
						currentStageId: 'chrome-arcology',
						completedStageIds: ['lower-sprawl', 'drainmarket'],
						completedChapterIds: ['ch-01', 'ch-02'],
						acquiredPayloads: ['wafer_key', 'stim_cache'],
						resultFlags: ['wafer_key_acquired', 'stim_cache_secured'],
						campaignComplete: false,
					},
				})
			);
			const e2eWindow = window as ArcologyWindow;
			e2eWindow.__arcologyEvents = [];
			e2eWindow.__stageCompletions = [];
			window.addEventListener('badger:chrome-arcology-progress', (event) => {
				e2eWindow.__arcologyEvents.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:stage-complete', (event) => {
				e2eWindow.__stageCompletions.push((event as CustomEvent).detail);
			});
		});
	});

	test('loads authored Arcology combat and fires a real piercing railgun lane', async ({ page }) => {
		await enterChromeArcology(page);
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getCheckpoint().activeId))
			.toBe('arcology-lobby');
		await expect
			.poll(() =>
				page.evaluate(() => (window as ArcologyWindow).__badger.getChromeArcologyObjectives().stageId)
			)
			.toBe('chrome-arcology');
		await collectRailgun(page);
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getLoadout()))
			.toMatchObject({
				skillTrackRanks: { railgun: 2 },
				effects: {
					railDamageBonus: 0.25,
					railPierceBonus: 1,
					railCooldownReduction: 0.06,
				},
			});
		await collectGear(page, 'capacitor_coil');
		await collectGear(page, 'rail_heat_sink');
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getLoadout()?.effects))
			.toMatchObject({
				railDamageBonus: 0.45,
				railPierceBonus: 2,
				railCooldownReduction: 0.28,
				railRecoilReduction: 0.65,
			});

		const firstSightline = await page.evaluate(
			() => (window as ArcologyWindow).__badger.getChromeArcologyObjectives().sightlines[0]
		);
		await teleportTo(page, firstSightline.x, firstSightline.y);
		await page.keyboard.press('KeyK');
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getAnimation()?.currentAnim))
			.toBe('shoot_railgun');
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getPlayer()?.railgunHitCount))
			.toBeGreaterThan(0);
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getPlayer()?.shootCd))
			.toBeLessThan(0.5);
		await expect
			.poll(() =>
				page.evaluate(
					() =>
						(window as ArcologyWindow).__badger.getChromeArcologyObjectives().sightlines[0]
							.pierced
				)
			)
			.toBe(true);

		expect(
			await page.evaluate(() =>
				(window as ArcologyWindow).__badger.hasSheet('enemy_chrome_bellhop') &&
				(window as ArcologyWindow).__badger.hasSheet('enemy_mirror_sentinel')
			)
		).toBe(true);
		expect(await page.evaluate(() => (window as ArcologyWindow).__badger.getEnemies().length)).toBeGreaterThan(0);
	});

	test('routes the prisoner elevator, defeats Vitrine, and advances to Mirror Palace', async ({
		page,
	}) => {
		await enterChromeArcology(page);
		await collectRailgun(page);
		const objectives = await page.evaluate(
			() => (window as ArcologyWindow).__badger.getChromeArcologyObjectives()
		);

		for (const sightline of objectives.sightlines) {
			await teleportTo(page, sightline.x, sightline.y);
			await expect
				.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getPlayer()?.shootCd))
				.toBe(0);
			await page.keyboard.press('KeyK');
			await expect
				.poll(() =>
					page.evaluate(
						(sightlineId) =>
							(window as ArcologyWindow).__badger
								.getChromeArcologyObjectives()
								.sightlines.find((entry) => entry.id === sightlineId)?.pierced,
						sightline.id
					)
				)
				.toBe(true);
			await page.waitForTimeout(760);
		}

		for (const tag of objectives.cargoTags) {
			await teleportTo(page, tag.x, tag.y);
			await page.keyboard.press('KeyM');
			await expect
				.poll(() =>
					page.evaluate(
						(tagId) =>
							(window as ArcologyWindow).__badger
								.getChromeArcologyObjectives()
								.cargoTags.find((entry) => entry.id === tagId)?.scanned,
						tag.id
					)
				)
				.toBe(true);
		}

		await teleportTo(page, objectives.router.x, objectives.router.y);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as ArcologyWindow).__badger.getChromeArcologyObjectives().expectedInput
				)
			)
			.toBe('shoot');
		await page.keyboard.press('KeyK');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as ArcologyWindow).__badger.getChromeArcologyObjectives().expectedInput
				)
			)
			.toBe('parry');
		await page.keyboard.press('KeyL');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as ArcologyWindow).__badger.getChromeArcologyObjectives().expectedInput
				)
			)
			.toBe('shoot');
		await page.keyboard.press('KeyK');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as ArcologyWindow).__badger.getChromeArcologyObjectives().routerStatus
				)
			)
			.toBe('solved');

		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getMadameVitrine().attackCount))
			.toBeGreaterThan(0);
		const boss = await page.evaluate(() =>
			(window as ArcologyWindow).__badger
				.getEnemies()
				.find((enemy) => enemy.bossId === 'madame-vitrine')
		);
		expect(boss).toBeTruthy();
		await page.evaluate((hp) => (window as ArcologyWindow).__badger.setBossHp(hp), 7);
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getBossPhase()?.phaseIndex))
			.toBe(1);
		await page.evaluate((hp) => (window as ArcologyWindow).__badger.setBossHp(hp), 3);
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getBossPhase()?.phaseIndex))
			.toBe(2);
		await page.evaluate(() => (window as ArcologyWindow).__badger.setBossHp(0));

		const payload = await page.evaluate(() =>
			(window as ArcologyWindow).__badger
				.getPickups()
				.find((pickup) => pickup.kind === 'story_payload')
		);
		expect(payload).toBeTruthy();
		await teleportTo(page, payload?.x ?? 2180, payload?.y ?? 392);

		await waitForScene(page, 'StoryFlowScene');
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getStoryState().mode))
			.toBe('debrief');
		for (let safety = 0; safety < 5; safety += 1) {
			const stageId = await page.evaluate(
				() => (window as ArcologyWindow).__badger.getStoryProgress().currentStageId
			);
			if (stageId === 'mirror-palace') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(45);
		}
		await expect
			.poll(() => page.evaluate(() => (window as ArcologyWindow).__badger.getStoryProgress()))
			.toMatchObject({
				currentStageId: 'mirror-palace',
				completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology'],
			});
		await expect
			.poll(() =>
				page.evaluate(() => (window as ArcologyWindow).__badger.getStoryProgress().acquiredPayloads)
			)
			.toContain('elevator_seed');
	});
});

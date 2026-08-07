import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';
import { deployStoryStageFromTitle } from './helpers/deploy-story-stage';

type Present<T> = Exclude<T, null>;

interface MirrorHarness
	extends Omit<
		BadgerTestHarness,
		| 'getCheckpoint'
		| 'getMirrorPalaceObjectives'
		| 'getEnemies'
		| 'getReflectionJudge'
		| 'getPickups'
	> {
	getCheckpoint: () => Present<ReturnType<BadgerTestHarness['getCheckpoint']>>;
	getMirrorPalaceObjectives: () => Present<
		ReturnType<BadgerTestHarness['getMirrorPalaceObjectives']>
	>;
	getEnemies: () => Present<ReturnType<BadgerTestHarness['getEnemies']>>;
	getReflectionJudge: () => Present<ReturnType<BadgerTestHarness['getReflectionJudge']>>;
	getPickups: () => Present<ReturnType<BadgerTestHarness['getPickups']>>;
}

interface MirrorWindow extends Window {
	__badger: MirrorHarness;
	__mirrorEvents: unknown[];
	__stageCompletions: unknown[];
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as MirrorWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 10_000 }
	);
}

async function teleportTo(page: Page, x: number, y: number): Promise<void> {
	await page.evaluate(
		([targetX, targetY]) =>
			(window as MirrorWindow).__badger.teleportPlayer(targetX - 17, targetY - 23),
		[x, y]
	);
	await page.waitForTimeout(70);
}

async function enterMirrorPalace(page: Page): Promise<void> {
	await deployStoryStageFromTitle(page, 'mirror-palace');
	await expect
		.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getStoryPresentation()))
		.toMatchObject({
			mode: 'title-card',
			stageId: 'mirror-palace',
			chapter: 4,
			placard: 'Debt can make a friend wear the enemy mask before they stop loving you.',
		});

	for (let safety = 0; safety < 8; safety += 1) {
		const mode = await page.evaluate(() => (window as MirrorWindow).__badger.getStoryState().mode);
		if (mode === 'stage') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(45);
	}
	await expect
		.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getStoryState().mode))
		.toBe('stage');
	await expect
		.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getStoryPresentation()))
		.toMatchObject({ selectedResultFlag: 'lio_exposed', choiceCommitted: false });

	await page.keyboard.press('2');
	await expect
		.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getStoryProgress()))
		.toMatchObject({ lioTrust: 'protected', resultFlags: expect.arrayContaining(['lio_protected']) });
	await page.keyboard.press('KeyR');
	await waitForScene(page, 'StageRunScene');
	await page.waitForFunction(
		() =>
			(window as MirrorWindow).__badger?.hasSheet('moss_badger_production') &&
			(window as MirrorWindow).__badger?.hasSheet('straylight_mirage_parallax') &&
			(window as MirrorWindow).__badger?.hasSheet('character_lio') &&
			(window as MirrorWindow).__badger?.hasSheet('enemy_masque_duelist') &&
			(window as MirrorWindow).__badger?.hasSheet('enemy_mirror_sentinel') &&
			(window as MirrorWindow).__badger?.hasSheet('boss_boss_reflection_judge_court'),
		null,
		{ timeout: 10_000 }
	);
}

async function collectRocket(page: Page): Promise<void> {
	const rocket = await page.evaluate(() =>
		(window as MirrorWindow).__badger.getPickups().find((pickup) => pickup.kind === 'rocket')
	);
	expect(rocket).toBeTruthy();
	await teleportTo(page, rocket?.x ?? 225, rocket?.y ?? 384);
	await expect
		.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getPlayer()?.hasRocket))
		.toBe(true);
}

test.describe('Mirror Palace story and animation vertical slice', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 4,
						blueprintShards: 2,
						dubFavor: 1,
						orbitHeat: 1,
						unlockedBoons: [],
						purchasedSkills: ['fuel_sipper', 'vector_kick', 'street_syntax'],
					},
					storyProgress: {
						currentStageId: 'mirror-palace',
						completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology'],
						completedChapterIds: ['ch-01', 'ch-02', 'ch-03'],
						acquiredPayloads: ['wafer_key', 'stim_cache', 'elevator_seed'],
						resultFlags: ['wafer_key_acquired', 'stim_cache_secured', 'elevator_seed_taken'],
						campaignComplete: false,
					},
				})
			);
			const e2eWindow = window as MirrorWindow;
			e2eWindow.__mirrorEvents = [];
			e2eWindow.__stageCompletions = [];
			window.addEventListener('badger:mirror-palace-progress', (event) => {
				e2eWindow.__mirrorEvents.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:stage-complete', (event) => {
				e2eWindow.__stageCompletions.push((event as CustomEvent).detail);
			});
		});
	});

	test('uses the full Moss motion atlas for rocket, interaction, and combat states', async ({ page }) => {
		await enterMirrorPalace(page);
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getCheckpoint().activeId))
			.toBe('palace-foyer');
		await collectRocket(page);
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getAnimation()?.frames))
			.toBeGreaterThanOrEqual(3);

		const door = await page.evaluate(
			() => (window as MirrorWindow).__badger.getMirrorPalaceObjectives().traversalSeals[0]
		);
		await teleportTo(page, door.x, door.y);
		await page.keyboard.press('KeyE');
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as MirrorWindow).__badger
						.getAnimationTransitions()
						?.some((transition) => transition.name === 'rocket_boost')
				)
			)
			.toBe(true);
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as MirrorWindow).__badger.getMirrorPalaceObjectives().traversalSeals[0]
						.broken
				)
			)
			.toBe(true);

		const firstGuest = await page.evaluate(
			() => (window as MirrorWindow).__badger.getMirrorPalaceObjectives().guests[0]
		);
		await teleportTo(page, firstGuest.x, firstGuest.y);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getAnimation()))
			.toMatchObject({ currentAnim: 'interact', frames: 4 });

		expect(
			await page.evaluate(() =>
				(window as MirrorWindow).__badger.hasSheet('enemy_masque_duelist') &&
				(window as MirrorWindow).__badger.hasSheet('enemy_mirror_sentinel')
			)
		).toBe(true);
		expect(await page.evaluate(() => (window as MirrorWindow).__badger.getEnemies().length)).toBeGreaterThan(0);
	});

	test('completes the refusal table, defeats the Judge, and advances to Dub Colony', async ({ page }) => {
		await enterMirrorPalace(page);
		await collectRocket(page);
		let objectives = await page.evaluate(
			() => (window as MirrorWindow).__badger.getMirrorPalaceObjectives()
		);

		for (const guest of objectives.guests) {
			await teleportTo(page, guest.x, guest.y);
			await page.keyboard.press('KeyM');
			await expect
				.poll(() =>
					page.evaluate(
						(id) =>
							(window as MirrorWindow).__badger
								.getMirrorPalaceObjectives()
								.guests.find((entry) => entry.id === id)?.heard,
						guest.id
					)
				)
				.toBe(true);
		}

		const [door, loop, switchback] = objectives.traversalSeals;
		await teleportTo(page, door.x, door.y);
		await page.keyboard.press('KeyE');
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as MirrorWindow).__badger
							.getMirrorPalaceObjectives()
							.traversalSeals.find((seal) => seal.id === id)?.broken,
					door.id
				)
			)
			.toBe(true);
		await teleportTo(page, loop.x, loop.y);
		await page.keyboard.down('KeyD');
		await page.waitForTimeout(45);
		await page.keyboard.up('KeyD');
		await page.keyboard.down('KeyA');
		await page.waitForTimeout(45);
		await page.keyboard.up('KeyA');
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as MirrorWindow).__badger
							.getMirrorPalaceObjectives()
							.traversalSeals.find((seal) => seal.id === id)?.broken,
					loop.id
				)
			)
			.toBe(true);
		await teleportTo(page, switchback.x, switchback.y);
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getPlayer()?.boostCd ?? 0))
			.toBe(0);
		await page.keyboard.press('KeyE');
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as MirrorWindow).__badger
						.getMirrorPalaceObjectives()
						.traversalSeals.every((seal) => seal.broken)
				)
			)
			.toBe(true);

		objectives = await page.evaluate(
			() => (window as MirrorWindow).__badger.getMirrorPalaceObjectives()
		);
		await teleportTo(page, objectives.etiquetteTerminal.x, objectives.etiquetteTerminal.y);
		await page.keyboard.press('KeyM');
		await page.keyboard.press('KeyL');
		await page.waitForTimeout(70);
		await page.keyboard.press('KeyJ');
		await page.waitForTimeout(70);
		await page.keyboard.press('ShiftLeft');
		await page.waitForTimeout(70);
		await page.keyboard.press('KeyL');
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as MirrorWindow).__badger.getMirrorPalaceObjectives().etiquetteStatus
				)
			)
			.toBe('solved');

		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getReflectionJudge().attackCount))
			.toBeGreaterThan(0);
		await page.evaluate(() => (window as MirrorWindow).__badger.setBossHp(8));
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getBossPhase()?.phaseIndex))
			.toBe(1);
		await page.evaluate(() => (window as MirrorWindow).__badger.setBossHp(4));
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getBossPhase()?.phaseIndex))
			.toBe(2);
		await page.evaluate(() => (window as MirrorWindow).__badger.setBossHp(0));

		const payload = await page.evaluate(() =>
			(window as MirrorWindow).__badger.getPickups().find((pickup) => pickup.itemId === 'mirror_pass')
		);
		expect(payload).toBeTruthy();
		await teleportTo(page, payload?.x ?? 2440, payload?.y ?? 392);
		await waitForScene(page, 'StoryFlowScene');
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getStoryState().mode))
			.toBe('debrief');
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getStoryPresentation()))
			.toMatchObject({ stageId: 'mirror-palace', speaker: 'Lio' });

		for (let safety = 0; safety < 6; safety += 1) {
			const stageId = await page.evaluate(
				() => (window as MirrorWindow).__badger.getStoryProgress().currentStageId
			);
			if (stageId === 'dub-colony') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(45);
		}
		await expect
			.poll(() => page.evaluate(() => (window as MirrorWindow).__badger.getStoryProgress()))
			.toMatchObject({
				currentStageId: 'dub-colony',
				lioTrust: 'protected',
				completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace'],
			});
		await expect
			.poll(() =>
				page.evaluate(() => (window as MirrorWindow).__badger.getStoryProgress().acquiredPayloads)
			)
			.toContain('mirror_pass');
	});
});

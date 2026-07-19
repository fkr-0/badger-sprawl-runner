import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

type Present<T> = Exclude<T, null>;

interface ColonyHarness
	extends Omit<
		BadgerTestHarness,
		| 'getCheckpoint'
		| 'getDubColonyObjectives'
		| 'getEnemies'
		| 'getKingFeedback'
		| 'getCompanions'
		| 'getPickups'
	> {
	getCheckpoint: () => Present<ReturnType<BadgerTestHarness['getCheckpoint']>>;
	getDubColonyObjectives: () => Present<ReturnType<BadgerTestHarness['getDubColonyObjectives']>>;
	getEnemies: () => Present<ReturnType<BadgerTestHarness['getEnemies']>>;
	getKingFeedback: () => Present<ReturnType<BadgerTestHarness['getKingFeedback']>>;
	getCompanions: () => Present<ReturnType<BadgerTestHarness['getCompanions']>>;
	getPickups: () => Present<ReturnType<BadgerTestHarness['getPickups']>>;
}

interface ColonyWindow extends Window {
	__badger: ColonyHarness;
	__colonyEvents: unknown[];
	__stageCompletions: unknown[];
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as ColonyWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 10_000 }
	);
}

async function teleportTo(page: Page, x: number, y: number): Promise<void> {
	await page.evaluate(
		([targetX, targetY]) =>
			// Place Moss's feet at the authored interaction height. Centering the
			// body on elevated reactor nodes embeds it in their platform and makes
			// slower beat waits dependent on collision correction.
			(window as ColonyWindow).__badger.teleportPlayer(targetX - 17, targetY - 46),
		[x, y]
	);
	await page.waitForTimeout(70);
}

async function enterDubColony(page: Page): Promise<void> {
	await page.goto('/');
	await waitForScene(page, 'TitleScene');
	await page.locator('#game').click();
	await page.keyboard.press('Enter');
	await waitForScene(page, 'StoryFlowScene');
	await expect
		.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getStoryPresentation()))
		.toMatchObject({
			mode: 'title-card',
			stageId: 'dub-colony',
			chapter: 5,
			placard: 'A free home can still learn the posture of a fortress.',
		});

	for (let safety = 0; safety < 8; safety += 1) {
		const mode = await page.evaluate(() => (window as ColonyWindow).__badger.getStoryState().mode);
		if (mode === 'stage') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(45);
	}
	await expect
		.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getStoryState().mode))
		.toBe('stage');
	await expect
		.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getStoryPresentation()))
		.toMatchObject({ selectedResultFlag: 'colony_alignment_chorus', choiceCommitted: false });

	await page.keyboard.press('1');
	await expect
		.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getStoryProgress()))
		.toMatchObject({
			colonyAlignment: 'chorus',
			resultFlags: expect.arrayContaining(['colony_alignment_chorus']),
		});
	await page.keyboard.press('KeyR');
	await waitForScene(page, 'StageRunScene');
	await page.waitForFunction(
		() =>
			(window as ColonyWindow).__badger?.hasSheet('moss_badger_production') &&
			(window as ColonyWindow).__badger?.hasSheet('dub_colony_parallax') &&
			(window as ColonyWindow).__badger?.hasSheet('dub_colony_tiles') &&
			(window as ColonyWindow).__badger?.hasSheet('character_naya_root') &&
			(window as ColonyWindow).__badger?.hasSheet('character_little_ix') &&
			(window as ColonyWindow).__badger?.hasSheet('enemy_signal_jammer_bat') &&
			(window as ColonyWindow).__badger?.hasSheet('enemy_feedback_guard') &&
			(window as ColonyWindow).__badger?.hasSheet('boss_boss_king_feedback_ampthrone'),
		null,
		{ timeout: 10_000 }
	);
}

async function clearColonyEnemies(page: Page): Promise<void> {
	const ids = await page.evaluate(() =>
		(window as ColonyWindow).__badger
			.getEnemies()
			.filter((enemy) => !enemy.bossId)
			.map((enemy) => enemy.id)
			.filter((id): id is string => Boolean(id))
	);
	for (const id of ids) {
		await page.evaluate((enemyId) => (window as ColonyWindow).__badger.setEnemyHp(enemyId, 0), id);
	}
}

async function tuneNode(
	page: Page,
	node: ReturnType<ColonyHarness['getDubColonyObjectives']>['reactorNodes'][number]
): Promise<void> {
	await teleportTo(page, node.x, node.y);
	const key = node.expectedAction === 'jump' ? 'Space' : node.expectedAction === 'parry' ? 'KeyL' : 'KeyJ';
	for (let attempt = 0; attempt < 8; attempt += 1) {
		// Synchronize to a fresh rising edge instead of reusing the tail of the
		// current window. At 86 BPM the wider pocket can otherwise keep a failed
		// retry inside the same beat while the action cooldown is still active.
		await page.waitForFunction(
			() => !(window as ColonyWindow).__badger.getDubColonyObjectives().inBeatWindow,
			null,
			{ timeout: 4_000 }
		);
		await page.waitForFunction(
			() => {
				const snapshot = (window as ColonyWindow).__badger.getDubColonyObjectives();
				return snapshot.inBeatWindow && snapshot.jamRemaining === 0;
			},
			null,
			{ timeout: 4_000 }
		);
		await page.keyboard.press(key);
		const tuned = await page
			.waitForFunction(
				(id) =>
					(window as ColonyWindow).__badger
						.getDubColonyObjectives()
						.reactorNodes.find((entry) => entry.id === id)?.tuned,
				node.id,
				{ timeout: 450 }
			)
			.then(() => true)
			.catch(() => false);
		if (tuned) return;
	}
	throw new Error(`Could not tune reactor node ${node.id}`);
}

test.describe('Dub Colony story, companion, and beat-timing vertical slice', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 5,
						blueprintShards: 3,
						dubFavor: 2,
						orbitHeat: 2,
						unlockedBoons: [],
						purchasedSkills: [],
					},
					storyProgress: {
						currentStageId: 'dub-colony',
						completedStageIds: [
							'lower-sprawl',
							'drainmarket',
							'chrome-arcology',
							'mirror-palace',
						],
						completedChapterIds: ['ch-01', 'ch-02', 'ch-03', 'ch-04'],
						acquiredPayloads: ['wafer_key', 'stim_cache', 'elevator_seed', 'mirror_pass'],
						resultFlags: [
							'wafer_key_acquired',
							'stim_cache_secured',
							'elevator_seed_taken',
							'lio_protected',
						],
						lioTrust: 'protected',
						campaignComplete: false,
					},
				})
			);
			const e2eWindow = window as ColonyWindow;
			e2eWindow.__colonyEvents = [];
			e2eWindow.__stageCompletions = [];
			window.addEventListener('badger:dub-colony-progress', (event) => {
				e2eWindow.__colonyEvents.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:stage-complete', (event) => {
				e2eWindow.__stageCompletions.push((event as CustomEvent).detail);
			});
		});
	});

	test('loads the authored colony, exposes the chorus timing window, and animates Naya sync', async ({
		page,
	}) => {
		await enterDubColony(page);
		await clearColonyEnemies(page);
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getCheckpoint().activeId))
			.toBe('greenhouse-car');
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getDubColonyObjectives()))
			.toMatchObject({
				stageId: 'dub-colony',
				alignment: 'chorus',
				bpm: 86,
				windowMs: 185,
			});

		const node = await page.evaluate(() =>
			(window as ColonyWindow).__badger
				.getDubColonyObjectives()
				.reactorNodes.find((entry) => entry.expectedAction === 'parry')
		);
		expect(node).toBeTruthy();
		await tuneNode(page, node!);
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getAnimation()))
			.toMatchObject({ currentAnim: 'parry', frames: 4 });
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getCompanions()))
			.toMatchObject({ active: expect.arrayContaining(['naya_root']) });
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getCompanions().nayaAssistTimer))
			.toBeGreaterThan(0);

		const spriteIds = await page.evaluate(() =>
			(window as ColonyWindow).__badger.getEnemies().map((enemy) => enemy.spriteSheetId)
		);
		expect(spriteIds).toContain('enemy_signal_jammer_bat');
		expect(spriteIds).toContain('enemy_feedback_guard');
	});

	test('restores the colony vote, synchronizes the reactor, defeats King Feedback, and reaches the Barrens', async ({
		page,
	}) => {
		await enterDubColony(page);
		await clearColonyEnemies(page);
		let objectives = await page.evaluate(
			() => (window as ColonyWindow).__badger.getDubColonyObjectives()
		);

		for (const part of objectives.spareParts) {
			await teleportTo(page, part.x, part.y);
			await page.keyboard.press('KeyM');
			await expect
				.poll(() =>
					page.evaluate(
						(id) =>
							(window as ColonyWindow).__badger
								.getDubColonyObjectives()
								.spareParts.find((entry) => entry.id === id)?.recovered,
						part.id
					)
				)
				.toBe(true);
		}
		for (const card of objectives.voteCards) {
			await teleportTo(page, card.x, card.y);
			await page.keyboard.press('KeyM');
			await expect
				.poll(() =>
					page.evaluate(
						(id) =>
							(window as ColonyWindow).__badger
								.getDubColonyObjectives()
								.voteCards.find((entry) => entry.id === id)?.recovered,
						card.id
					)
				)
				.toBe(true);
		}

		objectives = await page.evaluate(
			() => (window as ColonyWindow).__badger.getDubColonyObjectives()
		);
		for (const node of objectives.reactorNodes) await tuneNode(page, node);
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getDubColonyObjectives()))
			.toMatchObject({
				partsComplete: true,
				voteCardsComplete: true,
				reactorSynchronized: true,
				nayaTutorialComplete: true,
			});

		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getKingFeedback().attackCount))
			.toBeGreaterThan(0);
		await page.evaluate(() => (window as ColonyWindow).__badger.setBossHp(9));
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getBossPhase()?.phaseIndex))
			.toBe(1);
		await page.evaluate(() => (window as ColonyWindow).__badger.setBossHp(4));
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getBossPhase()?.phaseIndex))
			.toBe(2);
		await page.evaluate(() => (window as ColonyWindow).__badger.setBossHp(0));

		const payload = await page.evaluate(() =>
			(window as ColonyWindow).__badger
				.getPickups()
				.find((pickup) => pickup.itemId === 'bass_reactor_core')
		);
		expect(payload).toBeTruthy();
		await teleportTo(page, payload?.x ?? 2670, payload?.y ?? 374);
		await waitForScene(page, 'StoryFlowScene');
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getStoryState().mode))
			.toBe('debrief');
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getStoryPresentation()))
			.toMatchObject({ stageId: 'dub-colony', speaker: 'Auntie Subharmonic' });

		for (let safety = 0; safety < 6; safety += 1) {
			const stageId = await page.evaluate(
				() => (window as ColonyWindow).__badger.getStoryProgress().currentStageId
			);
			if (stageId === 'antenna-barrens') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(45);
		}
		await expect
			.poll(() => page.evaluate(() => (window as ColonyWindow).__badger.getStoryProgress()))
			.toMatchObject({
				currentStageId: 'antenna-barrens',
				colonyAlignment: 'chorus',
				completedStageIds: [
					'lower-sprawl',
					'drainmarket',
					'chrome-arcology',
					'mirror-palace',
					'dub-colony',
				],
			});
		await expect
			.poll(() =>
				page.evaluate(() => (window as ColonyWindow).__badger.getStoryProgress().acquiredPayloads)
			)
			.toContain('bass_reactor_core');
	});
});

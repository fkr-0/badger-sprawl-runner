import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';
import { deployStoryStageFromTitle } from './helpers/deploy-story-stage';

type Present<T> = Exclude<T, null>;

interface E2EBadgerHarness
	extends Omit<
		BadgerTestHarness,
		| 'getAnimation'
		| 'getCaptainGrin'
		| 'getCheckpoint'
		| 'getEnemies'
		| 'getLoadout'
		| 'getLowerSprawlHazards'
		| 'getLowerSprawlObjectives'
		| 'getPickups'
		| 'getSkillTree'
	> {
	getAnimation: () => Present<ReturnType<BadgerTestHarness['getAnimation']>>;
	getCaptainGrin: () => Present<ReturnType<BadgerTestHarness['getCaptainGrin']>>;
	getCheckpoint: () => Present<ReturnType<BadgerTestHarness['getCheckpoint']>>;
	getEnemies: () => Present<ReturnType<BadgerTestHarness['getEnemies']>>;
	getLoadout: () => Present<ReturnType<BadgerTestHarness['getLoadout']>>;
	getLowerSprawlHazards: () => Present<ReturnType<BadgerTestHarness['getLowerSprawlHazards']>>;
	getLowerSprawlObjectives: () => Present<
		ReturnType<BadgerTestHarness['getLowerSprawlObjectives']>
	>;
	getPickups: () => Present<ReturnType<BadgerTestHarness['getPickups']>>;
	getSkillTree: () => Present<ReturnType<BadgerTestHarness['getSkillTree']>>;
}

interface E2EWindow extends Window {
	__badger: E2EBadgerHarness;
	__lowerSprawlEvents: unknown[];
	__lowerSprawlEnemyEvents: Array<{
		kind: string;
		enemyId: string;
		attack: string;
		playerHp?: number;
	}>;
	__stageCompletions: unknown[];
	__autosaves: Array<{ reason: string }>;
	__skillPurchases: unknown[];
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as E2EWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 10_000 }
	);
}

async function enterLowerSprawl(page: Page): Promise<void> {
	await deployStoryStageFromTitle(page, 'lower-sprawl');

	for (let safety = 0; safety < 8; safety += 1) {
		const mode = await page.evaluate(() => (window as E2EWindow).__badger.getStoryState().mode);
		if (mode === 'stage') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(35);
	}
	await expect
		.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getStoryState().mode))
		.toBe('stage');

	await page.keyboard.press('2');
	await expect
		.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getStoryProgress().resultFlags))
		.toContain('wafer_broadcast');
	await page.keyboard.press('KeyR');
	await waitForScene(page, 'StageRunScene');
	await page.waitForFunction(() => (window as E2EWindow).__badger?.hasSheet('moss_badger'), null, {
		timeout: 10_000,
	});
}

async function teleportTo(page: Page, x: number, y: number): Promise<void> {
	await page.evaluate(
		([targetX, targetY]) =>
			(window as E2EWindow).__badger.teleportPlayer(targetX - 17, targetY - 23),
		[x, y]
	);
	await page.waitForTimeout(40);
}

test.describe('Lower Sprawl complete vertical slice', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			if (!sessionStorage.getItem('badger-e2e-initialized')) {
				localStorage.clear();
				sessionStorage.setItem('badger-e2e-initialized', 'true');
			}
			const e2eWindow = window as E2EWindow;
			e2eWindow.__lowerSprawlEvents = [];
			e2eWindow.__lowerSprawlEnemyEvents = [];
			e2eWindow.__stageCompletions = [];
			e2eWindow.__autosaves = [];
			e2eWindow.__skillPurchases = [];
			window.addEventListener('badger:lower-sprawl-progress', (event) => {
				e2eWindow.__lowerSprawlEvents.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:lower-sprawl-enemy', (event) => {
				const detail = (event as CustomEvent).detail as {
					kind: string;
					enemyId: string;
					attack: string;
				};
				e2eWindow.__lowerSprawlEnemyEvents.push({
					...detail,
					playerHp: e2eWindow.__badger?.getPlayer()?.hp,
				});
			});
			window.addEventListener('badger:stage-complete', (event) => {
				e2eWindow.__stageCompletions.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:autosave-feedback', (event) => {
				e2eWindow.__autosaves.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:skill-purchased', (event) => {
				e2eWindow.__skillPurchases.push((event as CustomEvent).detail);
			});
		});
	});

	test('drives idle, run, jump, and melee animations from gameplay state', async ({ page }) => {
		await enterLowerSprawl(page);
		await teleportTo(page, 100, 448);
		await page.waitForTimeout(350);
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getAnimation()?.currentAnim))
			.toBe('idle');

		await page.keyboard.down('ArrowRight');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getAnimation()?.currentAnim))
			.toBe('run');
		const observedRunFrames = await page.evaluate(
			() =>
				new Promise<number[]>((resolve) => {
					const frames = new Set<number>();
					const started = performance.now();
					const sample = (): void => {
						const animation = (window as E2EWindow).__badger.getAnimation();
						if (typeof animation?.frame === 'number') frames.add(animation.frame);
						if (performance.now() - started >= 350) resolve([...frames]);
						else requestAnimationFrame(sample);
					};
					requestAnimationFrame(sample);
				})
		);
		await page.keyboard.up('ArrowRight');
		expect(observedRunFrames.length).toBeGreaterThan(1);

		await page.keyboard.press('Space');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getAnimation()?.currentAnim))
			.toBe('jump_up');

		await teleportTo(page, 100, 448);
		await page.waitForTimeout(100);
		await page.keyboard.press('KeyJ');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getAnimation()?.currentAnim))
			.toBe('melee_claws');
	});

	test('keeps movement responsive and restores Moss at first-world checkpoints', async ({
		page,
	}) => {
		await enterLowerSprawl(page);
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getPlayer()?.objectiveHint))
			.toContain('Scan toll meters');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getCheckpoint().activeId))
			.toBe('sprawl-entry');

		await teleportTo(page, 100, 448);
		const beforeMove = await page.evaluate(
			() => (window as E2EWindow).__badger.getPlayer()?.x ?? 0
		);
		await page.keyboard.down('KeyD');
		await page.waitForTimeout(220);
		await page.keyboard.up('KeyD');
		const afterMove = await page.evaluate(() => (window as E2EWindow).__badger.getPlayer()?.x ?? 0);
		expect(afterMove).toBeGreaterThan(beforeMove + 12);

		await teleportTo(page, 850, 448);
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getCheckpoint().activeId))
			.toBe('market-relay');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getPlayer()?.checkpointLabel))
			.toBe('Market relay');

		await page.evaluate(() => (window as E2EWindow).__badger.setPlayerHp(0));
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getPlayer()))
			.toMatchObject({ hp: 5, x: 820, y: 448, checkpointLabel: 'Market relay' });
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getPlayer()?.hudToast))
			.toContain('Signal restored');
	});

	test('telegraphs first-world enemy attacks before applying damage', async ({ page }) => {
		await enterLowerSprawl(page);
		const patrol = await page.evaluate(() =>
			(window as E2EWindow).__badger.getEnemies().find((enemy) => enemy.role === 'patrol')
		);
		expect(patrol).toBeTruthy();
		await teleportTo(page, patrol.x - 90, patrol.y + 20);
		const hpBeforeTelegraph = await page.evaluate(
			() => (window as E2EWindow).__badger.getPlayer()?.hp
		);
		// Bounded perception requires admissible evidence. This swing is outside
		// claw range but produces the authored melee sound for the local patrol.
		await page.keyboard.press('KeyJ');
		await expect
			.poll(() =>
				page.evaluate((id) => {
					const enemy = (window as E2EWindow).__badger
						.getEnemies()
						.find((candidate) => candidate.id === id);
					return enemy?.awarenessState;
				}, patrol.id)
			)
			.not.toBe('routine');
		const alertedPatrol = await page.evaluate((id) =>
			(window as E2EWindow).__badger.getEnemies().find((enemy) => enemy.id === id)
		, patrol.id);
		await teleportTo(page, (alertedPatrol?.x ?? patrol.x) - 45, alertedPatrol?.y ?? patrol.y);

		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as E2EWindow).__lowerSprawlEnemyEvents.filter(
							(event) => event.enemyId === id
						).length,
					patrol.id
				)
			)
			.toBeGreaterThanOrEqual(2);
		const patrolEvents = await page.evaluate(
			(id) =>
				(window as E2EWindow).__lowerSprawlEnemyEvents.filter(
					(event) => event.enemyId === id
				),
			patrol.id
		);
		expect(patrolEvents.slice(0, 2).map((event) => event.kind)).toEqual([
			'enemy-telegraph',
			'enemy-attack',
		]);
		expect(patrolEvents[0]).toMatchObject({
			playerHp: hpBeforeTelegraph,
		});
		expect(patrolEvents[0]?.attack).toBeTruthy();
		expect(patrolEvents[1]?.attack).toBe(patrolEvents[0]?.attack);
	});

	test('runs production hazards, Captain Grin patterns, and the complete Burrowbreaker route', async ({
		page,
	}) => {
		await enterLowerSprawl(page);
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as E2EWindow).__badger.hasSheet('boss_boss_captain_grin_tollmech')
				)
			)
			.toBe(true);
		const captain = await page.evaluate(() =>
			(window as E2EWindow).__badger
				.getEnemies()
				.find((enemy) => enemy.bossId === 'tollbooth-captain-grin')
		);
		expect(captain).toBeTruthy();
		await teleportTo(page, (captain?.x ?? 1480) - 95, captain?.y ?? 418);

		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getCaptainGrin().attackCount))
			.toBeGreaterThan(0);
		const hazards = await page.evaluate(() =>
			(window as E2EWindow).__badger.getLowerSprawlHazards()
		);
		expect(hazards.map((hazard) => hazard.id)).toEqual(['west-steam-vent', 'market-steam-vent']);
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as E2EWindow).__badger
						.getLowerSprawlHazards()
						.some((hazard) => hazard.state !== 'idle')
				)
			)
			.toBe(true);

		const pickupIds = ['rocket_backpack', 'bassline_boots_route', 'gravity_talisman_route'];
		for (const pickupId of pickupIds) {
			const pickup = await page.evaluate(
				(id) => (window as E2EWindow).__badger.getPickups().find((entry) => entry.id === id),
				pickupId
			);
			expect(pickup).toBeTruthy();
			await teleportTo(page, pickup.x + 14, pickup.y + 14);
			await expect
				.poll(() =>
					page.evaluate(
						(id) => (window as E2EWindow).__badger.getLoadout().equippedItemIds.includes(id),
						pickupId === 'bassline_boots_route'
							? 'bassline_boots'
							: pickupId === 'gravity_talisman_route'
								? 'gravity_talisman'
								: pickupId
					)
				)
				.toBe(true);
		}

		const loadout = await page.evaluate(() => (window as E2EWindow).__badger.getLoadout());
		expect(loadout.activeBonuses).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ setId: 'burrowbreaker-rig', pieces: 2 }),
				expect.objectContaining({ setId: 'burrowbreaker-rig', pieces: 3 }),
			])
		);
		expect(loadout.effects).toMatchObject({
			landingShockwave: true,
			fuelRefundOnCombo: 1,
			maxFallSpeedBonus: 120,
		});
		expect(loadout.budget.valid).toBe(true);
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getPlayer()))
			.toMatchObject({
				hasRocket: true,
				maxFuel: 3,
				airControlMultiplier: 1.1,
				maxFallSpeedBonus: 120,
			});
	});

	test('completes every first-world objective, debrief, save checkpoint, and skill purchase', async ({
		page,
	}) => {
		await enterLowerSprawl(page);

		await page.keyboard.press('Space');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as E2EWindow).__badger.getLowerSprawlObjectives()?.tutorials.jumpCoyote
				)
			)
			.toBe(true);
		const initial = await page.evaluate(() =>
			(window as E2EWindow).__badger.getLowerSprawlObjectives()
		);

		for (const meter of initial.meters) {
			await teleportTo(page, meter.x, meter.y);
			await page.keyboard.press('KeyM');
			await expect
				.poll(() =>
					page.evaluate(
						(id) =>
							(window as E2EWindow).__badger
								.getLowerSprawlObjectives()
								?.meters.find((entry) => entry.id === id)?.scanned,
						meter.id
					)
				)
				.toBe(true);
		}
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as E2EWindow).__badger.getLowerSprawlObjectives()?.questComplete
				)
			)
			.toBe(true);
		await expect
			.poll(() =>
				page.evaluate(
					() =>
						(window as E2EWindow).__badger.getLowerSprawlObjectives()?.tutorials.publicRouteReading
				)
			)
			.toBe(true);

		const gate = await page.evaluate(
			() => (window as E2EWindow).__badger.getLowerSprawlObjectives().gate
		);
		await teleportTo(page, gate.x, gate.y);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as E2EWindow).__badger.getLowerSprawlObjectives()?.expectedInput
				)
			)
			.toBe('melee');
		await page.keyboard.press('KeyJ');
		await page.waitForTimeout(50);
		await page.keyboard.press('KeyL');
		await page.waitForTimeout(50);
		await page.keyboard.press('KeyK');
		await expect
			.poll(() =>
				page.evaluate(() => (window as E2EWindow).__badger.getLowerSprawlObjectives()?.puzzleStatus)
			)
			.toBe('solved');

		const boss = await page.evaluate(() =>
			(window as E2EWindow).__badger
				.getEnemies()
				.find((enemy) => enemy.bossId === 'tollbooth-captain-grin')
		);
		expect(boss).toBeTruthy();
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getBossPhase()))
			.toMatchObject({
				activePhaseId: 'receipt-wall',
				phaseIndex: 0,
				phaseCount: 2,
			});
		await page.evaluate((hp) => (window as E2EWindow).__badger.setBossHp(hp), boss.maxHp * 0.49);
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getBossPhase()))
			.toMatchObject({
				activePhaseId: 'compound-interest',
				phaseIndex: 1,
				phaseCount: 2,
			});
		await page.evaluate(() => (window as E2EWindow).__badger.setBossHp(1));
		const currentBoss = await page.evaluate(() =>
			(window as E2EWindow).__badger
				.getEnemies()
				.find((enemy) => enemy.bossId === 'tollbooth-captain-grin')
		);
		await page.evaluate(
			([x, y, w]) => {
				const harness = (window as E2EWindow).__badger;
				const facing = harness.getPlayer()?.dir ?? 1;
				harness.teleportPlayer(facing >= 0 ? x - 40 : x + w + 8, y);
			},
			[currentBoss.x, currentBoss.y, currentBoss.w]
		);
		await page.waitForTimeout(80);
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await page.keyboard.press('KeyJ');
			await expect
				.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getPlayer()?.meleeTimer ?? 0))
				.toBeGreaterThan(0);
			await page.waitForTimeout(120);
			const remainingHp = await page.evaluate(() => {
				const current = (window as E2EWindow).__badger
					.getEnemies()
					.find((enemy) => enemy.bossId === 'tollbooth-captain-grin');
				return current?.hp ?? 0;
			});
			if (remainingHp <= 0) break;
		}
		await expect
			.poll(() =>
				page.evaluate(() => {
					const current = (window as E2EWindow).__badger
						.getEnemies()
						.find((enemy) => enemy.bossId === 'tollbooth-captain-grin');
					return current?.hp ?? 0;
				})
			)
			.toBeLessThanOrEqual(0);

		const payload = await page.evaluate(() =>
			(window as E2EWindow).__badger.getPickups().find((pickup) => pickup.kind === 'story_payload')
		);
		await teleportTo(page, payload.x + 14, payload.y + 14);
		await waitForScene(page, 'StoryFlowScene');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getStoryState().mode))
			.toBe('debrief');

		const completion = await page.evaluate(() => (window as E2EWindow).__stageCompletions.at(-1));
		expect(completion).toMatchObject({
			stageId: 'lower-sprawl',
			completedQuestIds: ['meter-maidens-ledger'],
			completedMinigameIds: ['toll-gate-rhythm'],
			completedTutorialIds: ['jump-coyote', 'public-route-reading'],
		});
		expect(completion).toMatchObject({
			buildTelemetry: {
				stageId: 'lower-sprawl',
				replayTimeline: expect.arrayContaining([
					expect.objectContaining({ kind: 'run-start', sequence: 0 }),
					expect.objectContaining({ kind: 'expedition-settled' }),
					expect.objectContaining({ kind: 'build-locked' }),
				]),
			},
			expeditionCommit: {
				stageId: 'lower-sprawl',
				runId: expect.stringContaining('run:lower-sprawl:'),
				inventory: expect.any(Array),
			},
			resolutionApproaches: expect.arrayContaining(['ballistics', 'claw', 'hacking']),
			rewardDrops: expect.any(Array),
		});

		const progress = await page.evaluate(() => (window as E2EWindow).__badger.getStoryProgress());
		expect(progress.completedStageIds).toContain('lower-sprawl');
		expect(progress.acquiredPayloads).toContain('wafer_key');
		expect(progress.resultFlags).toEqual(
			expect.arrayContaining([
				'wafer_broadcast',
				'quest_meter_maidens_ledger',
				'puzzle_toll_gate_rhythm',
				'tutorial_jump_coyote',
				'tutorial_public_route_reading',
			])
		);
		const earnedMeta = await page.evaluate(() => (window as E2EWindow).__badger.getMeta());
		expect(earnedMeta).toMatchObject({
			credchips: 25,
			blueprintShards: 1,
			dubFavor: 3,
			orbitHeat: 1,
		});

		while (
			(await page.evaluate(() => (window as E2EWindow).__badger.getStoryState().mode)) === 'debrief'
		) {
			await page.keyboard.press('Enter');
			await page.waitForTimeout(40);
		}
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getStoryState()))
			.toMatchObject({
				mode: 'title-card',
				stageId: 'drainmarket',
			});

		await page.keyboard.press('Escape');
		await waitForScene(page, 'TitleScene');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await waitForScene(page, 'SkillTreeScene');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getSkillTree()))
			.toMatchObject({
				selectedSkillId: 'double_swipe',
				blueprintShards: 1,
				purchasedSkills: [],
				skills: expect.arrayContaining([
					expect.objectContaining({ id: 'double_swipe', cost: 1, prereqs: [] }),
					expect.objectContaining({ id: 'parry_tooth', cost: 2, prereqs: ['double_swipe'] }),
				]),
			});
		await page.keyboard.press('Enter');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getSkillTree()))
			.toMatchObject({
				blueprintShards: 0,
				purchasedSkills: ['double_swipe'],
				message: 'Double Swipe unlocked',
			});

		const autosaveReasons = await page.evaluate(() =>
			(window as E2EWindow).__autosaves.map((entry) => entry.reason)
		);
		expect(autosaveReasons).toEqual(
			expect.arrayContaining(['branch-choice', 'stage-complete', 'skill-purchase'])
		);

		await page.reload();
		await waitForScene(page, 'TitleScene');
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getMeta()))
			.toMatchObject({
				blueprintShards: 0,
				purchasedSkills: ['double_swipe'],
			});
		await expect
			.poll(() => page.evaluate(() => (window as E2EWindow).__badger.getStoryProgress()))
			.toMatchObject({
				currentStageId: 'drainmarket',
				completedStageIds: ['lower-sprawl'],
				acquiredPayloads: ['wafer_key'],
			});
	});
});

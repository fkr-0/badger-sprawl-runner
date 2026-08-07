import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';
import {
	deployStoryStageFromMap,
	deployStoryStageFromTitle,
} from './helpers/deploy-story-stage';

interface LateCampaignWindow extends Window {
	__badger: BadgerTestHarness;
	__lateStageEvents: unknown[];
	__stageCompletions: unknown[];
	__endingCards: unknown[];
	__lateStageDrawnText: string[];
}

interface LateStageCase {
	stageId: 'antenna-barrens' | 'orbital-lift' | 'asteroid-redoubt';
	chapter: number;
	choiceKey: 'Digit1' | 'Digit2' | 'Digit3';
	choiceFlag: string;
	payloadId: string;
	questFlag: string;
	minigameFlag: string;
	tutorialFlag: string;
	bossId: string;
	bossSheetId: string;
	enemySheetId: string;
	parallaxSheetId: string;
	phaseCount: number;
	nextStageId?: string;
}

const LATE_STAGES: readonly LateStageCase[] = [
	{
		stageId: 'antenna-barrens',
		chapter: 6,
		choiceKey: 'Digit1',
		choiceFlag: 'ledger_public_dump',
		payloadId: 'debt_ledger_shard',
		questFlag: 'quest_pirate_signal_cache',
		minigameFlag: 'puzzle_ledger_codegate_surge',
		tutorialFlag: 'tutorial_rook_overlay_reading',
		bossId: 'black-ice-fox',
		bossSheetId: 'boss_boss_black_ice_fox_node',
		enemySheetId: 'enemy_error_mite',
		parallaxSheetId: 'antenna_barrens_parallax',
		phaseCount: 3,
		nextStageId: 'orbital-lift',
	},
	{
		stageId: 'orbital-lift',
		chapter: 7,
		choiceKey: 'Digit2',
		choiceFlag: 'cargo_full_release',
		payloadId: 'cargo_reversal_key',
		questFlag: 'quest_cargo_reversal_witnesses',
		minigameFlag: 'puzzle_cargo_claim_routing',
		tutorialFlag: 'tutorial_cargo_route_reading',
		bossId: 'elevator-angel',
		bossSheetId: 'boss_boss_elevator_angel_counterweight',
		enemySheetId: 'enemy_customs_lancer',
		parallaxSheetId: 'orbital_lift_parallax',
		phaseCount: 3,
		nextStageId: 'asteroid-redoubt',
	},
	{
		stageId: 'asteroid-redoubt',
		chapter: 8,
		choiceKey: 'Digit3',
		choiceFlag: 'broadcast_publish_tools',
		payloadId: 'asteroid_transmitter_root',
		questFlag: 'quest_tools_not_heroes',
		minigameFlag: 'puzzle_public_toolkit_broadcast',
		tutorialFlag: 'tutorial_public_broadcast_tools',
		bossId: 'director-vane',
		bossSheetId: 'boss_boss_director_vane_skylock',
		enemySheetId: 'enemy_command_lock_partisan',
		parallaxSheetId: 'asteroid_redoubt_parallax',
		phaseCount: 4,
	},
];

const SELECTION_SOLUTIONS: Readonly<Record<string, readonly number[]>> = {
	'cargo-lock-intake': [1, 2, 1],
	'cargo-lock-counterweight': [2, 1, 0],
	'cargo-lock-orbit': [1, 0, 2],
	'transmitter-root-listen': [0, 2, 1],
	'transmitter-root-teach': [1, 0, 2],
	'transmitter-root-release': [2, 1, 0],
};

async function waitForScene(page: Page, sceneName: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as LateCampaignWindow).__badger?.getSceneName() === expected,
		sceneName,
		{ timeout: 10_000 }
	);
}

async function advanceStory(page: Page): Promise<void> {
	const before = await page.evaluate(() =>
		JSON.stringify((window as LateCampaignWindow).__badger.getStoryState())
	);
	await page.keyboard.press('Enter');
	await expect
		.poll(() =>
			page.evaluate(
				(previous) =>
					JSON.stringify((window as LateCampaignWindow).__badger.getStoryState()) !== previous,
				before
			)
		)
		.toBe(true);
}

async function launchStage(page: Page, stage: LateStageCase): Promise<void> {
	const sceneName = await page.evaluate(
		() => (window as LateCampaignWindow).__badger.getSceneName()
	);
	if (sceneName === 'SubwayMapScene') {
		await deployStoryStageFromMap(page, stage.stageId);
	}
	await expect
		.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getStoryPresentation()))
		.toMatchObject({ mode: 'title-card', stageId: stage.stageId, chapter: stage.chapter });
	for (let safety = 0; safety < 8; safety += 1) {
		const mode = await page.evaluate(
			() => (window as LateCampaignWindow).__badger.getStoryState().mode
		);
		if (mode === 'stage') break;
		await advanceStory(page);
	}
	await expect
		.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getStoryState().mode))
		.toBe('stage');
	await page.keyboard.press(stage.choiceKey);
	await expect
		.poll(() =>
			page.evaluate((flag) =>
				(window as LateCampaignWindow).__badger.getStoryProgress().resultFlags.includes(flag)
			, stage.choiceFlag)
		)
		.toBe(true);
	await page.keyboard.press('KeyR');
	await waitForScene(page, 'StageRunScene');
	await page.waitForFunction(
		([parallax, enemy, boss]) => {
			const harness = (window as LateCampaignWindow).__badger;
			return harness.hasSheet(parallax) && harness.hasSheet(enemy) && harness.hasSheet(boss);
		},
		[stage.parallaxSheetId, stage.enemySheetId, stage.bossSheetId]
	);
	await expect
		.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getLateStageObjectives()))
		.toMatchObject({ stageId: stage.stageId, primaryComplete: false, supportComplete: false });
}

async function clearNonBossEnemies(page: Page): Promise<void> {
	const ids = await page.evaluate(() =>
		((window as LateCampaignWindow).__badger.getEnemies() ?? [])
			.filter((enemy) => !enemy.bossId && enemy.id)
			.map((enemy) => enemy.id as string)
	);
	for (const id of ids) {
		await page.evaluate((enemyId) => (window as LateCampaignWindow).__badger.setEnemyHp(enemyId, 0), id);
	}
}

async function completeNode(
	page: Page,
	group: 'primaryNodes' | 'supportNodes',
	node: { id: string; x: number; y: number }
): Promise<void> {
	await page.evaluate(
		([x, y]) => (window as LateCampaignWindow).__badger.teleportPlayer(x - 17, y - 23),
		[node.x, node.y]
	);
	await page.waitForTimeout(45);
	await page.keyboard.press('KeyM');
	if (group === 'primaryNodes') {
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
				)
			)
			.toMatchObject({ status: 'active', nodeId: node.id });
		const interfaceState = await page.evaluate(
			() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
		);
		if (!interfaceState || interfaceState.status !== 'active') {
			throw new Error(`Late-stage interface did not open for ${node.id}`);
		}
		await expect
			.poll(() =>
				page.evaluate(
					(title) => (window as LateCampaignWindow).__lateStageDrawnText.includes(title),
					interfaceState.title
				)
			)
			.toBe(true);
		if (interfaceState.kind === 'fasttype') {
			await expect
				.poll(() =>
					page.evaluate(() =>
						(window as LateCampaignWindow).__lateStageDrawnText.includes('LIVE CARRIER INPUT')
					)
				)
				.toBe(true);
			await page.keyboard.type(interfaceState.target);
			await expect
				.poll(() =>
					page.evaluate(
						() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
					)
				)
				.toMatchObject({ input: interfaceState.target });
		} else {
			const previewLabel =
				interfaceState.kind === 'cargo-routing' ? 'ROUTE PREVIEW' : 'ON-AIR SENTENCE PREVIEW';
			await expect
				.poll(() =>
					page.evaluate(
						(label) => (window as LateCampaignWindow).__lateStageDrawnText.includes(label),
						previewLabel
					)
				)
				.toBe(true);
			const solution = SELECTION_SOLUTIONS[interfaceState.nodeId];
			if (!solution) throw new Error(`Missing E2E solution for ${interfaceState.nodeId}`);
			for (let columnIndex = 0; columnIndex < interfaceState.columns.length; columnIndex += 1) {
				const solutionIndex = solution[columnIndex] ?? 0;
				await page.keyboard.press(`Digit${solutionIndex + 1}`);
				if (columnIndex < interfaceState.columns.length - 1) {
					await page.keyboard.press('ArrowRight');
				}
			}
			await expect
				.poll(() =>
					page.evaluate(
						() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
					)
				)
				.toMatchObject({ focusIndex: interfaceState.columns.length - 1 });
		}
		await page.keyboard.press('Enter');
	}
	await expect
		.poll(() =>
			page.evaluate(
				([kind, id]) =>
					(window as LateCampaignWindow).__badger
						.getLateStageObjectives()
						?.[kind as 'primaryNodes' | 'supportNodes'].find((entry) => entry.id === id)
						?.completed,
				[group, node.id]
			)
		)
		.toBe(true);
	if (group === 'primaryNodes') {
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as LateCampaignWindow).__badger
							.getLateStageObjectives()
							?.primaryNodes.find((entry) => entry.id === id)?.grade,
					node.id
				)
			)
			.toBe('clean');
	}
}

async function completeObjectives(page: Page): Promise<void> {
	const snapshot = await page.evaluate(() =>
		(window as LateCampaignWindow).__badger.getLateStageObjectives()
	);
	if (!snapshot) throw new Error('Late-stage objective snapshot was not installed');
	for (const node of snapshot.primaryNodes) await completeNode(page, 'primaryNodes', node);
	for (const node of snapshot.supportNodes) await completeNode(page, 'supportNodes', node);
	await expect
		.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getLateStageObjectives()))
		.toMatchObject({ primaryComplete: true, supportComplete: true, tutorialComplete: true });
}

async function traverseBoss(page: Page, stage: LateStageCase): Promise<void> {
	const boss = await page.evaluate((bossId) =>
		((window as LateCampaignWindow).__badger.getEnemies() ?? []).find(
			(enemy) => enemy.bossId === bossId
		)
	, stage.bossId);
	expect(boss).toBeTruthy();
	expect(boss?.bossSpriteSheetId).toBe(stage.bossSheetId);
	await expect
		.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getBossPhase()))
		.toMatchObject({ phaseIndex: 0, phaseCount: stage.phaseCount });
	for (let phase = 1; phase < stage.phaseCount; phase += 1) {
		const hp = (boss?.maxHp ?? 10) * (1 - (phase + 0.2) / stage.phaseCount);
		await page.evaluate((value) => (window as LateCampaignWindow).__badger.setBossHp(value), hp);
		await expect
			.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getBossPhase()?.phaseIndex))
			.toBe(phase);
	}
	await page.evaluate(() => (window as LateCampaignWindow).__badger.setBossHp(0));
	await expect
		.poll(() =>
			page.evaluate((bossId) =>
				((window as LateCampaignWindow).__badger.getEnemies() ?? []).find(
					(enemy) => enemy.bossId === bossId
				)?.hp
			, stage.bossId)
		)
		.toBe(0);
}

async function collectPayload(page: Page, stage: LateStageCase): Promise<void> {
	const payload = await page.evaluate((payloadId) =>
		((window as LateCampaignWindow).__badger.getPickups() ?? []).find(
			(pickup) => pickup.itemId === payloadId
		)
	, stage.payloadId);
	expect(payload).toBeTruthy();
	await page.evaluate(
		([x, y]) => (window as LateCampaignWindow).__badger.teleportPlayer(x - 3, y - 9),
		[payload?.x ?? 0, payload?.y ?? 0]
	);
	await waitForScene(page, 'StoryFlowScene');
	await expect
		.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getStoryState().mode))
		.toBe('debrief');
	await expect
		.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getStoryProgress()))
		.toMatchObject({
			completedStageIds: expect.arrayContaining([stage.stageId]),
			acquiredPayloads: expect.arrayContaining([stage.payloadId]),
			resultFlags: expect.arrayContaining([
				stage.choiceFlag,
				stage.questFlag,
				stage.minigameFlag,
				stage.tutorialFlag,
			]),
		});
}

async function finishDebrief(page: Page, stage: LateStageCase): Promise<void> {
	for (let safety = 0; safety < 8; safety += 1) {
		const scene = await page.evaluate(() => (window as LateCampaignWindow).__badger.getSceneName());
		const state = await page.evaluate(() => (window as LateCampaignWindow).__badger.getStoryState());
		if (stage.nextStageId && state.mode === 'title-card') return;
		if (!stage.nextStageId && scene === 'TitleScene') return;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(45);
	}
	throw new Error(`Could not leave ${stage.stageId} debrief`);
}

test.describe('late campaign Chapter 6–8 vertical slice', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 40,
						blueprintShards: 8,
						dubFavor: 3,
						orbitHeat: 2,
						unlockedBoons: [],
						purchasedSkills: [],
					},
					storyProgress: {
						currentStageId: 'antenna-barrens',
						completedStageIds: [
							'lower-sprawl',
							'drainmarket',
							'chrome-arcology',
							'mirror-palace',
							'dub-colony',
						],
						completedChapterIds: ['ch-01', 'ch-02', 'ch-03', 'ch-04', 'ch-05'],
						acquiredPayloads: [
							'wafer_key',
							'stim_cache',
							'elevator_seed',
							'mirror_pass',
							'bass_reactor_core',
						],
						resultFlags: [
							'wafer_broadcast',
							'stim_cache_secured',
							'elevator_seed_taken',
							'lio_protected',
							'colony_alignment_chorus',
						],
						lioTrust: 'protected',
						colonyAlignment: 'chorus',
						campaignComplete: false,
					},
				})
			);
			const runtime = window as LateCampaignWindow;
			runtime.__lateStageEvents = [];
			runtime.__stageCompletions = [];
			runtime.__endingCards = [];
			runtime.__lateStageDrawnText = [];
			const originalFillText = CanvasRenderingContext2D.prototype.fillText;
			CanvasRenderingContext2D.prototype.fillText = function patchedFillText(
				text: string,
				x: number,
				y: number,
				maxWidth?: number
			): void {
				runtime.__lateStageDrawnText.push(String(text));
				if (runtime.__lateStageDrawnText.length > 4000) {
					runtime.__lateStageDrawnText.splice(0, 2000);
				}
				if (maxWidth === undefined) originalFillText.call(this, text, x, y);
				else originalFillText.call(this, text, x, y, maxWidth);
			};
			window.addEventListener('badger:late-stage-progress', (event) => {
				runtime.__lateStageEvents.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:stage-complete', (event) => {
				runtime.__stageCompletions.push((event as CustomEvent).detail);
			});
			window.addEventListener('badger:ending-card', (event) => {
				runtime.__endingCards.push((event as CustomEvent).detail);
			});
		});
	});

	test('completes Antenna Barrens, Orbital Lift, and Asteroid Redoubt through the final ending card', async ({
		page,
	}) => {
		await deployStoryStageFromTitle(page, 'antenna-barrens');

		for (const stage of LATE_STAGES) {
			await launchStage(page, stage);
			expect(
				await page.evaluate(
					(sheetId) => (window as LateCampaignWindow).__badger.hasSheet(sheetId),
					stage.enemySheetId
				)
			).toBe(true);
			expect(
				await page.evaluate(() => ((window as LateCampaignWindow).__badger.getEnemies() ?? []).length)
			).toBeGreaterThan(0);
			await clearNonBossEnemies(page);
			await completeObjectives(page);
			await traverseBoss(page, stage);
			await collectPayload(page, stage);
			await finishDebrief(page, stage);
			if (stage.nextStageId) {
				await expect
					.poll(() =>
						page.evaluate(
							() => (window as LateCampaignWindow).__badger.getStoryProgress().currentStageId
						)
					)
					.toBe(stage.nextStageId);
			}
		}

		await waitForScene(page, 'TitleScene');
		await expect
			.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getStoryProgress()))
			.toMatchObject({
				campaignComplete: true,
				finalBroadcastDoctrine: 'publish-tools',
				completedStageIds: expect.arrayContaining([
					'antenna-barrens',
					'orbital-lift',
					'asteroid-redoubt',
				]),
			});
		await expect
			.poll(() => page.evaluate(() => (window as LateCampaignWindow).__endingCards.at(-1)))
			.toMatchObject({
				doctrine: 'publish-tools',
				title: 'Publish the Tools',
				resultFlag: 'broadcast_publish_tools',
			});
		await expect
			.poll(() => page.evaluate(() => (window as LateCampaignWindow).__stageCompletions.length))
			.toBe(3);
		await expect
			.poll(() => page.evaluate(() => (window as LateCampaignWindow).__lateStageEvents.length))
			.toBeGreaterThanOrEqual(24);
		await expect
			.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getMeta()))
			.toMatchObject({ dubFavor: 8, orbitHeat: 6 });
	});

	test('preserves world state during consoles and offers a non-blocking assisted retry', async ({
		page,
	}) => {
		const stage = LATE_STAGES[0];
		if (!stage) throw new Error('Missing Antenna Barrens E2E stage');
		await deployStoryStageFromTitle(page, 'antenna-barrens');
		await launchStage(page, stage);
		await clearNonBossEnemies(page);

		const nodes = await page.evaluate(() =>
			(window as LateCampaignWindow).__badger.getLateStageObjectives()?.primaryNodes ?? []
		);
		const first = nodes[0];
		const second = nodes[1];
		if (!first || !second) throw new Error('Missing Antenna Barrens objective nodes');
		await page.evaluate(
			([x, y]) => (window as LateCampaignWindow).__badger.teleportPlayer(x - 17, y - 23),
			[first.x, first.y]
		);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
				)
			)
			.toMatchObject({ status: 'active', kind: 'fasttype', nodeId: first.id });

		const playerBefore = await page.evaluate(() =>
			(window as LateCampaignWindow).__badger.getPlayer()
		);
		await page.waitForTimeout(450);
		const playerAfter = await page.evaluate(() =>
			(window as LateCampaignWindow).__badger.getPlayer()
		);
		expect(playerAfter).toMatchObject({
			x: playerBefore?.x,
			y: playerBefore?.y,
			vx: 0,
			vy: 0,
		});
		expect(
			await page.evaluate(() =>
				Object.hasOwn(
					(window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface ?? {},
					'solutionIndexes'
				)
			)
		).toBe(false);

		for (let attempt = 0; attempt < 3; attempt += 1) {
			await page.keyboard.type('x');
			await page.keyboard.press('Enter');
		}
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
				)
			)
			.toMatchObject({
				status: 'active',
				kind: 'fasttype',
				assistActive: true,
				attemptsLeft: 0,
				expectedChar: 'v',
			});
		const pausedTime = await page.evaluate(
			() =>
				(window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface.status ===
				'active'
					? (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface.timeRemaining
					: null
		);
		await page.waitForTimeout(450);
		await expect
			.poll(() =>
				page.evaluate(
					() =>
						(window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface.status ===
						'active'
							? (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
								.timeRemaining
							: null
				)
			)
			.toBe(pausedTime);
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as LateCampaignWindow).__lateStageDrawnText.includes(
						'PUBLIC ASSIST // TIMER PAUSED'
					)
				)
			)
			.toBe(true);

		const target = await page.evaluate(() => {
			const state = (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface;
			return state?.status === 'active' && state.kind === 'fasttype' ? state.target : '';
		});
		await page.keyboard.type(target);
		await page.keyboard.press('Enter');
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as LateCampaignWindow).__badger
							.getLateStageObjectives()
							?.primaryNodes.find((entry) => entry.id === id),
					first.id
				)
			)
			.toMatchObject({ completed: true, grade: 'assisted' });

		await page.evaluate(
			([x, y]) => (window as LateCampaignWindow).__badger.teleportPlayer(x - 17, y - 23),
			[second.x, second.y]
		);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
				)
			)
			.toMatchObject({ status: 'active', nodeId: second.id });
		await page.keyboard.press('Escape');
		await expect
			.poll(() => page.evaluate(() => (window as LateCampaignWindow).__badger.getSceneName()))
			.toBe('StageRunScene');
		await expect
			.poll(() =>
				page.evaluate(
					() => (window as LateCampaignWindow).__badger.getLateStageObjectives()?.interface
				)
			)
			.toEqual({ status: 'idle', kind: null });
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as LateCampaignWindow).__badger
							.getLateStageObjectives()
							?.primaryNodes.find((entry) => entry.id === id)?.completed,
					second.id
				)
			)
			.toBe(false);
	});
});

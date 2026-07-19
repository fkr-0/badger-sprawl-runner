import { type Page, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface SpriteRuntimeWindow extends Window {
	__badger: BadgerTestHarness;
	__drawnSpriteSources: string[];
}

interface StageTileCase extends StoryStageSeed {
	tileSheetId: string;
	tileFile: string;
}

const LOWER_SPRAWL_SEED: StoryStageSeed = {
	stageId: 'lower-sprawl',
	completedStageIds: [],
	completedChapterIds: [],
	acquiredPayloads: [],
};

const DRAINMARKET_SEED: StoryStageSeed = {
	stageId: 'drainmarket',
	completedStageIds: ['lower-sprawl'],
	completedChapterIds: ['ch-01'],
	acquiredPayloads: ['wafer_key'],
};

interface StoryStageSeed {
	stageId: string;
	completedStageIds: string[];
	completedChapterIds: string[];
	acquiredPayloads: string[];
}

interface LateStageCase extends StoryStageSeed {
	enemySheetId: string;
	enemyFile: string;
	bossSheetId: string;
	bossFile: string;
	choiceFigureFile?: string;
}

const CASES: LateStageCase[] = [
	{
		stageId: 'antenna-barrens',
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
		enemySheetId: 'enemy_error_mite',
		enemyFile: 'error_mite.png',
		bossSheetId: 'boss_boss_black_ice_fox_node',
		bossFile: 'boss_black_ice_fox_node.png',
	},
	{
		stageId: 'orbital-lift',
		completedStageIds: [
			'lower-sprawl',
			'drainmarket',
			'chrome-arcology',
			'mirror-palace',
			'dub-colony',
			'antenna-barrens',
		],
		completedChapterIds: ['ch-01', 'ch-02', 'ch-03', 'ch-04', 'ch-05', 'ch-06'],
		acquiredPayloads: [
			'wafer_key',
			'stim_cache',
			'elevator_seed',
			'mirror_pass',
			'bass_reactor_core',
			'debt_ledger_shard',
		],
		enemySheetId: 'enemy_customs_lancer',
		enemyFile: 'customs_lancer.png',
		bossSheetId: 'boss_boss_elevator_angel_counterweight',
		bossFile: 'boss_elevator_angel_counterweight.png',
	},
	{
		stageId: 'asteroid-redoubt',
		completedStageIds: [
			'lower-sprawl',
			'drainmarket',
			'chrome-arcology',
			'mirror-palace',
			'dub-colony',
			'antenna-barrens',
			'orbital-lift',
		],
		completedChapterIds: ['ch-01', 'ch-02', 'ch-03', 'ch-04', 'ch-05', 'ch-06', 'ch-07'],
		acquiredPayloads: [
			'wafer_key',
			'stim_cache',
			'elevator_seed',
			'mirror_pass',
			'bass_reactor_core',
			'debt_ledger_shard',
			'cargo_reversal_key',
		],
		enemySheetId: 'enemy_command_lock_partisan',
		enemyFile: 'command_lock_partisan.png',
		bossSheetId: 'boss_boss_director_vane_skylock',
		bossFile: 'boss_director_vane_skylock.png',
		choiceFigureFile: 'command_lock_faction.png',
	},
];

const TILE_CASES: StageTileCase[] = [
	{
		...LOWER_SPRAWL_SEED,
		tileSheetId: 'lower_sprawl_tiles',
		tileFile: 'lower_sprawl_tiles.png',
	},
	{
		...DRAINMARKET_SEED,
		tileSheetId: 'drainmarket_tiles',
		tileFile: 'drainmarket_tiles.png',
	},
	{
		stageId: 'chrome-arcology',
		completedStageIds: ['lower-sprawl', 'drainmarket'],
		completedChapterIds: ['ch-01', 'ch-02'],
		acquiredPayloads: ['wafer_key', 'stim_cache'],
		tileSheetId: 'chrome_arcology_tiles',
		tileFile: 'chrome_arcology_tiles.png',
	},
	{
		stageId: 'dub-colony',
		completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace'],
		completedChapterIds: ['ch-01', 'ch-02', 'ch-03', 'ch-04'],
		acquiredPayloads: ['wafer_key', 'stim_cache', 'elevator_seed', 'mirror_pass'],
		tileSheetId: 'dub_colony_tiles',
		tileFile: 'dub_colony_tiles.png',
	},
	{
		stageId: 'orbital-lift',
		completedStageIds: [
			'lower-sprawl',
			'drainmarket',
			'chrome-arcology',
			'mirror-palace',
			'dub-colony',
			'antenna-barrens',
		],
		completedChapterIds: ['ch-01', 'ch-02', 'ch-03', 'ch-04', 'ch-05', 'ch-06'],
		acquiredPayloads: [
			'wafer_key',
			'stim_cache',
			'elevator_seed',
			'mirror_pass',
			'bass_reactor_core',
			'debt_ledger_shard',
		],
		tileSheetId: 'orbital_lift_tiles',
		tileFile: 'orbital_lift_tiles.png',
	},
];

async function installSaveAndDrawProbe(page: Page, stage: StoryStageSeed): Promise<void> {
	await page.addInitScript((input) => {
		localStorage.setItem(
			'badger-sprawl-runner.save.v1',
			JSON.stringify({
				version: 1,
				meta: {
					credchips: 0,
					blueprintShards: 0,
					dubFavor: 0,
					orbitHeat: 0,
					unlockedBoons: [],
					purchasedSkills: [],
				},
				storyProgress: {
					currentStageId: input.stageId,
					completedStageIds: input.completedStageIds,
					completedChapterIds: input.completedChapterIds,
					acquiredPayloads: input.acquiredPayloads,
					resultFlags: [],
					campaignComplete: false,
				},
			})
		);
		const runtimeWindow = window as SpriteRuntimeWindow;
		runtimeWindow.__drawnSpriteSources = [];
		const original = CanvasRenderingContext2D.prototype.drawImage;
		CanvasRenderingContext2D.prototype.drawImage = function (...args: Parameters<typeof original>) {
			const source = args[0] as CanvasImageSource & { src?: string; currentSrc?: string };
			const value = source.currentSrc || source.src;
			if (value) runtimeWindow.__drawnSpriteSources.push(value);
			return original.apply(this, args);
		};
	}, stage);
}

async function enterStoryStage(
	page: Page,
	stage: StoryStageSeed & { choiceFigureFile?: string }
): Promise<void> {
	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as Partial<SpriteRuntimeWindow>).__badger));
	await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.routeMode('story'));
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getSceneName()))
		.toBe('StoryFlowScene');
	for (let safety = 0; safety < 12; safety += 1) {
		const mode = await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getStoryState().mode);
		if (mode === 'stage') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(35);
	}
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getStoryState().mode))
		.toBe('stage');
	if (stage.choiceFigureFile) {
		await expect
			.poll(() =>
				page.evaluate((file) =>
					(window as SpriteRuntimeWindow).__drawnSpriteSources.some((source) => source.includes(file))
				, stage.choiceFigureFile)
			)
			.toBe(true);
	}
	await page.keyboard.press('Digit1');
	await page.keyboard.press('KeyR');
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getSceneName()))
		.toBe('StageRunScene');
}

for (const stage of TILE_CASES) {
	test(`${stage.stageId} draws its mapped terrain atlas`, async ({ page }) => {
		await installSaveAndDrawProbe(page, stage);
		await enterStoryStage(page, stage);
		await page.waitForFunction(
			(sheetId) => (window as SpriteRuntimeWindow).__badger.hasSheet(sheetId),
			stage.tileSheetId
		);
		await expect
			.poll(() =>
				page.evaluate(
					(file) =>
						(window as SpriteRuntimeWindow).__drawnSpriteSources.some((source) =>
							source.includes(file)
						),
					stage.tileFile
				)
			)
			.toBe(true);
	});
}

test('training combat draws the imported combat VFX atlas', async ({ page }) => {
	await page.addInitScript(() => {
		const runtimeWindow = window as SpriteRuntimeWindow;
		runtimeWindow.__drawnSpriteSources = [];
		const original = CanvasRenderingContext2D.prototype.drawImage;
		CanvasRenderingContext2D.prototype.drawImage = function (...args: Parameters<typeof original>) {
			const source = args[0] as CanvasImageSource & { src?: string; currentSrc?: string };
			const value = source.currentSrc || source.src;
			if (value) runtimeWindow.__drawnSpriteSources.push(value);
			return original.apply(this, args);
		};
	});
	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as Partial<SpriteRuntimeWindow>).__badger));
	await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.routeMode('training'));
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getTraining()))
		.not.toBeNull();
	await page.waitForFunction(() => (window as SpriteRuntimeWindow).__badger.hasSheet('vfx_combat'));
	const training = await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getTraining());
	expect(training).toBeTruthy();
	await page.evaluate(
		([x, y]) => (window as SpriteRuntimeWindow).__badger.teleportPlayer(x - 38, y),
		[training?.dummy.x ?? 400, training?.dummy.y ?? 448]
	);
	await page.keyboard.press('KeyJ');
	await expect
		.poll(() =>
			page.evaluate(() =>
				(window as SpriteRuntimeWindow).__drawnSpriteSources.some((source) =>
					source.includes('vfx_combat.png')
				)
			)
		)
		.toBe(true);
});

test('lower sprawl draws mapped skyline and authored enemy sheets', async ({ page }) => {
	await installSaveAndDrawProbe(page, LOWER_SPRAWL_SEED);
	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as Partial<SpriteRuntimeWindow>).__badger));
	await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.routeMode('story'));
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getSceneName()))
		.toBe('StoryFlowScene');
	for (let safety = 0; safety < 12; safety += 1) {
		const mode = await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getStoryState().mode);
		if (mode === 'stage') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(35);
	}
	await page.keyboard.press('Digit1');
	await page.keyboard.press('KeyR');
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getSceneName()))
		.toBe('StageRunScene');

	for (const sheetId of ['lower_sprawl_tiles', 'enemy_turnstile_mite', 'enemy_rent_cop_piker']) {
		await page.waitForFunction(
			(id) => (window as SpriteRuntimeWindow).__badger.hasSheet(id),
			sheetId
		);
	}
	for (const filename of [
		'lower_sprawl_parallax.png',
		'lower_sprawl_tiles.png',
		'turnstile_mite.png',
		'rent_cop_piker.png',
	]) {
		await expect
			.poll(() =>
				page.evaluate((file) =>
					(window as SpriteRuntimeWindow).__drawnSpriteSources.some((source) => source.includes(file))
				, filename)
			)
			.toBe(true);
	}
});

test('drainmarket briefing draws the mapped DJ Calculus portrait', async ({ page }) => {
	await installSaveAndDrawProbe(page, DRAINMARKET_SEED);
	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as Partial<SpriteRuntimeWindow>).__badger));
	await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.routeMode('story'));
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getSceneName()))
		.toBe('StoryFlowScene');
	for (let safety = 0; safety < 6; safety += 1) {
		const presentation = await page.evaluate(() =>
			(window as SpriteRuntimeWindow).__badger.getStoryPresentation()
		);
		if (presentation?.speaker === 'DJ Calculus') break;
		await page.keyboard.press('Enter');
		await page.waitForTimeout(35);
	}
	await expect
		.poll(() => page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getStoryPresentation()?.speaker))
		.toBe('DJ Calculus');
	await expect
		.poll(() =>
			page.evaluate(() =>
				(window as SpriteRuntimeWindow).__drawnSpriteSources.some((source) =>
					source.includes('dj_calculus.png')
				)
			)
		)
		.toBe(true);
});

for (const stage of CASES) {
	test(`${stage.stageId} draws its authored late-story enemy and boss sheets`, async ({ page }) => {
		await installSaveAndDrawProbe(page, stage);
		await enterStoryStage(page, stage);
		await page.waitForFunction(
			([enemySheet, bossSheet]) => {
				const harness = (window as SpriteRuntimeWindow).__badger;
				return harness.hasSheet(enemySheet) && harness.hasSheet(bossSheet);
			},
			[stage.enemySheetId, stage.bossSheetId]
		);
		const enemies = await page.evaluate(() => (window as SpriteRuntimeWindow).__badger.getEnemies());
		expect(enemies?.some((enemy) => enemy.spriteSheetId === stage.enemySheetId)).toBe(true);
		expect(enemies?.some((enemy) => enemy.bossSpriteSheetId === stage.bossSheetId)).toBe(true);
		await expect
			.poll(() =>
				page.evaluate((file) =>
					(window as SpriteRuntimeWindow).__drawnSpriteSources.some((source) => source.includes(file))
				, stage.enemyFile)
			)
			.toBe(true);

		const boss = enemies?.find((enemy) => enemy.bossSpriteSheetId === stage.bossSheetId);
		expect(boss).toBeTruthy();
		await page.evaluate(
			([x, y]) => (window as SpriteRuntimeWindow).__badger.teleportPlayer(x - 120, y),
			[boss?.x ?? 1480, boss?.y ?? 418]
		);
		await expect
			.poll(() =>
				page.evaluate((file) =>
					(window as SpriteRuntimeWindow).__drawnSpriteSources.some((source) => source.includes(file))
				, stage.bossFile)
			)
			.toBe(true);
	});
}

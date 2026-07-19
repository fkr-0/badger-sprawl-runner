import { expect, test, type Page } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';
import { RUNTIME_STAGE_IDS } from '../../apps/runner/src/world/stageLayoutRegistry';

interface TrainingWindow extends Window {
	__badger: BadgerTestHarness;
}

async function enterTraining(page: Page): Promise<void> {
	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as TrainingWindow).__badger));
	await page.evaluate(() => (window as TrainingWindow).__badger.routeMode('training'));
	await expect
		.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getSceneName()))
		.toBe('TrainingScene');
	await expect
		.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()))
		.not.toBeNull();
}

async function trainingState(page: Page) {
	return page.evaluate(() => (window as TrainingWindow).__badger.getTraining());
}

test.describe('Dummy training release mode', () => {
	test.beforeEach(async ({ page }) => {
		await enterTraining(page);
	});

	test('runs real combat on a campaign stage with an invincible dummy and infinite practice resources', async ({
		page,
	}) => {
		const initial = await trainingState(page);
		expect(initial).not.toBeNull();
		expect(RUNTIME_STAGE_IDS).toContain(initial?.stageId);
		expect(initial).toMatchObject({
			lessonId: 'movement',
			dummyPresetId: 'idle',
			kitId: 'base',
			dummy: { hp: 'infinite' },
			player: { hp: 5, maxHp: 5, stims: 9 },
		});
		expect(await page.evaluate(() => (window as TrainingWindow).__badger.getEnemies()?.length)).toBe(1);

		await page.keyboard.press('KeyJ');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.metrics.hitCount))
			.toBeGreaterThan(0);
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.metrics.lastAction))
			.toBe('melee');

		await page.evaluate(() => (window as TrainingWindow).__badger.setEnemyHp('training-dummy', 0));
		await expect
			.poll(() =>
				page.evaluate(() => {
					const dummy = (window as TrainingWindow).__badger
						.getEnemies()
						?.find((enemy) => enemy.id === 'training-dummy');
					return dummy ? Number.isFinite(dummy.hp) : true;
				})
			)
			.toBe(false);

		await page.evaluate(() => (window as TrainingWindow).__badger.setPlayerHp(1));
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.player))
			.toMatchObject({ hp: 5, maxHp: 5, stims: 9 });

		await page.keyboard.press('Digit4');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()))
			.toMatchObject({
				kitId: 'full',
				player: { hasRailgun: true, hasRocket: true, fuel: 8, maxFuel: 8, stims: 9 },
			});
		await page.keyboard.press('KeyK');
		await expect
			.poll(() =>
				page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.metrics.railReloadDeltaMs)
			)
			.toBeGreaterThan(0);
	});

	test('changes lessons, dummy behavior, overlays, and resets from observable state', async ({ page }) => {
		await page.keyboard.press('KeyH');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.overlays))
			.toEqual({
				showHitboxes: false,
				showHurtboxes: false,
				showFrameData: false,
				showDamageNumbers: false,
			});

		await page.keyboard.press('F1');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.overlays))
			.toMatchObject({ showHitboxes: true, showHurtboxes: false });

		await page.keyboard.press('BracketRight');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.lessonId))
			.toBe('melee');

		for (let index = 0; index < 3; index += 1) await page.keyboard.press('Period');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.dummyPresetId))
			.toBe('attacking');
		await expect
			.poll(
				() =>
					page.evaluate(
						() => (window as TrainingWindow).__badger.getTraining()?.dummy.attackTelegraph ?? 0
					),
				{ timeout: 5_000 }
			)
			.toBeGreaterThan(0);

		await page.keyboard.press('KeyJ');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.metrics.hitCount))
			.toBeGreaterThan(0);
		await page.keyboard.press('KeyR');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()))
			.toMatchObject({
				metrics: { hitCount: 0, damageTotal: 0, comboDamage: 0 },
			});
		const reset = await trainingState(page);
		expect(reset?.player.x).toBeCloseTo((reset?.arena.left ?? 0) + 72, 3);
		expect(reset?.dummy.x).toBeCloseTo(reset?.dummy.spawnX ?? 0, 3);
	});

	test('rerolls to a different random stage, preserves training configuration, and never mutates story progress', async ({
		page,
	}) => {
		const progressBefore = await page.evaluate(() =>
			(window as TrainingWindow).__badger.getStoryProgress()
		);
		await page.keyboard.press('Digit4');
		await page.keyboard.press('BracketRight');
		await page.keyboard.press('Period');
		const before = await trainingState(page);
		expect(before).not.toBeNull();

		await page.keyboard.press('KeyN');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()?.stageId))
			.not.toBe(before?.stageId);
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getTraining()))
			.toMatchObject({ lessonId: 'melee', dummyPresetId: 'walking', kitId: 'full' });
		expect(await page.evaluate(() => (window as TrainingWindow).__badger.getStoryProgress())).toEqual(
			progressBefore
		);

		await page.keyboard.press('Escape');
		await expect
			.poll(() => page.evaluate(() => (window as TrainingWindow).__badger.getSceneName()))
			.toBe('TitleScene');
	});
});

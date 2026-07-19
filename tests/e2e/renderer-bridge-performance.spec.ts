import { expect, test, type Page } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface HarnessWindow extends Window {
	__badger: BadgerTestHarness;
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as HarnessWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 10_000 }
	);
}

async function enterEndlessStage(page: Page, mode: 'canvas' | 'bridge') {
	await page.goto(`/?debug=1&renderer=${mode}`);
	await waitForScene(page, 'TitleScene');
	await page.waitForFunction(
		(expectedMode) =>
			(window as Partial<HarnessWindow>).__badger?.getRendererMode() === expectedMode,
		mode,
		{ timeout: 15_000 }
	);
	for (let index = 0; index < 4; index += 1) await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await waitForScene(page, 'StageRunScene');
	await page.waitForFunction(
		() => ((window as Partial<HarnessWindow>).__badger?.getRendererPerformance().count ?? 0) >= 90,
		null,
		{ timeout: 15_000 }
	);
	const measurement = await page.evaluate(() => ({
		mode: (window as HarnessWindow).__badger.getRendererMode(),
		render: (window as HarnessWindow).__badger.getRendererPerformance(),
		bridge: (window as HarnessWindow).__badger.getBridgePerformance(),
	}));
	expect(measurement.mode).toBe(mode);
	if (mode === 'bridge') {
		await expect(page.locator('#badger-pixi-bridge')).toBeVisible();
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-arcade-passes',
			'stage-backdrop,parallax,terrain'
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-camera-contract',
			'arcade-v0.5'
		);
	}
	return measurement;
}

test('compares Canvas-only and opt-in bridge stage performance before defaulting', async ({ page }) => {
	const canvas = await enterEndlessStage(page, 'canvas');
	const bridge = await enterEndlessStage(page, 'bridge');

	expect(canvas.render.count).toBeGreaterThanOrEqual(90);
	expect(bridge.render.count).toBeGreaterThanOrEqual(90);
	expect(canvas.render.p95Ms).toBeGreaterThan(0);
	expect(bridge.render.p95Ms).toBeGreaterThan(0);
	const p95Ratio = bridge.render.p95Ms / canvas.render.p95Ms;
	expect(p95Ratio).toBeLessThan(20);
	expect(bridge.bridge?.count ?? 0).toBeGreaterThanOrEqual(90);

	console.info('Badger renderer performance', { canvas, bridge, p95Ratio });

	await page.goto('/?debug=1');
	await waitForScene(page, 'TitleScene');
	expect(await page.evaluate(() => (window as HarnessWindow).__badger.getRendererMode())).toBe(
		'canvas'
	);
});

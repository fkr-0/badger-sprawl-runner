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
		() => ((window as Partial<HarnessWindow>).__badger?.getRendererPerformance().count ?? 0) >= 15,
		null,
		{ timeout: 15_000 }
	);
	await page.evaluate(() => (window as HarnessWindow).__badger.resetRendererPerformance());
	await page.waitForFunction(
		() => ((window as Partial<HarnessWindow>).__badger?.getRendererPerformance().count ?? 0) >= 90,
		null,
		{ timeout: 30_000 }
	);
	if (mode === 'bridge') {
		const bridgeCanvas = page.locator('#badger-pixi-bridge');
		await expect(bridgeCanvas).not.toHaveAttribute('data-hardware-budget', 'warming', {
			timeout: 15_000,
		});
		const hardware = await bridgeCanvas.evaluate((canvas) => ({
			status: canvas.getAttribute('data-hardware-budget'),
			tier: canvas.getAttribute('data-hardware-tier'),
			samples: canvas.getAttribute('data-hardware-samples'),
			mean: canvas.getAttribute('data-hardware-frame-mean-ms'),
			p95: canvas.getAttribute('data-hardware-frame-p95-ms'),
			max: canvas.getAttribute('data-hardware-frame-max-ms'),
			violations: canvas.getAttribute('data-hardware-violations'),
		}));
		console.info('Badger hardware budget', hardware);
		expect(hardware).toMatchObject({ status: 'pass', violations: '' });
	}
	const measurement = await page.evaluate(() => ({
		mode: (window as HarnessWindow).__badger.getRendererMode(),
		render: (window as HarnessWindow).__badger.getRendererPerformance(),
		budget: (window as HarnessWindow).__badger.getRendererBudget(),
		bridge: (window as HarnessWindow).__badger.getBridgePerformance(),
		hardware: (window as HarnessWindow).__badger.getBridgeHardwareBudget(),
	}));
	expect(measurement.mode).toBe(mode);
	if (mode === 'bridge') {
		await expect(page.locator('#badger-pixi-bridge')).toBeVisible();
		await expect(page.locator('#badger-pixi-bridge')).not.toHaveAttribute(
			'data-arcade-passes',
			/.+/
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute('data-native-terrain', 'true');
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-camera-contract',
			'arcade-v0.5'
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute('data-native-vfx', 'true');
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-native-actors',
			'true'
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-native-projectiles',
			'true'
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-hardware-tier',
			/^(low|balanced|high)$/
		);
		expect(measurement.hardware).toMatchObject({ pass: true, tier: expect.any(String) });
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-native-parallax',
			'true'
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-parallax-mode',
			'stage-sheet'
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-parallax-texture-builds',
			'1'
		);
		await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
			'data-vfx-pool-dropped',
			'0'
		);
	}
	return measurement;
}

test('compares Canvas-only and opt-in bridge stage performance before defaulting', async ({ browser }) => {
	test.setTimeout(75_000);
	const baseURL = String(test.info().project.use.baseURL ?? 'http://localhost:5173');
	const measure = async (mode: 'canvas' | 'bridge') => {
		const context = await browser.newContext({ baseURL });
		const page = await context.newPage();
		try {
			return await enterEndlessStage(page, mode);
		} finally {
			await context.close();
		}
	};
	const canvas = await measure('canvas');
	const bridge = await measure('bridge');

	expect(canvas.render.count).toBeGreaterThanOrEqual(90);
	expect(bridge.render.count).toBeGreaterThanOrEqual(90);
	expect(canvas.render.p95Ms).toBeGreaterThan(0);
	expect(bridge.render.p95Ms).toBeGreaterThan(0);
	const p95Ratio = bridge.render.p95Ms / canvas.render.p95Ms;
	expect(p95Ratio).toBeLessThan(20);
	expect(bridge.bridge?.count ?? 0).toBeGreaterThanOrEqual(90);
	expect(canvas.budget).toMatchObject({ name: 'canvas:stage', pass: true });
	expect(bridge.budget).toMatchObject({ name: 'bridge:stage', pass: true });

	console.info('Badger renderer performance', { canvas, bridge, p95Ratio });

	const defaultContext = await browser.newContext({ baseURL });
	const defaultPage = await defaultContext.newPage();
	try {
		await defaultPage.goto('/?debug=1');
		await waitForScene(defaultPage, 'TitleScene');
		expect(
			await defaultPage.evaluate(() => (window as HarnessWindow).__badger.getRendererMode())
		).toBe('canvas');
	} finally {
		await defaultContext.close();
	}
});

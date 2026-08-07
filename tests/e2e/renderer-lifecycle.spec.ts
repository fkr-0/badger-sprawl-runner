import { expect, test, type Page } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';
import {
	beginCertifiedContextLoss,
	captureCertificationEnvironment,
	restoreCertifiedContext,
	writeCertificationEvidence,
} from './certification-evidence';

interface HarnessWindow extends Window {
	__badger: BadgerTestHarness;
}

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as HarnessWindow).__badger?.getSceneName() === expected,
		name
	);
}

async function enterStage(page: Page): Promise<void> {
	await page.goto('/?debug=1&renderer=bridge');
	await waitForScene(page, 'TitleScene');
	await page.waitForFunction(
		() => (window as HarnessWindow).__badger?.getRendererMode() === 'bridge'
	);
	await page.evaluate(() => (window as HarnessWindow).__badger.routeMode('endless'));
	await waitForScene(page, 'StageRunScene');
	await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute('data-native-terrain', 'true');
}

test('certifies resize, suspend/resume, context restoration, sustained memory and teardown', async ({
	page,
	browserName,
}) => {
	const sessionSeconds = Math.max(2, Number(process.env.ARCADE_LONG_SESSION_SECONDS ?? 5));
	test.setTimeout(sessionSeconds * 1_000 + 75_000);
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	await enterStage(page);
	const environment = await captureCertificationEnvironment(page, '#badger-pixi-bridge');

	await page.evaluate(() => (window as HarnessWindow).__badger.resizeBridge(800, 450));
	await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute(
		'data-arcade-logical-size',
		'800x450'
	);
	await page.evaluate(() => (window as HarnessWindow).__badger.startBridge());
	await page.waitForFunction(
		() => (window as HarnessWindow).__badger.getBridgeLifecycle()?.running === true
	);
	await page.evaluate(() => (window as HarnessWindow).__badger.pauseBridge());
	await page.waitForFunction(
		() => (window as HarnessWindow).__badger.getBridgeLifecycle()?.paused === true
	);
	await page.evaluate(() => (window as HarnessWindow).__badger.resumeBridge());
	await page.waitForFunction(
		() => (window as HarnessWindow).__badger.getBridgeLifecycle()?.running === true
	);

	const contextLossMode = await beginCertifiedContextLoss(page, '#badger-pixi-bridge');
	await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute('data-context-state', 'lost');
	await restoreCertifiedContext(page, '#badger-pixi-bridge', contextLossMode);
	await expect(page.locator('#badger-pixi-bridge')).toHaveAttribute('data-context-state', 'ready');

	const before = await page.evaluate(() => ({
		frame: (window as HarnessWindow).__badger.getRendererPerformance().count,
		heap:
			(performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory
				?.usedJSHeapSize ?? null,
	}));
	await page.waitForTimeout(sessionSeconds * 1_000);
	const after = await page.evaluate(() => ({
		frame: (window as HarnessWindow).__badger.getRendererPerformance().count,
		heap:
			(performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory
				?.usedJSHeapSize ?? null,
		uploadP95: Number(
			document.querySelector('#badger-pixi-bridge')?.getAttribute('data-upload-p95-bytes') ?? 0
		),
	}));
	expect(after.frame).toBeGreaterThan(before.frame);
	expect(after.uploadP95).toBe(0);
	if (before.heap !== null && after.heap !== null) {
		expect(after.heap - before.heap).toBeLessThan(64 * 1024 * 1024);
	}

	const lifecycle = await page.evaluate(() =>
		(window as HarnessWindow).__badger.getBridgeLifecycle()
	);
	expect(lifecycle).toMatchObject({ contextState: 'ready', destroyed: false });
	expect(Number(lifecycle?.contextLosses ?? 0)).toBeGreaterThanOrEqual(1);
	expect(Number(lifecycle?.contextRestores ?? 0)).toBeGreaterThanOrEqual(1);

	await page.evaluate(() => (window as HarnessWindow).__badger.destroyBridge());
	await expect(page.locator('#badger-pixi-bridge')).toHaveCount(0);
	expect(errors).toEqual([]);
	await writeCertificationEvidence('lifecycle', browserName, environment, {
		checks: {
			resize: true,
			pauseResume: true,
			contextLossRestore: true,
			teardown: true,
			errors,
		},
		session: {
			durationSeconds: sessionSeconds,
			framesBefore: before.frame,
			framesAfter: after.frame,
			heapBeforeBytes: before.heap,
			heapAfterBytes: after.heap,
			uploadP95Bytes: after.uploadP95,
			contextLossMode,
			contextLosses: Number(lifecycle?.contextLosses ?? 0),
			contextRestores: Number(lifecycle?.contextRestores ?? 0),
		},
	});
	console.info('Badger lifecycle certification', {
		browserName,
		sessionSeconds,
		contextLossMode,
		before,
		after,
	});
});

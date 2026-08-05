import { expect, test, type Page } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

test.setTimeout(120_000);

interface HarnessWindow extends Window {
	__badger: BadgerTestHarness;
}

interface ImageMetrics {
	width: number;
	height: number;
	meanLuma: number;
	chromaRatio: number;
	darkRatio: number;
	edgeRatio: number;
}

async function metrics(page: Page, png: Buffer): Promise<ImageMetrics> {
	return page.evaluate(async (url) => {
		const image = new Image();
		image.src = url;
		await image.decode();
		const canvas = document.createElement('canvas');
		canvas.width = image.naturalWidth;
		canvas.height = image.naturalHeight;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) throw new Error('2D metrics context unavailable');
		context.drawImage(image, 0, 0);
		const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
		let samples = 0;
		let lumaTotal = 0;
		let chroma = 0;
		let dark = 0;
		let edges = 0;
		const stride = 4;
		for (let y = 0; y < canvas.height; y += stride) {
			for (let x = 0; x < canvas.width; x += stride) {
				const offset = (y * canvas.width + x) * 4;
				const r = pixels[offset] ?? 0;
				const g = pixels[offset + 1] ?? 0;
				const b = pixels[offset + 2] ?? 0;
				const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
				lumaTotal += luma;
				chroma += Number((Math.max(r, g, b) - Math.min(r, g, b)) / 255 > 0.18);
				dark += Number(luma < 0.18);
				if (x + stride < canvas.width) {
					const next = offset + stride * 4;
					const nextLuma =
						(0.2126 * (pixels[next] ?? 0) +
							0.7152 * (pixels[next + 1] ?? 0) +
							0.0722 * (pixels[next + 2] ?? 0)) /
						255;
					edges += Number(Math.abs(nextLuma - luma) > 0.2);
				}
				samples += 1;
			}
		}
		return {
			width: canvas.width,
			height: canvas.height,
			meanLuma: lumaTotal / samples,
			chromaRatio: chroma / samples,
			darkRatio: dark / samples,
			edgeRatio: edges / samples,
		};
	}, `data:image/png;base64,${png.toString('base64')}`);
}

async function enterStage(page: Page, mode: 'canvas' | 'bridge') {
	await page.goto(`/?debug=1&renderer=${mode}`);
	await page.waitForFunction(
		() => (window as HarnessWindow).__badger?.getSceneName() === 'TitleScene'
	);
	await page.waitForFunction(
		(expected) => (window as HarnessWindow).__badger?.getRendererMode() === expected,
		mode
	);
	for (let index = 0; index < 5; index += 1) await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await page.waitForFunction(
		() => (window as HarnessWindow).__badger?.getSceneName() === 'StageRunScene'
	);
	await page.waitForTimeout(350);
	const semantic = await page.evaluate(() => ({
		player: (window as HarnessWindow).__badger.getPlayer(),
		enemies: (window as HarnessWindow).__badger.getEnemies(),
	}));
	const png = await page.locator('.game-shell').screenshot();
	return { semantic, metrics: await metrics(page, png) };
}

test('Canvas and retained Pixi runner compositions preserve semantic and visual structure', async ({
	browser,
}) => {
	const baseURL = String(test.info().project.use.baseURL ?? 'http://127.0.0.1:5173');
	const capture = async (mode: 'canvas' | 'bridge') => {
		const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 800 } });
		const page = await context.newPage();
		try {
			return await enterStage(page, mode);
		} finally {
			await context.close();
		}
	};
	const canvas = await capture('canvas');
	const bridge = await capture('bridge');

	expect(bridge.semantic.player?.hp).toBe(canvas.semantic.player?.hp);
	expect(Math.abs((bridge.semantic.player?.x ?? 0) - (canvas.semantic.player?.x ?? 0))).toBeLessThan(12);
	expect(Math.abs((bridge.semantic.player?.y ?? 0) - (canvas.semantic.player?.y ?? 0))).toBeLessThan(12);
	expect(bridge.semantic.enemies?.length).toBe(canvas.semantic.enemies?.length);
	expect(bridge.metrics.width).toBe(canvas.metrics.width);
	expect(bridge.metrics.height).toBe(canvas.metrics.height);
	expect(canvas.metrics.darkRatio).toBeGreaterThan(0.2);
	expect(bridge.metrics.darkRatio).toBeGreaterThan(0.2);
	expect(canvas.metrics.chromaRatio).toBeGreaterThan(0.025);
	expect(bridge.metrics.chromaRatio).toBeGreaterThan(0.025);
	expect(canvas.metrics.edgeRatio).toBeGreaterThan(0.008);
	expect(bridge.metrics.edgeRatio).toBeGreaterThan(0.008);
	expect(Math.abs(bridge.metrics.meanLuma - canvas.metrics.meanLuma)).toBeLessThan(0.3);
	expect(Math.abs(bridge.metrics.chromaRatio - canvas.metrics.chromaRatio)).toBeLessThan(0.4);
	console.info('Badger visual parity metrics', { canvas: canvas.metrics, bridge: bridge.metrics });
});

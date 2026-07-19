import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = resolve(process.env.ARTIFACT_ROOT ?? process.cwd());
const mime = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
};

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

const server = createServer(async (request, response) => {
	const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
	const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
	const filePath = normalize(join(root, relative));
	if (!filePath.startsWith(root)) {
		response.writeHead(403).end();
		return;
	}
	try {
		const info = await stat(filePath);
		if (!info.isFile()) throw new Error('not a file');
		response.writeHead(200, {
			'content-type': mime[extname(filePath)] ?? 'application/octet-stream',
		});
		createReadStream(filePath).pipe(response);
	} catch {
		response.writeHead(404).end('not found');
	}
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
assert(address && typeof address === 'object', 'artifact smoke server failed to bind');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const failedResponses = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
	if (message.type() === 'error') errors.push(message.text());
});
page.on('response', (response) => {
	if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
});

await page.addInitScript(() => {
	localStorage.setItem(
		'badger-sprawl-runner.save.v1',
		JSON.stringify({
			version: 1,
			meta: {
				credchips: 1,
				blueprintShards: 0,
				dubFavor: 0,
				orbitHeat: 0,
				unlockedBoons: [],
				purchasedSkills: [],
			},
			storyProgress: {
				currentStageId: 'chrome-arcology',
				completedStageIds: ['lower-sprawl', 'drainmarket'],
				acquiredPayloads: ['wafer_key', 'stim_cache'],
				resultFlags: ['wafer_key_acquired', 'stim_cache_secured'],
				campaignComplete: false,
			},
		})
	);
	const drawnImages = [];
	Object.defineProperty(window, '__artifactDrawnImages', {
		configurable: false,
		value: drawnImages,
		writable: false,
	});
	window.addEventListener('badger:stage-runtime-config', () => {
		window.__artifactStageStarted = true;
	});
	const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
	CanvasRenderingContext2D.prototype.drawImage = function (...args) {
		const source = args[0];
		if (source instanceof HTMLImageElement && source.currentSrc) {
			drawnImages.push(source.currentSrc);
		}
		return originalDrawImage.apply(this, args);
	};
});

try {
	await page.goto(`http://127.0.0.1:${address.port}/dist/index.html`, {
		waitUntil: 'networkidle',
	});
	await page.waitForURL('**/dist/index.html');
	await page.waitForFunction(() => {
		const urls = performance.getEntriesByType('resource').map((entry) => entry.name);
		return (
			urls.some((url) => url.endsWith('/dist/data/sprites.json')) &&
			urls.some((url) => url.endsWith('/assets/sprites/moss_badger_production.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/items_extended.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/item_icons_extended.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/skill_icons.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_parallax.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/worlds/mirror_palace_parallax.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/worlds/dub_colony_parallax.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/characters/naya_root.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/bosses/boss_king_feedback_ampthrone.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/enemies/chrome_bellhop.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/enemies/mirror_sentinel.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/bosses/boss_madame_vitrine_glasscourt.png'))
		);
	});

	const state = await page.evaluate(() => {
		const canvas = document.querySelector('canvas');
		const rect = canvas?.getBoundingClientRect();
		const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
		return {
			pathname: window.location.pathname,
			hasLegacyShell: Boolean(
				document.querySelector('.hud-panel, .status-grid, #status, #minigame')
			),
			hasProductionHarness: '__badger' in window,
			canvas: rect ? { width: rect.width, height: rect.height } : null,
			manifestUrls: resources.filter((url) => url.includes('sprites.json')),
		};
	});

	assert(
		state.pathname.endsWith('/dist/index.html'),
		`Artifact Lab target did not open the production runner: ${state.pathname}`
	);
	assert(!state.hasLegacyShell, 'production artifact still exposes the legacy debug/status shell');
	assert(!state.hasProductionHarness, 'production artifact exposes the development test harness');
	assert(
		state.canvas && state.canvas.width >= 1200,
		'production canvas does not fill the artifact viewport'
	);
	assert(
		state.manifestUrls.every((url) => url.includes('/dist/data/sprites.json')),
		`manifest escaped the artifact mount: ${state.manifestUrls.join(', ')}`
	);

	await page.locator('#game').click();
	await page.keyboard.press('Enter');
	for (let step = 0; step < 8; step += 1) {
		await page.keyboard.press('Enter');
		await page.waitForTimeout(35);
	}
	await page.keyboard.press('2');
	await page.keyboard.press('KeyR');
	await page.waitForFunction(() => window.__artifactStageStarted === true);
	await page.waitForFunction(() => {
		const drawn = window.__artifactDrawnImages ?? [];
		return (
			drawn.some((url) => url.endsWith('/assets/sprites/moss_badger_production.png')) &&
			drawn.some((url) => url.endsWith('/assets/sprites/items_extended.png')) &&
			drawn.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_parallax.png')) &&
			drawn.some((url) => url.endsWith('/assets/sprites/enemies/chrome_bellhop.png'))
		);
	});
	const drawnImages = await page.evaluate(() => window.__artifactDrawnImages ?? []);
	assert(
		drawnImages.some((url) => url.endsWith('/assets/sprites/moss_badger_production.png')),
		'production player sprite loaded but was never drawn'
	);
	assert(
		drawnImages.some((url) => url.endsWith('/assets/sprites/items_extended.png')),
		'extended progression pickup sprites loaded but were never drawn'
	);
	assert(
		drawnImages.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_parallax.png')),
		'Chrome Arcology production parallax loaded but was never drawn'
	);
	assert(
		drawnImages.some((url) => url.endsWith('/assets/sprites/enemies/chrome_bellhop.png')),
		'Chrome Arcology bellhop sprite loaded but was never drawn'
	);
	assert(errors.length === 0, `production artifact emitted browser errors:\n${errors.join('\n')}`);
	assert(
		failedResponses.length === 0,
		`production artifact requested missing resources:\n${failedResponses.join('\n')}`
	);
	console.log('badger-sprawl-runner artifact browser smoke ok');
} finally {
	await browser.close();
	await new Promise((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve()))
	);
}

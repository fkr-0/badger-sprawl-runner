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
	for (const key of [
		'__artifactSceneName',
		'__artifactWorldMap',
		'__artifactStoryPresentation',
	]) {
		Object.defineProperty(window, key, {
			configurable: false,
			value: null,
			writable: true,
		});
	}
	window.addEventListener('badger:scene-change', (event) => {
		window.__artifactSceneName = event.detail?.sceneName ?? null;
	});
	window.addEventListener('badger:world-map', (event) => {
		window.__artifactWorldMap = event.detail ?? null;
	});
	window.addEventListener('badger:story-presentation', (event) => {
		window.__artifactStoryPresentation = event.detail ?? null;
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
	await page.waitForFunction(() => window.__artifactSceneName === 'TitleScene');
	await page.waitForFunction(() => {
		const urls = performance.getEntriesByType('resource').map((entry) => entry.name);
		return (
			urls.some((url) => url.endsWith('/dist/data/sprites.json')) &&
			urls.some((url) => url.endsWith('/assets/sprites/moss_badger_production.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/items_extended.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/item_icons_extended.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/skill_icons.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_parallax.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_tiles.png')) &&
			urls.some((url) => url.endsWith('/assets/sprites/worlds/straylight_mirage_parallax.png')) &&
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
			pixiUrls: resources.filter((url) => url.includes('pixi-runtime-')),
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
	assert(
		state.pixiUrls.length === 0,
		`default Canvas route eagerly loaded Pixi: ${state.pixiUrls.join(', ')}`
	);

	await page.locator('#game').click();
	await page.keyboard.press('Enter');
	await page.waitForFunction(() => window.__artifactSceneName === 'SubwayMapScene');

	const selectMapLocation = async (locationId) => {
		for (let step = 0; step < 64; step += 1) {
			const selectedLocationId = await page.evaluate(
				() => window.__artifactWorldMap?.selectedLocationId ?? null
			);
			if (selectedLocationId === locationId) return;
			await page.keyboard.press('ArrowRight');
			await page.waitForFunction(
				(previous) => window.__artifactWorldMap?.selectedLocationId !== previous,
				selectedLocationId
			);
		}
		throw new Error(`production map could not select ${locationId}`);
	};

	let activeRouteId = null;
	for (let step = 0; step < 64; step += 1) {
		const selection = await page.evaluate(() => window.__artifactWorldMap);
		if (selection?.selectedExpeditionStageId === 'chrome-arcology') {
			activeRouteId = selection.selectedLocationId;
			break;
		}
		await page.keyboard.press('ArrowRight');
		await page.waitForFunction(
			(previous) => window.__artifactWorldMap?.selectedLocationId !== previous,
			selection?.selectedLocationId ?? null
		);
	}
	assert(activeRouteId, 'production map could not locate the active Chrome Arcology route');

	const visitedLocations = new Set();
	for (let travelStep = 0; travelStep < 16; travelStep += 1) {
		const map = await page.evaluate(() => window.__artifactWorldMap);
		if (map?.currentLocationId === activeRouteId) {
			await selectMapLocation(activeRouteId);
			await page.keyboard.press('Enter');
			break;
		}
		visitedLocations.add(map?.currentLocationId);
		const sameDistrictReachable = map?.reachableLocationIds?.find(
			(locationId) =>
				locationId === activeRouteId ||
				(locationId.startsWith('chrome-arcology:') && !visitedLocations.has(locationId))
		);
		const nextLocation =
			sameDistrictReachable ??
			map?.reachableLocationIds?.find((locationId) => !visitedLocations.has(locationId));
		assert(nextLocation, `no unvisited route from ${map?.currentLocationId ?? 'unknown'}`);
		await selectMapLocation(nextLocation);
		await page.keyboard.press('Enter');
		if (nextLocation === activeRouteId) break;
		await page.waitForFunction(() => window.__artifactSceneName === 'LocationScene');
		await page.keyboard.press('KeyM');
		await page.waitForFunction(() => window.__artifactSceneName === 'SubwayMapScene');
	}
	await page.waitForFunction(() => window.__artifactSceneName === 'StoryFlowScene');
	for (let step = 0; step < 16; step += 1) {
		const presentation = await page.evaluate(() => window.__artifactStoryPresentation);
		if (presentation?.mode === 'stage') break;
		const previousPresentation = JSON.stringify(presentation);
		await page.keyboard.press('Enter');
		await page.waitForFunction(
			(previous) => JSON.stringify(window.__artifactStoryPresentation) !== previous,
			previousPresentation
		);
	}
	assert(
		(await page.evaluate(() => window.__artifactStoryPresentation?.mode)) === 'stage',
		'production story flow did not reach stage selection'
	);
	await page.keyboard.press('KeyR');
	await page.waitForFunction(() => window.__artifactSceneName === 'StageRunScene');
	await page.waitForFunction(() => window.__artifactStageStarted === true);
	await page.waitForFunction(() => {
		const drawn = window.__artifactDrawnImages ?? [];
		return (
			drawn.some((url) => url.endsWith('/assets/sprites/moss_badger_production.png')) &&
			drawn.some((url) => url.endsWith('/assets/sprites/items_extended.png')) &&
			drawn.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_parallax.png')) &&
			drawn.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_tiles.png')) &&
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
		drawnImages.some((url) => url.endsWith('/assets/sprites/worlds/chrome_arcology_tiles.png')),
		'Chrome Arcology DALL-E terrain atlas loaded but was never drawn'
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

	const bridgeErrors = [];
	const bridgeFailures = [];
	const bridgePage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
	bridgePage.on('pageerror', (error) => bridgeErrors.push(error.message));
	bridgePage.on('console', (message) => {
		if (message.type() === 'error') bridgeErrors.push(message.text());
	});
	bridgePage.on('response', (response) => {
		if (response.status() >= 400) bridgeFailures.push(`${response.status()} ${response.url()}`);
	});
	await bridgePage.goto(
		`http://127.0.0.1:${address.port}/dist/index.html?renderer=bridge&debug=1`,
		{
			waitUntil: 'networkidle',
		}
	);
	await bridgePage.waitForSelector('#badger-pixi-bridge');
	await bridgePage.waitForFunction(() =>
		performance.getEntriesByType('resource').some((entry) => entry.name.includes('pixi-runtime-'))
	);
	await bridgePage.waitForFunction(() => window.__badger?.getSceneName() === 'TitleScene');
	await bridgePage.locator('#game').click();
	await bridgePage.keyboard.press('Enter');
	await bridgePage.waitForFunction(() => window.__badger?.getSceneName() === 'SubwayMapScene');
	await bridgePage.evaluate(() => {
		const stageId = window.__badger?.getStoryProgress().currentStageId;
		if (!stageId) throw new Error('artifact debug harness has no active story stage');
		const routeId = `${stageId}:route`;
		const travel = window.__badger?.debugTravelTo(routeId);
		if (!travel?.ok) throw new Error(`failed to prepare artifact story route: ${travel?.reason}`);
		const scene = window.__app?.getCurrentScene();
		if (!scene?.selectLocation?.(routeId)) {
			throw new Error('artifact SubwayMapScene could not select the active route');
		}
		scene.confirmSelection?.();
	});
	await bridgePage.waitForFunction(() => window.__badger?.getSceneName() === 'StoryFlowScene');
	for (let safety = 0; safety < 8; safety += 1) {
		const mode = await bridgePage.evaluate(() => window.__badger?.getStoryState().mode);
		if (mode === 'stage') break;
		await bridgePage.keyboard.press('Enter');
		await bridgePage.waitForTimeout(35);
	}
	await bridgePage.keyboard.press('KeyR');
	await bridgePage.waitForFunction(() => window.__badger?.getSceneName() === 'StageRunScene');
	await bridgePage.waitForFunction(
		() => document.querySelector('#badger-pixi-bridge')?.getAttribute('data-native-hud') === 'true'
	);
	const bridgeState = await bridgePage.evaluate(() => ({
		mode: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-renderer-mode'),
		activePasses: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-arcade-active-passes'),
		nativeHud: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-native-hud'),
		nativeBackdrop: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-native-backdrop'),
		nativeParallax: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-native-parallax'),
		hudHealth: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-hud-health'),
		nativeActors: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-native-actors'),
		nativeTerrain: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-native-terrain'),
		nativeProjectiles: document
			.querySelector('#badger-pixi-bridge')
			?.getAttribute('data-native-projectiles'),
		hardwareTier: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-hardware-tier'),
		hardwareBudget: document.querySelector('#badger-pixi-bridge')?.getAttribute('data-hardware-budget'),
		pixiUrls: performance
			.getEntriesByType('resource')
			.map((entry) => entry.name)
			.filter((url) => url.includes('pixi-runtime-')),
	}));
	assert(bridgeState.mode === 'bridge', 'Pixi bridge canvas did not initialize in bridge mode');
	assert(
		bridgeState.activePasses === null || bridgeState.activePasses === '',
		'no full-frame Canvas texture pass should remain'
	);
	assert(bridgeState.nativeHud === 'true', 'Pixi bridge did not activate the native HUD');
	assert(
		bridgeState.nativeParallax === 'true',
		'selected stage did not activate retained native world background ownership'
	);
	assert(bridgeState.nativeActors === 'true', 'Pixi bridge did not activate native actors');
	assert(bridgeState.nativeTerrain === 'true', 'Pixi bridge did not activate retained native terrain');
	assert(bridgeState.nativeProjectiles === 'true', 'Pixi bridge did not activate native projectiles');
	assert(/^(low|balanced|high)$/.test(bridgeState.hardwareTier ?? ''), 'hardware tier telemetry is missing');
	assert(/^(warming|pass)$/.test(bridgeState.hardwareBudget ?? ''), 'hardware budget reported failure');
	assert(
		/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(bridgeState.hudHealth ?? ''),
		'native HUD health telemetry is missing'
	);
	assert(bridgeState.pixiUrls.length > 0, 'bridge route did not load the lazy Pixi chunk');
	assert(
		bridgeErrors.length === 0,
		`Pixi bridge emitted browser errors:\n${bridgeErrors.join('\n')}`
	);
	assert(
		bridgeFailures.length === 0,
		`Pixi bridge requested missing resources:\n${bridgeFailures.join('\n')}`
	);
	await bridgePage.close();
	console.log('badger-sprawl-runner artifact browser smoke ok');
} finally {
	await browser.close();
	await new Promise((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve()))
	);
}

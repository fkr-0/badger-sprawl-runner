import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { type Page, type TestInfo, expect, test } from '@playwright/test';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface EvidenceGamepad {
	id: string;
	index: number;
	connected: boolean;
	mapping: 'standard';
	axes: number[];
	buttons: Array<{ pressed: boolean; touched: boolean; value: number }>;
	timestamp: number;
}

interface ReleaseEvidenceWindow extends Window {
	__badger: BadgerTestHarness;
	__evidenceGamepad?: EvidenceGamepad;
	__vaneAudioCues: unknown[];
}

const EVIDENCE_DATE = process.env.BADGER_EVIDENCE_DATE ?? '2026-07-26';
const EVIDENCE_ROOT = resolve(`release-evidence/${EVIDENCE_DATE}/browser`);
const BASELINE_ROOT = resolve(EVIDENCE_ROOT, 'baselines');
mkdirSync(BASELINE_ROOT, { recursive: true });

async function waitForScene(page: Page, name: string): Promise<void> {
	await page.waitForFunction(
		(expected) => (window as ReleaseEvidenceWindow).__badger?.getSceneName() === expected,
		name,
		{ timeout: 15_000 }
	);
}

const ASTEROID_INTERFACE_SOLUTIONS: Readonly<Record<string, readonly number[]>> = {
	'transmitter-root-listen': [0, 2, 1],
	'transmitter-root-teach': [1, 0, 2],
	'transmitter-root-release': [2, 1, 0],
};

async function completeAsteroidObjectives(page: Page): Promise<void> {
	const nonBossIds = await page.evaluate(() =>
		((window as ReleaseEvidenceWindow).__badger.getEnemies() ?? [])
			.filter((enemy) => !enemy.bossId && typeof enemy.id === 'string')
			.map((enemy) => enemy.id as string)
	);
	for (const enemyId of nonBossIds) {
		await page.evaluate(
			(id) => (window as ReleaseEvidenceWindow).__badger.setEnemyHp(id, 0),
			enemyId
		);
	}

	const snapshot = await page.evaluate(() =>
		(window as ReleaseEvidenceWindow).__badger.getLateStageObjectives()
	);
	if (!snapshot) throw new Error('Asteroid objective snapshot was not installed');

	for (const node of snapshot.primaryNodes) {
		await page.evaluate(
			([x, y]) => (window as ReleaseEvidenceWindow).__badger.teleportPlayer(x - 17, y - 23),
			[node.x, node.y]
		);
		await page.waitForTimeout(45);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(() =>
					(window as ReleaseEvidenceWindow).__badger.getLateStageObjectives()?.interface
				)
			)
			.toMatchObject({ status: 'active', nodeId: node.id });

		const interfaceState = await page.evaluate(() =>
			(window as ReleaseEvidenceWindow).__badger.getLateStageObjectives()?.interface
		);
		if (!interfaceState || interfaceState.status !== 'active') {
			throw new Error(`Asteroid interface did not open for ${node.id}`);
		}
		if (interfaceState.kind === 'fasttype') {
			await page.keyboard.type(interfaceState.target);
		} else {
			const solution = ASTEROID_INTERFACE_SOLUTIONS[interfaceState.nodeId];
			if (!solution) throw new Error(`Missing release-evidence solution for ${interfaceState.nodeId}`);
			for (let columnIndex = 0; columnIndex < interfaceState.columns.length; columnIndex += 1) {
				await page.keyboard.press(`Digit${(solution[columnIndex] ?? 0) + 1}`);
				if (columnIndex < interfaceState.columns.length - 1) {
					await page.keyboard.press('ArrowRight');
				}
			}
		}
		await page.keyboard.press('Enter');
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as ReleaseEvidenceWindow).__badger
							.getLateStageObjectives()
							?.primaryNodes.find((entry) => entry.id === id)?.completed,
					node.id
				)
			)
			.toBe(true);
	}

	for (const node of snapshot.supportNodes) {
		await page.evaluate(
			([x, y]) => (window as ReleaseEvidenceWindow).__badger.teleportPlayer(x - 17, y - 23),
			[node.x, node.y]
		);
		await page.waitForTimeout(45);
		await page.keyboard.press('KeyM');
		await expect
			.poll(() =>
				page.evaluate(
					(id) =>
						(window as ReleaseEvidenceWindow).__badger
							.getLateStageObjectives()
							?.supportNodes.find((entry) => entry.id === id)?.completed,
					node.id
				)
			)
			.toBe(true);
	}

	await expect
		.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getLateStageObjectives()))
		.toMatchObject({ primaryComplete: true, supportComplete: true, tutorialComplete: true });
}

async function installActiveExpedition(
	page: Page,
	input: { seed: string; entranceId: string; depth: number }
): Promise<void> {
	await page.goto('/?debug=1');
	await page.waitForFunction(() => Boolean((window as Partial<ReleaseEvidenceWindow>).__badger));
	await page.evaluate(async (request) => {
		const undercity = await import('/src/procgen/UndercityExpedition.ts');
		const adventure = await import('/src/game/adventure/AdventureState.ts');
		const ledger = await import('/src/game/adventure/ExpeditionLedger.ts');
		const saves = await import('/src/storage/SaveStore.ts');
		const built = undercity.buildUndercityExpedition(request);
		const canonical = adventure.createDefaultAdventureSave({
			inventory: [
				{ itemId: 'claws', quantity: 1 },
				{ itemId: 'railgun', quantity: 1 },
				{ itemId: 'stim_pack', quantity: 2 },
			],
			equippedItemIds: ['claws', 'railgun'],
			itemStates: {
				claws: { condition: 100, maxCondition: 100, repairCount: 0 },
				railgun: { condition: 71, maxCondition: 100, repairCount: 1 },
				stim_pack: { condition: 100, maxCondition: 100, repairCount: 0 },
			},
			expedition: {
				integrity: 5,
				maxIntegrity: 6,
				injuries: 1,
				completedRuns: 2,
				settledRunIds: [],
			},
		});
		const launch = ledger.buildExpeditionLaunchState(canonical, built.manifest.runId);
		const active = undercity.createActiveUndercityExpeditionSave(built.manifest, launch);
		localStorage.setItem(saves.ACTIVE_EXPEDITION_SAVE_KEY, JSON.stringify(active));
	}, input);
	await page.reload();
	await waitForScene(page, 'StageRunScene');
}

async function attachJson(testInfo: TestInfo, name: string, value: unknown): Promise<void> {
	await testInfo.attach(name, {
		body: Buffer.from(`${JSON.stringify(value, null, 2)}\n`),
		contentType: 'application/json',
	});
}

test.describe('release evidence', () => {
	test('records reduced-motion traversal truth without input delay', async ({ page }, testInfo) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await installActiveExpedition(page, {
			seed: 'reduced-motion-evidence',
			entranceId: 'chorus-rail-subharmonic-loop',
			depth: 4,
		});

		const samples = await page.evaluate(async () => {
			const result: Array<ReturnType<BadgerTestHarness['getTraversalRhythm']>> = [];
			const started = performance.now();
			let lastKey = '';
			while (performance.now() - started < 3600) {
				const snapshot = (window as ReleaseEvidenceWindow).__badger.getTraversalRhythm();
				const key = snapshot
					? `${snapshot.cycleBeatIndex}:${snapshot.windowOpen}:${snapshot.visualPlatformOffset}`
					: 'none';
				if (snapshot && key !== lastKey) result.push(snapshot);
				lastKey = key;
				await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
			}
			return result;
		});

		expect(samples.length).toBeGreaterThan(2);
		expect(samples.every((sample) => sample?.reducedMotion === true)).toBe(true);
		expect(samples.every((sample) => sample?.visualPlatformOffset === 0)).toBe(true);
		expect(samples.every((sample) => sample?.screenShakeEnabled === false)).toBe(true);
		expect(samples.every((sample) => sample?.inputDelayMs === 0)).toBe(true);
		expect(samples.some((sample) => sample?.windowOpen === true)).toBe(true);
		expect(samples.some((sample) => sample?.windowOpen === false)).toBe(true);
		await page.screenshot({ path: resolve(BASELINE_ROOT, 'reduced-motion-dub-colony.png') });
		await attachJson(testInfo, 'reduced-motion-traversal.json', samples);
	});

	test('records actual standard-gamepad traversal through InputSystem', async ({ page }, testInfo) => {
		await page.addInitScript(() => {
			const runtime = window as ReleaseEvidenceWindow;
			runtime.__evidenceGamepad = {
				id: 'Release Evidence Standard Gamepad',
				index: 0,
				connected: true,
				mapping: 'standard',
				axes: [0, 0, 0, 0],
				buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
				timestamp: 0,
			};
			Object.defineProperty(navigator, 'getGamepads', {
				configurable: true,
				value: () => [runtime.__evidenceGamepad],
			});
		});
		await installActiveExpedition(page, {
			seed: 'gamepad-traversal-evidence',
			entranceId: 'blue-mercy-maintenance-mouth',
			depth: 2,
		});
		await page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.teleportPlayer(100, 448));
		const before = await page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getPlayer());

		await page.evaluate(() => {
			const pad = (window as ReleaseEvidenceWindow).__evidenceGamepad;
			if (!pad) throw new Error('evidence gamepad missing');
			pad.axes[0] = 1;
			pad.timestamp += 1;
		});
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getPlayer()?.x ?? 0))
			.toBeGreaterThan((before?.x ?? 0) + 18);
		await page.evaluate(() => {
			const pad = (window as ReleaseEvidenceWindow).__evidenceGamepad;
			if (!pad) throw new Error('evidence gamepad missing');
			pad.axes[0] = 0;
			pad.buttons[0] = { pressed: true, touched: true, value: 1 };
			pad.timestamp += 1;
		});
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getPlayer()?.vy ?? 0))
			.toBeLessThan(0);
		await page.evaluate(() => {
			const pad = (window as ReleaseEvidenceWindow).__evidenceGamepad;
			if (!pad) throw new Error('evidence gamepad missing');
			pad.buttons[0] = { pressed: false, touched: false, value: 0 };
			pad.timestamp += 1;
		});
		const after = await page.evaluate(() => ({
			player: (window as ReleaseEvidenceWindow).__badger.getPlayer(),
			animation: (window as ReleaseEvidenceWindow).__badger.getAnimation(),
			gamepad: (window as ReleaseEvidenceWindow).__evidenceGamepad,
		}));
		await page.screenshot({ path: resolve(BASELINE_ROOT, 'gamepad-lower-sprawl-jump.png') });
		await attachJson(testInfo, 'gamepad-traversal.json', { before, after });
	});

	test('records Director Vane phase visuals and emitted audio-cue contracts', async ({ page }, testInfo) => {
		await page.addInitScript(() => {
			localStorage.clear();
			localStorage.setItem(
				'badger-sprawl-runner.save.v1',
				JSON.stringify({
					version: 1,
					meta: {
						credchips: 80,
						blueprintShards: 12,
						dubFavor: 8,
						orbitHeat: 6,
						unlockedBoons: [],
						purchasedSkills: [],
					},
					storyProgress: {
						currentStageId: 'asteroid-redoubt',
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
						resultFlags: [
							'wafer_broadcast',
							'stim_cache_secured',
							'elevator_seed_taken',
							'lio_protected',
							'colony_alignment_chorus',
							'ledger_public_dump',
							'cargo_full_release',
						],
						lioTrust: 'protected',
						colonyAlignment: 'chorus',
						campaignComplete: false,
					},
				})
			);
			const runtime = window as ReleaseEvidenceWindow;
			runtime.__vaneAudioCues = [];
			window.addEventListener('badger:audio-cue', (event) => {
				const detail = (event as CustomEvent).detail;
				if (detail?.source === 'director-vane') runtime.__vaneAudioCues.push(detail);
			});
		});
		await page.goto('/?debug=1');
		await page.waitForFunction(() => Boolean((window as Partial<ReleaseEvidenceWindow>).__badger));
		await page.locator('#game').click();
		await page.keyboard.press('Enter');
		await waitForScene(page, 'SubwayMapScene');
		await page.evaluate(() => {
			const runtime = window as ReleaseEvidenceWindow & {
				__app?: { getCurrentScene(): unknown };
			};
			const travel = runtime.__badger.debugTravelTo('asteroid-redoubt:route');
			if (!travel.ok) throw new Error(`Could not position release recorder: ${travel.reason}`);
			const scene = runtime.__app?.getCurrentScene() as {
				selectLocation(locationId: string): boolean;
				confirmSelection(): unknown;
			};
			if (!scene?.selectLocation('asteroid-redoubt:route')) {
				throw new Error('Asteroid Redoubt route is not selectable in the persistent map');
			}
			scene.confirmSelection();
		});
		await waitForScene(page, 'StoryFlowScene');
		for (let safety = 0; safety < 10; safety += 1) {
			const mode = await page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getStoryState().mode);
			if (mode === 'stage') break;
			await page.keyboard.press('Enter');
			await page.waitForTimeout(45);
		}
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getStoryState().mode))
			.toBe('stage');
		await page.keyboard.press('Digit3');
		await page.keyboard.press('KeyR');
		await waitForScene(page, 'StageRunScene');
		await page.waitForFunction(() =>
			(window as ReleaseEvidenceWindow).__badger.hasSheet('boss_boss_director_vane_skylock')
		);
		await completeAsteroidObjectives(page);

		const snapshots: unknown[] = [];
		const capturePhase = async (name: string): Promise<void> => {
			const snapshot = await page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getDirectorVane());
			snapshots.push(snapshot);
			await page.screenshot({ path: resolve(BASELINE_ROOT, `director-vane-${name}.png`) });
		};

		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getDirectorVane()?.action))
			.toBe('competence-proof');
		const enemySnapshot = await page.evaluate(() =>
			(window as ReleaseEvidenceWindow).__badger.getEnemies() ?? []
		);
		const vane = enemySnapshot.find((enemy) => enemy.bossId === 'director-vane');
		if (!vane) {
			throw new Error(`Director Vane entity missing from authored StageRun: ${JSON.stringify(enemySnapshot)}`);
		}
		const setVaneRatio = async (ratio: number): Promise<void> => {
			await page.evaluate(
				(hp) => (window as ReleaseEvidenceWindow).__badger.setBossHp(hp),
				vane.maxHp * ratio
			);
		};
		await capturePhase('phase-0-competence-proof');
		await setVaneRatio(0.7);
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getDirectorVane()?.action))
			.toBe('chromatic-lock');
		await capturePhase('phase-1-chromatic-lock');
		await setVaneRatio(0.45);
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getDirectorVane()?.action))
			.toBe('counterclaim');
		await page.keyboard.press('KeyM');
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getDirectorVane()?.contradictionClosed))
			.toBe(true);
		await capturePhase('phase-2-counterclaim-closed');
		await setVaneRatio(0.2);
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getDirectorVane()?.action))
			.toBe('ownership-collapse');
		await capturePhase('phase-3-ownership-collapse');
		await setVaneRatio(0);
		await expect
			.poll(() => page.evaluate(() => (window as ReleaseEvidenceWindow).__badger.getDirectorVane()?.action))
			.toBe('defeated');
		await capturePhase('defeated');

		const audioCues = await page.evaluate(() => (window as ReleaseEvidenceWindow).__vaneAudioCues);
		expect(audioCues.length).toBeGreaterThanOrEqual(6);
		expect(audioCues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					eventKind: 'vane-phase-transition',
					cue: expect.objectContaining({ id: 'vane.competence-proof' }),
				}),
				expect.objectContaining({
					eventKind: 'vane-contradiction-closed',
					cue: expect.objectContaining({ id: 'vane.contradiction-closed' }),
				}),
				expect.objectContaining({
					eventKind: 'vane-defeated',
					cue: expect.objectContaining({ id: 'vane.defeated' }),
				}),
			])
		);
		await attachJson(testInfo, 'director-vane-snapshots.json', snapshots);
		await attachJson(testInfo, 'director-vane-audio-events.json', audioCues);
	});
});

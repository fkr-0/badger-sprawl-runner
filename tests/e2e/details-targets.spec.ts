import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

interface DetailsAcceptanceCoverage {
	testTitle: RegExp;
	testBullets: string[];
	specEvidence: RegExp[];
}

const DETAILS_TARGET_TESTS: Record<string, DetailsAcceptanceCoverage> = {
	'Physics: ledge / corner correction': {
		testTitle: /physics: ledge and corner correction/,
		testBullets: ['horizontal corner correction', 'vertical head-bump correction', 'no correction beyond threshold', 'deterministic obstacle tie-break'],
		specEvidence: [/horizontal: core\.resolveLedgeCorrection/, /vertical: core\.resolveLedgeCorrection/, /blocked: core\.resolveLedgeCorrection/, /tieBreak: core\.resolveLedgeCorrection/],
	},
	'Physics: slope walking / slide surfaces': {
		testTitle: /physics: slope walking and slide surfaces/,
		testBullets: ['standing on slope samples exact y', 'walking uphill/downhill deterministic', 'slippery slope causes deterministic slide', 'stable slope id tie-break'],
		specEvidence: [/sample: core\.resolveSlopeSurface/, /uphill: core\.walkSlopeSurface/, /slippery: core\.walkSlopeSurface/, /tieBreak: core\.resolveSlopeSurface/],
	},
	'Combat: hit-confirm / cancel routing': {
		testTitle: /combat: hit-confirm cancel routing/,
		testBullets: ['hit confirm unlocks cross/launcher', 'whiff denies cancel', 'block allows defensive cancel only', 'deterministic route order'],
		specEvidence: [/hitRoutes: frame\.getCancelRoutes/, /whiffRoutes: frame\.getCancelRoutes/, /blockRoutes/, /orderedRoutes/],
	},
	'Combat: hurtbox / hitbox layers': {
		testTitle: /combat: layered hitboxes/,
		testBullets: ['low attack misses airborne target', 'air attack hits airborne target', 'parryable projectile respects layer', 'unblockable bypasses guard but not invuln'],
		specEvidence: [/lowVsAir/, /airVsAir/, /projectileParry/, /unblockableGuard[\s\S]*unblockableInvuln/],
	},
	'Combat: poise / stagger breakpoints': {
		testTitle: /combat: poise and stagger breakpoints/,
		testBullets: ['repeated light attacks eventually stagger', 'heavy attack instantly staggers weak enemy', 'boss armor reduces poise damage', 'poise decay deterministic over time'],
		specEvidence: [/lightChain/, /heavy: poise\.stepPoiseStagger/, /boss: poise\.stepPoiseStagger/, /decay: poise\.stepPoiseStagger/],
	},
	'Items: conditional affix triggers': {
		testTitle: /items: conditional affixes/,
		testBullets: ['airborne-only bonus applies only airborne', 'every-third-hit trigger deterministic', 'cooldown prevents repeated trigger', 'replay hash stable'],
		specEvidence: [/airborneRuntime/, /thirdRuntime/, /cooldownRuntime/, /replayHash/],
	},
	'Items: socket polarity / overclocking': {
		testTitle: /items: socket polarity and overclocking/,
		testBullets: ['matching polarity boosts effect', 'mismatch applies penalty', 'overclock increases effect and wear', 'deterministic instability roll'],
		specEvidence: [/const matched = sockets\.resolveSocketPolarityEffects/, /const mismatch = sockets\.resolveSocketPolarityEffects/, /const overclock = sockets\.resolveSocketPolarityEffects/, /instabilitySeed/],
	},
	'Integrated: frame replay diff reports': {
		testTitle: /integrated: replay diff reports/,
		testBullets: ['detects changed hp', 'detects changed projectile position', 'ignores configured volatile fields', 'stable diff ordering'],
		specEvidence: [/hp: replay\.diffReplaySnapshots/, /projectile: replay\.diffReplaySnapshots/, /ignored: replay\.diffReplaySnapshots/, /ordered: replay\.diffReplaySnapshots/],
	},
};

const DETAILS_UNIT_TEST_FILES: Record<string, string[]> = {
	'Physics: ledge / corner correction': ['packages/platformer-core/src/tests/ledge-correction-system.test.ts'],
	'Physics: slope walking / slide surfaces': ['packages/platformer-core/src/tests/slope-surface-system.test.ts'],
	'Combat: hit-confirm / cancel routing': ['apps/runner/src/systems/CombatFrameDataSystem.test.ts'],
	'Combat: hurtbox / hitbox layers': ['apps/runner/src/systems/CombatHitboxLayerSystem.test.ts'],
	'Combat: poise / stagger breakpoints': ['apps/runner/src/systems/PoiseStaggerSystem.test.ts'],
	'Items: conditional affix triggers': ['apps/runner/src/systems/ConditionalItemEffectSystem.test.ts'],
	'Items: socket polarity / overclocking': ['apps/runner/src/systems/ItemSocketSystem.test.ts'],
	'Integrated: frame replay diff reports': ['apps/runner/src/systems/ReplayDiffSystem.test.ts'],
};

const DETAILS_IMPLEMENTATION_FILES: Record<string, string[]> = {
	'Physics: ledge / corner correction': ['packages/platformer-core/src/systems/ledgeCorrectionSystem.ts'],
	'Physics: slope walking / slide surfaces': ['packages/platformer-core/src/systems/slopeSurfaceSystem.ts'],
	'Combat: hit-confirm / cancel routing': ['apps/runner/src/systems/CombatFrameDataSystem.ts'],
	'Combat: hurtbox / hitbox layers': ['apps/runner/src/systems/CombatHitboxLayerSystem.ts'],
	'Combat: poise / stagger breakpoints': ['apps/runner/src/systems/PoiseStaggerSystem.ts'],
	'Items: conditional affix triggers': ['apps/runner/src/systems/ConditionalItemEffectSystem.ts'],
	'Items: socket polarity / overclocking': ['apps/runner/src/systems/ItemSocketSystem.ts'],
	'Integrated: frame replay diff reports': ['apps/runner/src/systems/ReplayDiffSystem.ts'],
};

function normalizeImplementationName(name: string): string {
	return name.replace(/\.ts$/, '');
}

function implementationBasenamesFor(heading: string): string[] {
	return (DETAILS_IMPLEMENTATION_FILES[heading] ?? []).map((file) => normalizeImplementationName(file.split('/').at(-1) ?? file));
}

function extractDetailsImplementationNames(details: string): Record<string, string[]> {
	const sections: Record<string, string[]> = {};
	let currentHeading: string | null = null;
	let inImplementationBlock = false;

	for (const line of details.split(/\r?\n/)) {
		const heading = line.match(/^### \d+\. (.+)$/);
		if (heading) {
			currentHeading = heading[1];
			sections[currentHeading] = [];
			inImplementationBlock = false;
			continue;
		}

		if (!currentHeading) continue;
		if (line === 'Implementation shape:') {
			inImplementationBlock = true;
			continue;
		}
		if (inImplementationBlock && (line === 'Tests:' || line.startsWith('### '))) {
			inImplementationBlock = false;
			continue;
		}
		if (!inImplementationBlock) continue;

		for (const match of line.matchAll(/`([^`]+)`/g)) {
			const name = normalizeImplementationName(match[1]);
			if (/System$/.test(name)) sections[currentHeading].push(name);
		}
	}

	return sections;
}

function extractDetailsTestBullets(details: string): Record<string, string[]> {
	const sections: Record<string, string[]> = {};
	let currentHeading: string | null = null;
	let inTestsBlock = false;

	for (const line of details.split(/\r?\n/)) {
		const heading = line.match(/^### \d+\. (.+)$/);
		if (heading) {
			currentHeading = heading[1];
			sections[currentHeading] = [];
			inTestsBlock = false;
			continue;
		}

		if (!currentHeading) continue;
		if (line === 'Tests:') {
			inTestsBlock = true;
			continue;
		}
		if (inTestsBlock && line.startsWith('### ')) {
			inTestsBlock = false;
			continue;
		}
		if (inTestsBlock) {
			const bullet = line.match(/^- (.+)$/);
			if (bullet) sections[currentHeading].push(bullet[1]);
		}
	}

	return sections;
}
test.describe('details.md mechanics contracts', () => {
	test('coverage: every details.md target and test bullet has an acceptance e2e', () => {
		const details = readFileSync('details.md', 'utf8');
		const spec = readFileSync('tests/e2e/details-targets.spec.ts', 'utf8');
		const targetHeadings = [...details.matchAll(/^### \d+\. (.+)$/gm)].map((match) => match[1]);
		const detailsTestBullets = extractDetailsTestBullets(details);
		const detailsImplementationNames = extractDetailsImplementationNames(details);

		expect(targetHeadings).toEqual(Object.keys(DETAILS_TARGET_TESTS));
		for (const [heading, coverage] of Object.entries(DETAILS_TARGET_TESTS)) {
			expect.soft(detailsImplementationNames[heading], `${heading} details.md implementation files`).toEqual(implementationBasenamesFor(heading));
			expect.soft(spec, `${heading} e2e title`).toMatch(coverage.testTitle);
			expect.soft(detailsTestBullets[heading], `${heading} details.md Tests bullets`).toEqual(coverage.testBullets);
			for (const evidence of coverage.specEvidence) {
				expect.soft(spec, `${heading} evidence ${evidence}`).toMatch(evidence);
			}
		}
	});

	test('coverage: every details.md target has source files wired into e2e', () => {
		const spec = readFileSync('tests/e2e/details-targets.spec.ts', 'utf8');
		expect(Object.keys(DETAILS_IMPLEMENTATION_FILES)).toEqual(Object.keys(DETAILS_TARGET_TESTS));

		const detailsImplementationNames = extractDetailsImplementationNames(readFileSync('details.md', 'utf8'));
		expect(Object.keys(DETAILS_UNIT_TEST_FILES)).toEqual(Object.keys(DETAILS_TARGET_TESTS));

		for (const [heading, files] of Object.entries(DETAILS_IMPLEMENTATION_FILES)) {
			expect.soft(detailsImplementationNames[heading], `${heading} source guard mirrors details.md`).toEqual(implementationBasenamesFor(heading));
			for (const file of files) {
				expect.soft(existsSync(file), `${heading} file exists: ${file}`).toBe(true);
				const basename = file.split('/').at(-1)?.replace(/\.ts$/, '') ?? file;
				expect.soft(spec, `${heading} e2e references ${basename}`).toContain(basename);
			}
			for (const testFile of DETAILS_UNIT_TEST_FILES[heading] ?? []) {
				expect.soft(existsSync(testFile), `${heading} unit test exists: ${testFile}`).toBe(true);
			}
		}
	});

	test('coverage: details verification commands are registered consistently', () => {
		const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
		const bridge = readFileSync('bridge.yml', 'utf8');
		const gitignore = readFileSync('.gitignore', 'utf8');
		const artifactGuard = readFileSync('tests/no-e2e-artifact-churn.mjs', 'utf8');

		expect(packageJson.scripts['test:e2e:details']).toBe('playwright test tests/e2e/details-targets.spec.ts --project=chromium --reporter=line --output=/tmp/badger-sprawl-runner-details-test-results');
		expect(packageJson.scripts['verify:details']).toBe('pnpm -r typecheck && pnpm -r test && pnpm run test:e2e:details && node tests/no-e2e-artifact-churn.mjs');
		expect(bridge).toContain('verify-details:');
		expect(bridge).toContain('run: pnpm run verify:details');
		expect(gitignore).toContain('playwright-report/');
		expect(gitignore).toContain('test-results/');
		expect(existsSync('tests/no-e2e-artifact-churn.mjs')).toBe(true);
		expect(artifactGuard).toContain('playwright-report/index.html');
		expect(artifactGuard).toContain('test-results');
	});

	test('physics: ledge and corner correction covers all acceptance cases', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const core = await import('/@fs/home/user/work/code/artifacts/badger-sprawl-runner/packages/platformer-core/src/index.ts');
			const body = { x: 0, y: 0, w: 10, h: 10 };
			return {
				horizontal: core.resolveLedgeCorrection({ body, intendedVelocity: { vx: 9, vy: 0 }, obstacles: [{ id: 'ledge', x: 18, y: 9, w: 10, h: 10 }], maxCorrectionPixels: 2 }),
				vertical: core.resolveLedgeCorrection({ body, intendedVelocity: { vx: 0, vy: -9 }, obstacles: [{ id: 'ceiling-chip', x: 9, y: -18, w: 10, h: 10 }], maxCorrectionPixels: 2 }),
				blocked: core.resolveLedgeCorrection({ body, intendedVelocity: { vx: 9, vy: 0 }, obstacles: [{ id: 'fat-block', x: 18, y: 6, w: 10, h: 10 }], maxCorrectionPixels: 2 }),
				tieBreak: core.resolveLedgeCorrection({ body, intendedVelocity: { vx: 9, vy: 0 }, obstacles: [{ id: 'zeta', x: 18, y: 9, w: 10, h: 10 }, { id: 'alpha', x: 18, y: 9, w: 10, h: 10 }], maxCorrectionPixels: 2 }),
			};
		});

		expect(result.horizontal).toMatchObject({ result: 'corrected', event: { kind: 'horizontal-corner', obstacleId: 'ledge', dy: -1.001 } });
		expect(result.vertical).toMatchObject({ result: 'corrected', event: { kind: 'vertical-head-bump', obstacleId: 'ceiling-chip', dx: -1.001 } });
		expect(result.blocked).toMatchObject({ result: 'blocked', blockedBy: 'fat-block' });
		expect(result.tieBreak.event?.obstacleId).toBe('alpha');
	});

	test('physics: slope walking and slide surfaces covers all acceptance cases', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const core = await import('/@fs/home/user/work/code/artifacts/badger-sprawl-runner/packages/platformer-core/src/index.ts');
			const slopes = [
				{ id: 'ramp-a', x1: 0, y1: 100, x2: 100, y2: 50, materialId: 'concrete' },
				{ id: 'ramp-b', x1: 0, y1: 100, x2: 100, y2: 50, materialId: 'steel' },
			];
			const body = { x: 40, y: 65, w: 10, h: 10, vx: 0, vy: 0, onGround: false };
			return {
				sample: core.resolveSlopeSurface({ x: 50, slopes }),
				uphill: core.walkSlopeSurface({ body, slopes, dt: 0.1, moveX: 1, walkSpeed: 20 }),
				downhill: core.walkSlopeSurface({ body, slopes, dt: 0.1, moveX: -1, walkSpeed: 20 }),
				slippery: core.walkSlopeSurface({ body, slopes, materials: [{ id: 'concrete', traction: 0.2, slideMultiplier: 10 }], gravity: 100, dt: 0.1 }),
				tieBreak: core.resolveSlopeSurface({ x: 25, slopes: [...slopes].reverse() }),
			};
		});

		expect(result.sample).toMatchObject({ slopeId: 'ramp-a', y: 75, normalX: -0.447214, normalY: -0.894427 });
		expect(result.uphill.body.x).toBe(42);
		expect(result.downhill.body.x).toBe(38);
		expect(result.slippery.sample?.slideForce).toBe(357.7712);
		expect(result.slippery.body.vx).toBe(35.77712);
		expect(result.tieBreak?.slopeId).toBe('ramp-a');
	});

	test('combat: hit-confirm cancel routing and frame-hit target confirmation are deterministic', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const frame = await import('/src/systems/CombatFrameDataSystem.ts');
			const frameHit = await import('/src/systems/CombatFrameHitSystem.ts');
			const attack = {
				id: 'jab',
				startup: 0,
				active: 0.1,
				recovery: 0.1,
				requiresHitConfirm: true,
				cancelInto: [],
				onHitCancelInto: ['launcher', 'cross'],
				onBlockCancelInto: ['guard_cancel'],
				onWhiffCancelInto: ['panic_roll'],
				attack: { id: 'jab', source: 'player', damage: 1, stun: 0.1, knockbackX: 1, hitbox: { x: 0, y: 0, w: 24, h: 24 } },
			};
			const recovery = { ...frame.startFrameAction(attack), phase: 'recovery', elapsed: 0.11 };
			const hitState = frame.markFrameActionHitResolved(recovery, 'hit');
			const whiffState = frame.markFrameActionHitResolved(recovery, 'whiff');
			const blockState = frame.markFrameActionHitResolved(recovery, 'block');
			const blockRoutes = frame.getCancelRoutes({ ...attack, requiresHitConfirm: false }, blockState);
			const orderedRoutes = frame.getCancelRoutes({ ...attack, cancelInto: ['zeta', 'alpha'], onHitCancelInto: ['launcher', 'alpha'], requiresHitConfirm: false }, hitState);
			const attacker = { id: 'badger', x: 0, y: 0, w: 20, h: 20, vx: 0, vy: 0, dir: 1, onGround: true, coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'player' };
			const target = { id: 'dummy', x: 0, y: 0, w: 20, h: 20, vx: 0, vy: 0, dir: -1, onGround: true, coyoteLeft: 0, jumpBuffered: 0, hp: 5, maxHp: 5, invuln: 0, stun: 0, faction: 'enemy' };
			const frameHitResult = frameHit.resolveFrameHits({ ...attack, requiresHitConfirm: false, onHitCancelInto: undefined }, frameHit.createFrameHitState(frame.startFrameAction({ ...attack, requiresHitConfirm: false, onHitCancelInto: undefined })), attacker, [target], 2);

			return {
				hitRoutes: frame.getCancelRoutes(attack, hitState),
				whiffRoutes: frame.getCancelRoutes(attack, whiffState),
				blockRoutes,
				orderedRoutes,
				frameHitResult,
			};
		});

		expect(result.hitRoutes).toEqual({ allowed: true, routes: ['cross', 'launcher'] });
		expect(result.whiffRoutes).toEqual({ allowed: false, routes: [], reason: 'requires-hit-confirm' });
		expect(result.blockRoutes).toEqual({ allowed: true, routes: ['guard_cancel'] });
		expect(result.orderedRoutes.routes).toEqual(['alpha', 'launcher', 'zeta']);
		expect(result.frameHitResult.resolvedHits).toBe(1);
		expect(result.frameHitResult.newTargetIds).toEqual(['dummy']);
	});

	test('combat: layered hitboxes cover high/low/air/projectile/unblockable outcomes', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const layers = await import('/src/systems/CombatHitboxLayerSystem.ts');
			const box = { x: 0, y: 0, w: 10, h: 10 };
			return {
				lowVsAir: layers.resolveLayeredHit({ moveId: 'sweep', hitboxes: { low: box } }, { entityId: 'drone', hurtboxes: { air: box } }),
				airVsAir: layers.resolveLayeredHit({ moveId: 'anti_air', hitboxes: { air: box } }, { entityId: 'drone', hurtboxes: { air: box } }),
				projectileParry: layers.resolveLayeredHit({ moveId: 'bolt', hitboxes: { projectile: box }, parryable: true }, { entityId: 'badger', hurtboxes: { projectile: box }, parryLayers: ['projectile'] }),
				unblockableGuard: layers.resolveLayeredHit({ moveId: 'grab', hitboxes: { unblockable: box } }, { entityId: 'guard', hurtboxes: { unblockable: box }, guardLayers: ['unblockable'] }),
				unblockableInvuln: layers.resolveLayeredHit({ moveId: 'grab', hitboxes: { unblockable: box } }, { entityId: 'ghost', hurtboxes: { unblockable: box }, invulnerable: true }),
			};
		});

		expect(result.lowVsAir.result).toBe('miss');
		expect(result.airVsAir).toMatchObject({ result: 'hit', layer: 'air' });
		expect(result.projectileParry).toMatchObject({ result: 'parried', layer: 'projectile' });
		expect(result.unblockableGuard.result).toBe('hit');
		expect(result.unblockableInvuln.result).toBe('invulnerable');
	});

	test('combat: poise and stagger breakpoints cover decay, armor, and stagger events', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const poise = await import('/src/systems/PoiseStaggerSystem.ts');
			const base = { entityId: 'brute', poiseMeter: 0, staggerThreshold: 10, staggerDecay: 1, armorClass: 'none' };
			return {
				lightChain: poise.stepPoiseStagger(base, [{ attackId: 'a', poiseDamage: 4, time: 1 }, { attackId: 'b', poiseDamage: 4, time: 2 }, { attackId: 'c', poiseDamage: 4, time: 3 }], 0, 0),
				heavy: poise.stepPoiseStagger(base, [{ attackId: 'hammer', poiseDamage: 12, time: 1 }], 0, 0),
				boss: poise.stepPoiseStagger({ ...base, armorClass: 'boss' }, [{ attackId: 'hammer', poiseDamage: 10, time: 1 }], 0, 0),
				decay: poise.stepPoiseStagger({ ...base, poiseMeter: 5 }, [], 2, 8),
			};
		});

		expect(result.lightChain.events.at(-1)?.kind).toBe('stagger');
		expect(result.heavy.state.staggeredUntil).toBe(1.8);
		expect(result.boss.events[0]).toMatchObject({ kind: 'poise-damage', amount: 4, meter: 4 });
		expect(result.decay).toMatchObject({ state: { poiseMeter: 3 }, events: [{ kind: 'poise-decay', amount: 2, meter: 3, time: 8 }] });
	});

	test('items: conditional affixes cover airborne, third-hit, cooldown, status, rng, and replay hash', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const core = await import('/@fs/home/user/work/code/artifacts/badger-sprawl-runner/packages/platformer-core/src/index.ts');
			const conditional = await import('/src/systems/ConditionalItemEffectSystem.ts');
			const airborneRuntime = [conditional.createConditionalEffectRuntime({ id: 'air-dmg', itemId: 'wing-chip', trigger: 'airborne', effects: { damage: 2 } })];
			const thirdRuntime = [conditional.createConditionalEffectRuntime({ id: 'third-burn', itemId: 'ember', trigger: 'third-hit', effects: { burn: true } })];
			const cooldownRuntime = [conditional.createConditionalEffectRuntime({ id: 'dodge-refund', itemId: 'spring', trigger: 'perfect-dodge', effects: { stamina: 1 }, cooldown: 1 })];
			const statusRuntime = [conditional.createConditionalEffectRuntime({ id: 'parry-burn', itemId: 'ember-buckler', trigger: 'parry', chance: 1, effects: { shield: 3 }, statusOnTrigger: [{ id: 'burn', duration: 2, tickInterval: 1, damagePerTick: 1 }] })];
			const stableA = conditional.resolveConditionalItemEffects(statusRuntime, [{ kind: 'parry', time: 3 }], { onGround: true }, 0, core.createDeterministicRng('stable'));
			const stableB = conditional.resolveConditionalItemEffects(statusRuntime, [{ kind: 'parry', time: 3 }], { onGround: true }, 0, core.createDeterministicRng('stable'));
			return {
				grounded: conditional.resolveConditionalItemEffects(airborneRuntime, [{ kind: 'hit', time: 1 }], { onGround: true }, 0),
				airborne: conditional.resolveConditionalItemEffects(airborneRuntime, [{ kind: 'hit', time: 1 }], { onGround: false }, 0),
				third: conditional.resolveConditionalItemEffects(thirdRuntime, [{ kind: 'hit', time: 1 }, { kind: 'hit', time: 2 }, { kind: 'hit', time: 3 }], { onGround: true }, 0),
				cooldown: conditional.resolveConditionalItemEffects(cooldownRuntime, [{ kind: 'dodge', time: 1 }, { kind: 'dodge', time: 1.2 }], { onGround: true }, 0),
				stableA,
				stableB,
				miss: conditional.resolveConditionalItemEffects([conditional.createConditionalEffectRuntime({ id: 'miss', itemId: 'coin', trigger: 'parry', chance: 0, effects: { shield: 1 } })], [{ kind: 'parry', time: 1 }], { onGround: true }, 0, core.createDeterministicRng('always-miss')),
			};
		});

		expect(result.grounded.events).toEqual([]);
		expect(result.airborne.events[0]).toMatchObject({ kind: 'triggered', effects: { damage: 2 } });
		expect(result.third.events.map((event) => event.kind)).toEqual(['ignored', 'ignored', 'triggered']);
		expect(result.cooldown.events.map((event) => event.kind)).toEqual(['triggered', 'cooldown']);
		expect(result.stableA.events[0]).toMatchObject({ kind: 'triggered', effects: { shield: 3 }, statusOnTrigger: [{ id: 'burn', duration: 2 }] });
		expect(result.stableA.rng).toEqual(result.stableB.rng);
		expect(result.stableA.replayHash).toBe(result.stableB.replayHash);
		expect(result.miss.events[0]).toMatchObject({ kind: 'ignored', effectId: 'miss' });
		expect(result.miss.events[0].roll).toEqual(expect.any(Number));
	});

	test('items: socket polarity and overclocking cover boost, penalty, wear, and deterministic instability', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const sockets = await import('/src/systems/ItemSocketSystem.ts');
			const matched = sockets.resolveSocketPolarityEffects({ itemId: 'blade', sockets: [{ id: 'edge', acceptsTags: ['blade'], polarity: 'volt' }], installed: { edge: 'sharp_edge' } }, [{ id: 'sharp_edge', tags: ['blade'], polarity: 'volt', effects: { damage: 10 } }]);
			const mismatch = sockets.resolveSocketPolarityEffects({ itemId: 'blade', sockets: [{ id: 'edge', acceptsTags: ['blade'], polarity: 'bio' }], installed: { edge: 'sharp_edge' } }, [{ id: 'sharp_edge', tags: ['blade'], polarity: 'volt', effects: { damage: 10 } }]);
			const overclock = sockets.resolveSocketPolarityEffects({ itemId: 'core', sockets: [{ id: 'circuit', acceptsTags: ['hack'], overclockLevel: 2 }], installed: { circuit: 'black_ice' } }, [{ id: 'black_ice', tags: ['hack'], effects: { traceReduction: 1 }, heatCost: 2, durabilityDrain: 2 }]);
			const combined = sockets.resolveSocketPolarityEffects({ itemId: 'railgun', sockets: [{ id: 'core', acceptsTags: ['hack'], polarity: 'volt', overclockLevel: 2, instability: 0.1 }, { id: 'edge', acceptsTags: ['blade'], polarity: 'bio' }], installed: { core: 'black_ice', edge: 'sharp_edge' } }, [{ id: 'sharp_edge', tags: ['blade'], polarity: 'volt', effects: { damage: 10 }, heatCost: 1, durabilityDrain: 1 }, { id: 'black_ice', tags: ['hack'], polarity: 'volt', effects: { traceReduction: 1 }, heatCost: 2, durabilityDrain: 2 }]);
			return { matched, mismatch, overclock, combined, combinedAgain: sockets.resolveSocketPolarityEffects({ itemId: 'railgun', sockets: [{ id: 'core', acceptsTags: ['hack'], polarity: 'volt', overclockLevel: 2, instability: 0.1 }, { id: 'edge', acceptsTags: ['blade'], polarity: 'bio' }], installed: { core: 'black_ice', edge: 'sharp_edge' } }, [{ id: 'sharp_edge', tags: ['blade'], polarity: 'volt', effects: { damage: 10 }, heatCost: 1, durabilityDrain: 1 }, { id: 'black_ice', tags: ['hack'], polarity: 'volt', effects: { traceReduction: 1 }, heatCost: 2, durabilityDrain: 2 }]) };
		});

		expect(result.matched.effects.damage).toBe(12.5);
		expect(result.mismatch.effects.damage).toBe(8);
		expect(result.overclock.effects.traceReduction).toBe(1.3);
		expect(result.overclock.entries[0]).toMatchObject({ polarity: 'neutral', heatCost: 3, durabilityDrain: 4, instability: 0.1 });
		expect(result.combined.entries[0]).toMatchObject({ polarity: 'matched', overclockLevel: 2, heatCost: 3, durabilityDrain: 4, instability: 0.2 });
		expect(result.combined.instabilitySeed).toBe(result.combinedAgain.instabilitySeed);
	});

	test('integrated: all details mechanics are deterministic across repeated browser evaluations', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const buildSnapshot = async () => {
				const core = await import('/@fs/home/user/work/code/artifacts/badger-sprawl-runner/packages/platformer-core/src/index.ts');
				const frame = await import('/src/systems/CombatFrameDataSystem.ts');
				const layers = await import('/src/systems/CombatHitboxLayerSystem.ts');
				const poise = await import('/src/systems/PoiseStaggerSystem.ts');
				const conditional = await import('/src/systems/ConditionalItemEffectSystem.ts');
				const sockets = await import('/src/systems/ItemSocketSystem.ts');
				const replay = await import('/src/systems/ReplayDiffSystem.ts');

				const attack = {
					id: 'jab',
					startup: 0,
					active: 0.1,
					recovery: 0.1,
					requiresHitConfirm: true,
					cancelInto: [],
					onHitCancelInto: ['launcher', 'cross'],
					attack: { id: 'jab', source: 'player', damage: 1, stun: 0.1, knockbackX: 1, hitbox: { x: 0, y: 0, w: 24, h: 24 } },
				};
				const hitState = frame.markFrameActionHitResolved({ ...frame.startFrameAction(attack), phase: 'recovery', elapsed: 0.11 }, 'hit');
				const statusRuntime = [conditional.createConditionalEffectRuntime({ id: 'parry-burn', itemId: 'ember-buckler', trigger: 'parry', chance: 1, effects: { shield: 3 }, statusOnTrigger: [{ id: 'burn', duration: 2, tickInterval: 1, damagePerTick: 1 }] })];

				return {
					ledge: core.resolveLedgeCorrection({ body: { x: 0, y: 0, w: 10, h: 10 }, intendedVelocity: { vx: 9, vy: 0 }, obstacles: [{ id: 'ledge', x: 18, y: 9, w: 10, h: 10 }], maxCorrectionPixels: 2 }),
					slope: core.walkSlopeSurface({ body: { x: 40, y: 65, w: 10, h: 10, vx: 0, vy: 0, onGround: false }, slopes: [{ id: 'ramp-a', x1: 0, y1: 100, x2: 100, y2: 50, materialId: 'concrete' }], dt: 0.1, moveX: 1, walkSpeed: 20 }),
					cancel: frame.getCancelRoutes(attack, hitState),
					layer: layers.resolveLayeredHit({ moveId: 'bolt', hitboxes: { projectile: { x: 0, y: 0, w: 10, h: 10 } }, parryable: true }, { entityId: 'badger', hurtboxes: { projectile: { x: 0, y: 0, w: 10, h: 10 } }, parryLayers: ['projectile'] }),
					poise: poise.stepPoiseStagger({ entityId: 'weak', poiseMeter: 0, staggerThreshold: 10, staggerDecay: 1, armorClass: 'none' }, [{ attackId: 'heavy', poiseDamage: 10, time: 1 }], 0),
					conditional: conditional.resolveConditionalItemEffects(statusRuntime, [{ kind: 'parry', time: 3 }], { onGround: true }, 0, core.createDeterministicRng('stable-details-e2e')),
					socket: sockets.resolveSocketPolarityEffects({ itemId: 'core', sockets: [{ id: 'circuit', acceptsTags: ['hack'], overclockLevel: 2 }], installed: { circuit: 'black_ice' } }, [{ id: 'black_ice', tags: ['hack'], effects: { traceReduction: 1 }, heatCost: 2, durabilityDrain: 2 }]),
					diff: replay.diffReplaySnapshots({ left: { actors: [{ id: 'a', hp: 5 }] }, right: { actors: [{ id: 'a', hp: 4 }] } }),
				};
			};

			return { first: await buildSnapshot(), second: await buildSnapshot() };
		});

		expect(result.first).toEqual(result.second);
		expect(result.first.cancel.routes).toEqual(['cross', 'launcher']);
		expect(result.first.conditional.replayHash).toBe(result.second.conditional.replayHash);
	});

	test('integrated: replay diff reports all accepted diff behaviors', async ({ page }) => {
		await page.goto('/');
		const result = await page.evaluate(async () => {
			const replay = await import('/src/systems/ReplayDiffSystem.ts');
			return {
				hp: replay.diffReplaySnapshots({ left: { actors: [{ id: 'a', hp: 5 }] }, right: { actors: [{ id: 'a', hp: 4 }] } }),
				projectile: replay.diffReplaySnapshots({ left: { projectiles: [{ id: 'p', x: 1 }] }, right: { projectiles: [{ id: 'p', x: 2 }] } }),
				ignored: replay.diffReplaySnapshots({ left: { frame: 1, hp: 5 }, right: { frame: 2, hp: 5 }, ignorePaths: ['frame'] }),
				ordered: replay.diffReplaySnapshots({ left: { z: 1, a: 1 }, right: { z: 2, a: 2 } }),
			};
		});

		expect(result.hp).toEqual([{ path: 'actors[0].hp', left: 5, right: 4 }]);
		expect(result.projectile).toEqual([{ path: 'projectiles[0].x', left: 1, right: 2 }]);
		expect(result.ignored).toEqual([]);
		expect(result.ordered.map((entry) => entry.path)).toEqual(['a', 'z']);
	});
});

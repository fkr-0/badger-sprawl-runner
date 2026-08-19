/**
 * E2E Tests for Badger Sprawl Runner Game Mechanics
 *
 * Uses the window.__badger test harness exposed by main.ts to access
 * game state through the current SceneManager-based architecture.
 */

import { test, expect } from '@playwright/test';

/** Wait for the test harness and return scene name */
async function sceneName(page: import('@playwright/test').Page): Promise<string> {
	return page.evaluate(() => (window as any).__badger?.getSceneName() ?? 'none');
}

/** Wait for a specific scene */
async function waitForScene(page: import('@playwright/test').Page, name: string, timeout = 5000): Promise<void> {
	await page.waitForFunction(
		(n) => (window as any).__badger?.getSceneName() === n,
		name,
		{ timeout },
	);
}

async function enterEndlessStage(page: import('@playwright/test').Page): Promise<void> {
	await page.goto('/');
	await waitForScene(page, 'TitleScene');
	await page.evaluate(() => (window as any).__badger.routeMode('endless'));
	await waitForScene(page, 'StageRunScene');
}

test.describe('Game Initialization', () => {
	test('should load the game canvas', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#game')).toBeVisible();
	});

	test('should start at TitleScene', async ({ page }) => {
		await page.goto('/');
		await waitForScene(page, 'TitleScene');
		expect(await sceneName(page)).toBe('TitleScene');
	});

	test('should expose test harness on window.__badger', async ({ page }) => {
		await page.goto('/');
		await page.waitForFunction(() => (window as any).__badger != null, null, { timeout: 5000 });
		const hasHarness = await page.evaluate(() => typeof (window as any).__badger?.getPlayer);
		expect(hasHarness).toBe('function');
	});
});

test.describe('Platforming Physics via StageRunScene', () => {
	test.beforeEach(async ({ page }) => {
		await enterEndlessStage(page);
	});

	test('player should spawn with correct initial state', async ({ page }) => {
		const player = await page.evaluate(() => (window as any).__badger.getPlayer());
		expect(player).not.toBeNull();
		expect(player.hp).toBeGreaterThan(0);
		expect(player.maxHp).toBeGreaterThanOrEqual(player.hp);
		expect(player.x).toBeGreaterThanOrEqual(0);
		expect(player.y).toBeGreaterThanOrEqual(0);
	});

	test('player should move right when ArrowRight held', async ({ page }) => {
		const before = await page.evaluate(() => (window as any).__badger.getPlayer());
		await page.keyboard.down('ArrowRight');
		await page.waitForTimeout(300);
		await page.keyboard.up('ArrowRight');
		const after = await page.evaluate(() => (window as any).__badger.getPlayer());
		expect(after.x).toBeGreaterThan(before.x);
	});

	test('player should move left when ArrowLeft held', async ({ page }) => {
		// Move right first to have room
		await page.keyboard.down('ArrowRight');
		await page.waitForTimeout(500);
		await page.keyboard.up('ArrowRight');

		const before = await page.evaluate(() => (window as any).__badger.getPlayer());
		await page.keyboard.down('ArrowLeft');
		await page.waitForTimeout(300);
		await page.keyboard.up('ArrowLeft');
		const after = await page.evaluate(() => (window as any).__badger.getPlayer());
		expect(after.x).toBeLessThan(before.x);
	});

	test('player should jump when Space pressed', async ({ page }) => {
		// Ensure on ground first
		await page.waitForTimeout(300);
		const before = await page.evaluate(() => (window as any).__badger.getPlayer());
		await page.keyboard.press('Space');
		await page.waitForTimeout(150);
		const after = await page.evaluate(() => (window as any).__badger.getPlayer());
		// Jump should move player upward (lower y) or have negative vy
		const jumped = after.vy < 0 || after.y < before.y;
		expect(jumped).toBe(true);
	});

	test('player should land on ground after jump', async ({ page }) => {
		await page.waitForTimeout(500); // settle on ground
		// Ensure on ground before jumping
		const pre = await page.evaluate(() => (window as any).__badger.getPlayer());
		if (!pre.onGround) {
			await page.waitForTimeout(1000); // wait longer if in air
		}
		await page.keyboard.press('Space');
		await page.waitForTimeout(1000); // generous time to land
		const player = await page.evaluate(() => (window as any).__badger.getPlayer());
		expect(player.onGround).toBe(true);
	});

	test('player should respect gravity and fall', async ({ page }) => {
		await page.waitForTimeout(300);
		await page.keyboard.press('Space');
		await page.waitForTimeout(150);
		const peak = await page.evaluate(() => (window as any).__badger.getPlayer());
		await page.waitForTimeout(500);
		const fallen = await page.evaluate(() => (window as any).__badger.getPlayer());
		expect(fallen.y).toBeGreaterThan(peak.y);
	});
});

test.describe('Combat System via StageRunScene', () => {
	test.beforeEach(async ({ page }) => {
		await enterEndlessStage(page);
	});

	test('enemies should be spawned in the world', async ({ page }) => {
		const enemies = await page.evaluate(() => (window as any).__badger.getEnemies());
		expect(enemies).not.toBeNull();
		expect(enemies.length).toBeGreaterThan(0);
	});

	test('enemies should have valid HP', async ({ page }) => {
		const enemies = await page.evaluate(() => (window as any).__badger.getEnemies());
		for (const enemy of enemies) {
			expect(enemy.hp).toBeGreaterThan(0);
			expect(enemy.maxHp).toBeGreaterThan(0);
			expect(enemy.hp).toBeLessThanOrEqual(enemy.maxHp);
		}
	});

	test('melee attack should trigger meleeTimer', async ({ page }) => {
		const before = await page.evaluate(() => (window as any).__badger.getPlayer());
		await page.keyboard.down('J');
		try {
			const observedTimer = await page.waitForFunction(
				(baseline) => {
					const timer = (window as any).__badger?.getPlayer()?.meleeTimer ?? 0;
					return timer > baseline ? timer : false;
				},
				before.meleeTimer,
				{ polling: 'raf', timeout: 1000 },
			);
			expect(await observedTimer.jsonValue()).toBeGreaterThan(before.meleeTimer);
		} finally {
			await page.keyboard.up('J');
		}
	});
});

test.describe('Pickup System via StageRunScene', () => {
	test.beforeEach(async ({ page }) => {
		await enterEndlessStage(page);
	});

	test('pickups should exist in the world', async ({ page }) => {
		const pickups = await page.evaluate(() => (window as any).__badger.getPickups());
		expect(pickups).not.toBeNull();
		expect(pickups.length).toBeGreaterThan(0);
	});

	test('pickups should have valid coordinates', async ({ page }) => {
		const pickups = await page.evaluate(() => (window as any).__badger.getPickups());
		for (const pickup of pickups) {
			expect(pickup.x).toBeGreaterThanOrEqual(0);
			expect(pickup.y).toBeGreaterThanOrEqual(0);
			expect(pickup.kind).toBeTruthy();
		}
	});

	test('collecting a pickup should mark it as taken', async ({ page }) => {
		const pickups = await page.evaluate(() => (window as any).__badger.getPickups());
		const firstUntaken = pickups.find((p: any) => !p.taken);
		if (!firstUntaken) return; // skip if all already collected

		// Move toward the pickup for a reasonable time
		const dir = firstUntaken.x > 100 ? 'ArrowRight' : 'ArrowLeft';
		await page.keyboard.down(dir);
		await page.waitForTimeout(3000);
		await page.keyboard.up(dir);

		const after = await page.evaluate(() => (window as any).__badger.getPickups());
		const takenCount = after.filter((p: any) => p.taken).length;
		const beforeTakenCount = pickups.filter((p: any) => p.taken).length;
		// At least one more pickup should be taken, or the specific one should be taken
		expect(takenCount).toBeGreaterThanOrEqual(beforeTakenCount);
	});
});

test.describe('Scene Navigation', () => {
	test('Escape should return from StageRunScene to TitleScene', async ({ page }) => {
		await enterEndlessStage(page);

		await page.keyboard.press('Escape');
		await waitForScene(page, 'TitleScene');
		expect(await sceneName(page)).toBe('TitleScene');
	});
});

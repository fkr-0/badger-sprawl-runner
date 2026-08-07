/**
 * E2E Tests for Sprite Usage Validation
 *
 * Validates that sprites defined in data/sprites.json:
 * - Have files present in public directory
 * - Have correct metadata (sourceImageNo for DALL-E sprites)
 * - Game loads without errors when accessing sprites
 */

import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Load the sprite manifest from the public directory */
function loadManifest(): Record<string, unknown> {
	const manifestPath = join(__dirname, '../../apps/runner/public/data/sprites.json');
	return JSON.parse(readFileSync(manifestPath, 'utf-8'));
}

/** Wait for the test harness */
async function waitForHarness(page: import('@playwright/test').Page): Promise<void> {
	await page.waitForFunction(() => (window as any).__badger != null, null, { timeout: 10000 });
}

/** Wait for a specific scene */
async function waitForScene(page: import('@playwright/test').Page, name: string, timeout = 5000): Promise<void> {
	await page.waitForFunction(
		(n) => (window as any).__badger?.getSceneName() === n,
		name,
		{ timeout },
	);
}

test.describe('Game Loads With Sprite System', () => {
	test('should initialize and expose test harness', async ({ page }) => {
		await page.goto('/');
		await waitForHarness(page);
		await waitForScene(page, 'TitleScene');

		const hasHarness = await page.evaluate(() => {
			const h = (window as any).__badger;
			return {
				getSceneName: typeof h.getSceneName === 'function',
				getPlayer: typeof h.getPlayer === 'function',
			};
		});

		expect(hasHarness.getSceneName).toBe(true);
		expect(hasHarness.getPlayer).toBe(true);
	});

	test('should navigate to StageRunScene without errors', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (err) => errors.push(err.message));

		await page.goto('/');
		await waitForHarness(page);
		await waitForScene(page, 'TitleScene');

		// Enter Endless mode without coupling sprite coverage to title-menu ordering.
		await page.evaluate(() => (window as any).__badger?.routeMode('endless'));
		await waitForScene(page, 'StageRunScene');

		// Wait a moment for sprites to load
		await page.waitForTimeout(2000);

		// Verify no critical errors
		const criticalErrors = errors.filter((e) => !e.includes('404') && !e.includes('favicon'));
		expect(criticalErrors).toHaveLength(0);
	});
});

test.describe('Sprite Manifest Integrity', () => {
	const manifest = loadManifest();

	test('manifest should have correct structure', () => {
		expect(manifest.schemaVersion).toBe(1);
		expect(Array.isArray((manifest as any).spriteSheets)).toBe(true);
	});

	test('all sprite sheet files should exist in public directory', async () => {
		const sheets = (manifest as any).spriteSheets as Array<{
			id: string;
			file: string;
			frameSize: [number, number];
			source?: { classification?: string };
		}>;

		for (const sheet of sheets) {
			if (sheet.source?.classification === 'archival') continue;
			const filePath = join(__dirname, '../../apps/runner/public', sheet.file);
			let exists = false;
			try {
				const stat = statSync(filePath);
				exists = stat.size > 0;
			} catch {
				exists = false;
			}
			expect(exists, `Sprite sheet ${sheet.id} (${sheet.file}) should exist`).toBe(true);
		}
	});

	test('DALL-E sprites should have sourceImageNo metadata', async () => {
		const sheets = (manifest as any).spriteSheets as Array<{
			id: string;
			sourceImageNo?: number | number[];
		}>;

		const dalleSheets = sheets.filter((s) => s.sourceImageNo !== undefined);
		expect(dalleSheets.length).toBeGreaterThan(0);

		// Check specific DALL-E sprites
		const sheetMap = new Map(sheets.map((s) => [s.id, s]));
		expect(sheetMap.get('boss_boss_captain_grin_tollmech')?.sourceImageNo).toBe(29);
		expect(sheetMap.get('enemy_clinic_repo')?.sourceImageNo).toBe(12);
		expect(sheetMap.get('character_dr_mina_suture')?.sourceImageNo).toBe(76);
		expect(sheetMap.get('lower_sprawl_parallax')?.sourceImageNo).toBe(75);
	});

	test('all required sprite categories should be present', async () => {
		const sheets = (manifest as any).spriteSheets as Array<{ id: string }>;
		const ids = sheets.map((s) => s.id);

		// Core sprites
		expect(ids).toContain('moss_badger');
		expect(ids).toContain('items_core');
		expect(ids).toContain('item_icons');

		// Boss sprites
		expect(ids).toContain('boss_boss_captain_grin_tollmech');
		expect(ids).toContain('boss_boss_knife_drone_nest');

		// Enemy sprites
		expect(ids).toContain('enemy_clinic_repo');
		expect(ids).toContain('enemy_mirror_sentinel');

		// Character sprites
		expect(ids).toContain('character_dr_mina_suture');
		expect(ids).toContain('character_juno_jar');

		// Parallax sprites
		expect(ids).toContain('lower_sprawl_parallax');
		expect(ids).toContain('chrome_arcology_parallax');
	});
});

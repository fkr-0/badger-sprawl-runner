import { expect, test, type Page } from '@playwright/test';
import { GAMEPLAY_HUD_WORLD_OVERLAY_TOP } from '../../apps/runner/src/renderer/GameplayHudLayout';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface UiWindow extends Window {
	__badger: BadgerTestHarness;
}

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

function overlaps(a: Rect, b: Rect): boolean {
	return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

async function enterTraining(page: Page): Promise<void> {
	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as UiWindow).__badger));
	await page.evaluate(() => (window as UiWindow).__badger.routeMode('training'));
	await expect
		.poll(() => page.evaluate(() => (window as UiWindow).__badger.getTraining()))
		.not.toBeNull();
}

test.describe('Gameplay UI release contract', () => {
	test('uses the internal canvas as the layout source and preserves a uniform display scale', async ({ page }) => {
		await enterTraining(page);
		const canvas = await page.locator('#game').evaluate((element: HTMLCanvasElement) => {
			const rect = element.getBoundingClientRect();
			return {
				internalWidth: element.width,
				internalHeight: element.height,
				cssWidth: rect.width,
				cssHeight: rect.height,
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight,
			};
		});

		expect(canvas.internalWidth).toBeGreaterThan(0);
		expect(canvas.internalHeight).toBeGreaterThan(0);
		expect(canvas.cssWidth).toBeLessThanOrEqual(canvas.viewportWidth + 0.5);
		expect(canvas.cssHeight).toBeLessThanOrEqual(canvas.viewportHeight + 0.5);
		expect(canvas.cssWidth / canvas.internalWidth).toBeCloseTo(
			canvas.cssHeight / canvas.internalHeight,
			3
		);
		expect(canvas.internalWidth / canvas.internalHeight).toBeCloseTo(16 / 9, 5);
	});

	test('keeps every gameplay panel in bounds without top-row or footer collisions', async ({ page }) => {
		await enterTraining(page);
		await page.keyboard.press('Digit4');
		const { layout, canvas } = await page.evaluate(() => {
			const element = document.querySelector<HTMLCanvasElement>('#game');
			return {
				layout: (window as UiWindow).__badger.getGameplayHudLayout(),
				canvas: { width: element?.width ?? 0, height: element?.height ?? 0 },
			};
		});
		expect(layout).not.toBeNull();
		if (!layout) return;

		for (const rect of Object.values(layout)) {
			expect(rect.x).toBeGreaterThanOrEqual(0);
			expect(rect.y).toBeGreaterThanOrEqual(0);
			expect(rect.x + rect.width).toBeLessThanOrEqual(canvas.width);
			expect(rect.y + rect.height).toBeLessThanOrEqual(canvas.height);
		}
		expect(overlaps(layout.vitals, layout.companions)).toBe(false);
		expect(overlaps(layout.companions, layout.objective)).toBe(false);
		expect(overlaps(layout.vitals, layout.objective)).toBe(false);
		expect(overlaps(layout.combat, layout.vitals)).toBe(false);
		expect(overlaps(layout.combat, layout.companions)).toBe(false);
		expect(overlaps(layout.combat, layout.objective)).toBe(false);
		expect(overlaps(layout.gear, layout.context)).toBe(false);
		expect(layout.combat.y + layout.combat.height).toBeLessThanOrEqual(
			GAMEPLAY_HUD_WORLD_OVERLAY_TOP
		);
	});

	test('keeps the authored player and boss scale within the release readability band', async ({ page }) => {
		await enterTraining(page);
		await expect
			.poll(() => page.evaluate(() => (window as UiWindow).__badger.hasSheet('moss_badger_production')))
			.toBe(true);
		const contract = await page.evaluate(() =>
			(window as UiWindow).__badger.getActorRenderContract()
		);
		expect(contract).toMatchObject({ playerFrameWidth: 48, playerFrameHeight: 48, bossTargetHeight: 78 });
		expect(contract.bossToPlayerHeightRatio).toBeGreaterThanOrEqual(1.4);
		expect(contract.bossToPlayerHeightRatio).toBeLessThanOrEqual(1.75);
	});
});

import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface SpriteReviewSnapshot {
	sheetIds: string[];
	entryCount: number;
	width: number;
	height: number;
	labels: string[];
}

interface VisualReviewWindow extends Window {
	__badger: BadgerTestHarness;
	__spriteReview?: SpriteReviewSnapshot;
}

const REVIEW_DIR = join(process.cwd(), 'generated', 'sprite-visual-review');
const SELECTED_SHEETS = [
	'moss_badger',
	'enemy_turnstile_mite',
	'enemy_rent_cop_piker',
	'enemy_masque_duelist',
	'enemy_signal_jammer_bat',
	'boss_boss_black_ice_fox_node',
	'boss_boss_elevator_angel_counterweight',
	'boss_boss_director_vane_skylock',
];

async function captureRecord(file: string): Promise<{ file: string; bytes: number; sha256: string }> {
	const bytes = await readFile(join(REVIEW_DIR, file));
	return {
		file,
		bytes: bytes.byteLength,
		sha256: createHash('sha256').update(bytes).digest('hex'),
	};
}

function spriteReviewUrl(): string {
	const params = new URLSearchParams();
	params.set('frames', '3');
	params.set('sheet', SELECTED_SHEETS.join(','));
	return `/sprite-review.html?${params.toString()}`;
}

test('produces a deterministic sprite contact sheet and training-scene capture', async ({
	page,
	browserName,
}) => {
	test.skip(browserName !== 'chromium', 'visual review PNGs are produced once with Chromium');
	await mkdir(REVIEW_DIR, { recursive: true });

	// Use the real same-origin sprite review application rather than injecting a
	// blob: module. This keeps the E2E path compatible with the production CSP
	// while exercising the runtime functions bundled by Vite.
	await page.goto(spriteReviewUrl());
	await page.waitForFunction(() => document.body.dataset.status === 'ready');
	const review = await page.evaluate(() => (window as VisualReviewWindow).__spriteReview ?? null);
	if (!review) throw new Error('sprite review application did not publish its snapshot');

	expect(review.sheetIds).toEqual(SELECTED_SHEETS);
	expect(review.entryCount).toBeGreaterThanOrEqual(32);
	expect(review.width).toBeGreaterThan(1_000);
	expect(review.height).toBeGreaterThan(700);
	expect(review.labels.length).toBe(review.entryCount);

	const contactSheet = page.locator<HTMLCanvasElement>('#review');
	await expect(contactSheet).toBeVisible();
	const contactSheetDataUrl = await contactSheet.evaluate((canvas) => canvas.toDataURL('image/png'));
	const encodedContactSheet = contactSheetDataUrl.split(',', 2)[1];
	if (!encodedContactSheet) throw new Error('contact-sheet canvas did not contain PNG data');
	await writeFile(
		join(REVIEW_DIR, 'badger-sprite-contact-sheet.png'),
		Buffer.from(encodedContactSheet, 'base64')
	);

	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as Partial<VisualReviewWindow>).__badger));
	await page.evaluate(() => (window as VisualReviewWindow).__badger.routeMode('training'));
	await expect
		.poll(() => page.evaluate(() => (window as VisualReviewWindow).__badger.getTraining()))
		.not.toBeNull();
	const training = await page.evaluate(() => (window as VisualReviewWindow).__badger.getTraining());
	await page.waitForTimeout(250);
	const canvas = page.locator('canvas').first();
	await expect(canvas).toBeVisible();
	await canvas.screenshot({ path: join(REVIEW_DIR, 'badger-training-scene.png') });

	const captures = await Promise.all([
		captureRecord('badger-sprite-contact-sheet.png'),
		captureRecord('badger-training-scene.png'),
	]);
	await writeFile(
		join(REVIEW_DIR, 'index.json'),
		`${JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				renderer: '@arcade/runtime drawArcadeSpriteContactSheetCanvas + live StageRunScene',
				contactSheet: {
					selectedSheets: SELECTED_SHEETS,
					entryCount: review.entryCount,
					width: review.width,
					height: review.height,
				},
				training: {
					stageId: training?.stageId ?? null,
					dummyPresetId: training?.dummyPresetId ?? null,
				},
				captures,
			},
			null,
			2
		)}\n`
	);
});

import { expect, type Page, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BadgerTestHarness } from '../../apps/runner/src/main';

interface VisualReviewWindow extends Window {
	__badger: BadgerTestHarness;
	__arcadeSpriteReview?: {
		createArcadeSpriteContactSheetLayout: (...args: unknown[]) => unknown;
		drawArcadeSpriteContactSheetCanvas: (...args: unknown[]) => unknown;
		resolveArcadeSpriteFrame: (...args: unknown[]) => unknown;
	};
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

async function installSpriteReviewRuntime(page: Page): Promise<void> {
	const source = await readFile(join(process.cwd(), 'vendor', 'arcade-runtime.mjs'), 'utf8');
	await page.evaluate(async (runtimeSource) => {
		const url = URL.createObjectURL(new Blob([runtimeSource], { type: 'text/javascript' }));
		try {
			const runtime = await import(/* @vite-ignore */ url);
			(window as VisualReviewWindow).__arcadeSpriteReview = {
				createArcadeSpriteContactSheetLayout: runtime.createArcadeSpriteContactSheetLayout,
				drawArcadeSpriteContactSheetCanvas: runtime.drawArcadeSpriteContactSheetCanvas,
				resolveArcadeSpriteFrame: runtime.resolveArcadeSpriteFrame,
			};
		} finally {
			URL.revokeObjectURL(url);
		}
	}, source);
	await page.waitForFunction(() => Boolean((window as VisualReviewWindow).__arcadeSpriteReview));
}

test('produces a deterministic sprite contact sheet and training-scene capture', async ({
	page,
	browserName,
}) => {
	test.skip(browserName !== 'chromium', 'visual review PNGs are produced once with Chromium');
	await mkdir(REVIEW_DIR, { recursive: true });
	await page.goto('/');
	await page.waitForFunction(() => Boolean((window as Partial<VisualReviewWindow>).__badger));
	await installSpriteReviewRuntime(page);

	const review = await page.evaluate(async ({ selectedSheets }) => {
		const runtime = (window as VisualReviewWindow).__arcadeSpriteReview;
		if (!runtime) throw new Error('sprite review runtime was not installed');
		const response = await fetch('data/sprites.json');
		if (!response.ok) throw new Error(`sprite manifest fetch failed: ${response.status}`);
		const manifest = (await response.json()) as {
			spriteSheets: Array<{
				id: string;
				file: string;
				animations: Record<string, { frames: number }>;
			}>;
		};
		const preferredAnimations = ['idle', 'run', 'attack', 'hurt', 'special', 'phase_1'];
		const entries: Array<{ image: HTMLImageElement; frame: unknown; label: string }> = [];
		const missing: string[] = [];
		for (const sheetId of selectedSheets) {
			const sheet = manifest.spriteSheets.find((candidate) => candidate.id === sheetId);
			if (!sheet) {
				missing.push(sheetId);
				continue;
			}
			const image = new Image();
			image.src = sheet.file;
			await image.decode();
			const animationNames = [
				...preferredAnimations.filter((name) => sheet.animations[name]),
				...Object.keys(sheet.animations),
			].filter((name, index, names) => names.indexOf(name) === index).slice(0, 2);
			for (const animationName of animationNames) {
				const animation = sheet.animations[animationName];
				const indexes = [0, Math.floor((animation.frames - 1) / 2), animation.frames - 1]
					.filter((value, index, values) => values.indexOf(value) === index);
				for (const frameIndex of indexes) {
					const frame = runtime.resolveArcadeSpriteFrame(sheet, animationName, frameIndex);
					if (!frame) throw new Error(`${sheetId}:${animationName}:${frameIndex} did not resolve`);
					entries.push({
						image,
						frame,
						label: `${sheetId} · ${animationName} ${frameIndex + 1}/${animation.frames}`,
					});
				}
			}
		}
		const canvas = document.createElement('canvas');
		canvas.id = 'sprite-visual-review';
		canvas.style.imageRendering = 'pixelated';
		canvas.style.display = 'block';
		document.body.replaceChildren(canvas);
		const context = canvas.getContext('2d');
		if (!context) throw new Error('review canvas context unavailable');
		const result = runtime.drawArcadeSpriteContactSheetCanvas(context, entries, {
			columns: 6,
			cellWidth: 190,
			cellHeight: 180,
			gap: 10,
			padding: 12,
			labelHeight: 32,
			contentPadding: 10,
			resizeCanvas: true,
			imageSmoothingEnabled: false,
			showPivot: true,
		});
		canvas.style.width = `${canvas.width}px`;
		canvas.style.height = `${canvas.height}px`;
		return {
			entryCount: entries.length,
			missing,
			width: canvas.width,
			height: canvas.height,
			renderedCount: (result as { rendered: unknown[] }).rendered.length,
		};
	}, { selectedSheets: SELECTED_SHEETS });

	expect(review.missing).toEqual([]);
	expect(review.entryCount).toBeGreaterThanOrEqual(32);
	expect(review.renderedCount).toBe(review.entryCount);
	expect(review.width).toBeGreaterThan(1_000);
	expect(review.height).toBeGreaterThan(700);
	const contactSheetDataUrl = await page
		.locator<HTMLCanvasElement>('#sprite-visual-review')
		.evaluate((canvas) => canvas.toDataURL('image/png'));
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

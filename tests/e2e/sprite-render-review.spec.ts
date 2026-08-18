import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const OUTPUT_DIRECTORY = join(process.cwd(), 'generated', 'visual-review', 'sprites');
const REVIEW_SHEETS = [
	'moss_badger_production',
	'enemy_turnstile_mite',
	'enemy_rent_cop_piker',
	'enemy_masque_duelist',
	'boss_boss_king_feedback_ampthrone',
	'boss_boss_black_ice_fox_node',
	'boss_boss_elevator_angel_counterweight',
	'boss_boss_director_vane_skylock',
] as const;

interface ReviewRecord {
	sheetId: string;
	file: string;
	sha256: string;
	bytes: number;
	entryCount: number;
	width: number;
	height: number;
}

const records: ReviewRecord[] = [];

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
	await mkdir(OUTPUT_DIRECTORY, { recursive: true });
});

for (const sheetId of REVIEW_SHEETS) {
	test(`renders shared-runtime review sheet for ${sheetId}`, async ({ page }) => {
		await page.goto(`/sprite-review.html?sheet=${encodeURIComponent(sheetId)}&frames=4`);
		await page.locator('body[data-status="ready"], body[data-status="error"]').waitFor();
		const status = await page.locator('body').getAttribute('data-status');
		if (status === 'error') {
			throw new Error(await page.locator('#error').innerText());
		}

		const snapshot = await page.evaluate(() => window.__spriteReview);
		const inspector = await page.evaluate(() => window.__spriteInspector);
		expect(snapshot).toBeTruthy();
		expect(snapshot?.sheetIds).toEqual([sheetId]);
		expect(snapshot?.entryCount ?? 0).toBeGreaterThan(0);
		expect(snapshot?.width ?? 0).toBeGreaterThan(100);
		expect(snapshot?.height ?? 0).toBeGreaterThan(100);
		expect(snapshot?.labels.some((label) => label.includes('idle'))).toBe(true);
		expect(inspector).toMatchObject({
			sheetId,
			atlasOk: true,
		});
		expect(inspector?.timelineFrames ?? 0).toBeGreaterThan(0);
		expect(inspector?.sourceRect[2] ?? 0).toBeGreaterThan(0);
		expect(page.locator('#sheet-select')).toHaveValue(sheetId);
		expect(page.locator('#inspector-preview')).toBeVisible();

		const filename = `${sheetId}.png`;
		const outputPath = join(OUTPUT_DIRECTORY, filename);
		if (sheetId === 'moss_badger_production') {
			await page.locator('#sheet-select').selectOption('enemy_turnstile_mite');
			await expect
				.poll(() => page.evaluate(() => window.__spriteInspector?.sheetId))
				.toBe('enemy_turnstile_mite');
			expect(new URL(page.url()).searchParams.get('inspect')).toBe('enemy_turnstile_mite');
			await page.locator('#sheet-select').selectOption(sheetId);
			await expect
				.poll(() => page.evaluate(() => window.__spriteInspector?.sheetId))
				.toBe(sheetId);
			await page.locator('#play-toggle').click();
			await expect.poll(() => page.evaluate(() => window.__spriteInspector?.paused)).toBe(true);
			await page.locator('#mode-select').selectOption('pingpong');
			await page.locator('#timeline-input').evaluate((element) => {
				const input = element as HTMLInputElement;
				input.value = '750';
				input.dispatchEvent(new Event('input', { bubbles: true }));
			});
			await expect
				.poll(() => page.evaluate(() => window.__spriteInspector))
				.toMatchObject({ mode: 'pingpong', paused: true, direction: -1 });
			await page.locator('#next-frame').click();
			await expect
				.poll(() => page.evaluate(() => window.__spriteInspector?.paused))
				.toBe(true);
			await expect(page.locator('#review')).toHaveScreenshot('moss-badger-production.png', {
				animations: 'disabled',
				caret: 'hide',
				maxDiffPixelRatio: 0.01,
			});
		}
		await page.locator('#review').screenshot({ path: outputPath });
		const bytes = await readFile(outputPath);
		expect(bytes.byteLength).toBeGreaterThan(1_000);
		records.push({
			sheetId,
			file: filename,
			sha256: createHash('sha256').update(bytes).digest('hex'),
			bytes: bytes.byteLength,
			entryCount: snapshot?.entryCount ?? 0,
			width: snapshot?.width ?? 0,
			height: snapshot?.height ?? 0,
		});
	});
}

test('renders the Moss carry/stealth/stim POC through the shared runtime', async ({ page }) => {
	const sheetId = 'moss_carry_stealth_stim_poc';
	await page.goto(`/sprite-review.html?sheet=${sheetId}&frames=4`);
	await page.locator('body[data-status="ready"], body[data-status="error"]').waitFor();
	const status = await page.locator('body').getAttribute('data-status');
	if (status === 'error') {
		throw new Error(await page.locator('#error').innerText());
	}

	const snapshot = await page.evaluate(() => window.__spriteReview);
	expect(snapshot).toBeTruthy();
	expect(snapshot?.sheetIds).toEqual([sheetId]);
	expect(snapshot?.entryCount).toBe(16);
	expect(snapshot?.labels.filter((label) => label.includes('carry_jump'))).toHaveLength(4);
	expect(snapshot?.labels.filter((label) => label.includes('stealth_enter'))).toHaveLength(4);
	expect(snapshot?.labels.filter((label) => label.includes('stealth_loop'))).toHaveLength(4);
	expect(snapshot?.labels.filter((label) => label.includes('stim_use'))).toHaveLength(4);
	await expect(page.locator('#review')).toBeVisible();
});

test.afterAll(async () => {
	const ordered = [...records].sort((left, right) => left.sheetId.localeCompare(right.sheetId));
	await writeFile(
		join(OUTPUT_DIRECTORY, 'index.json'),
		`${JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				renderer: '@arcade/runtime drawArcadeSpriteContactSheetCanvas',
				framesPerAnimation: 4,
				sheets: ordered,
			},
			null,
			2
		)}\n`
	);
});

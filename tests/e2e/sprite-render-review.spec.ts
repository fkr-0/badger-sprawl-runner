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
		expect(snapshot).toBeTruthy();
		expect(snapshot?.sheetIds).toEqual([sheetId]);
		expect(snapshot?.entryCount ?? 0).toBeGreaterThan(0);
		expect(snapshot?.width ?? 0).toBeGreaterThan(100);
		expect(snapshot?.height ?? 0).toBeGreaterThan(100);
		expect(snapshot?.labels.some((label) => label.includes('idle'))).toBe(true);

		const filename = `${sheetId}.png`;
		const outputPath = join(OUTPUT_DIRECTORY, filename);
		if (sheetId === 'moss_badger_production') {
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

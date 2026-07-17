import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'data/sprites.json'), 'utf8'));
const production = manifest.spriteSheets.filter(
	(sheet) => sheet.source?.revision === '2026-07-17-production'
);

assert.equal(production.length, 29, 'expected the complete 29-sheet production art pass');

const roleCounts = production.reduce((counts, sheet) => {
	const family = sheet.id.startsWith('enemy_')
		? 'enemy'
		: sheet.id.startsWith('character_')
			? 'character'
			: sheet.id.endsWith('_tiles')
				? 'tiles'
				: 'parallax';
	counts[family] = (counts[family] ?? 0) + 1;
	return counts;
}, {});

assert.deepEqual(roleCounts, {
	tiles: 8,
	parallax: 3,
	enemy: 10,
	character: 8
});

const hashes = new Set();
for (const sheet of production) {
	const sourcePath = join(root, sheet.file);
	const publicPath = join(root, 'apps/runner/public', sheet.file);
	const source = readFileSync(sourcePath);
	const published = readFileSync(publicPath);

	assert.ok(source.equals(published), `${sheet.id}: source/public PNG mismatch`);
	assert.ok(statSync(sourcePath).size > 8_000, `${sheet.id}: suspiciously small atlas`);
	assert.equal(source.subarray(1, 4).toString('ascii'), 'PNG', `${sheet.id}: not a PNG`);

	const width = source.readUInt32BE(16);
	const height = source.readUInt32BE(20);
	const colorType = source[25];
	const [frameWidth, frameHeight] = sheet.frameSize;
	const animations = Object.values(sheet.animations);
	const expectedWidth = sheet.grid
		? sheet.grid.columns * frameWidth
		: Math.max(...animations.map((animation) => animation.frames)) * frameWidth;
	const expectedHeight = sheet.grid
		? sheet.grid.rows * frameHeight
		: animations.length * frameHeight;

	assert.equal(width, expectedWidth, `${sheet.id}: atlas width does not match its runtime rows`);
	assert.equal(height, expectedHeight, `${sheet.id}: atlas height does not match its runtime rows`);
	assert.equal(colorType, 6, `${sheet.id}: production atlas must preserve RGBA transparency`);

	const sourceSheet = join(root, sheet.source.sourceSheet);
	const promptSet = join(root, sheet.source.promptSet);
	assert.ok(statSync(sourceSheet).isFile(), `${sheet.id}: missing source preview`);
	assert.ok(statSync(promptSet).isFile(), `${sheet.id}: missing prompt record`);

	const hash = createHash('sha256').update(source).digest('hex');
	assert.ok(!hashes.has(hash), `${sheet.id}: duplicate production atlas`);
	hashes.add(hash);
}

console.log(
	`production sprites: ${production.length} clean sheets validated (${[...hashes].length} unique PNGs)`
);

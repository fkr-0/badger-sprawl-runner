import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'data/sprites.json'), 'utf8'));
const acceptedRevisions = new Set(['2026-07-17-production', '2026-07-19-dalle-import']);
const production = manifest.spriteSheets.filter((sheet) =>
	acceptedRevisions.has(sheet.source?.revision)
);

assert.equal(production.length, 64, 'expected the complete authored production-art pass');

const roleCounts = production.reduce((counts, sheet) => {
	const family = sheet.id.startsWith('enemy_')
		? 'enemy'
		: sheet.id.startsWith('character_')
			? 'character'
			: sheet.id.startsWith('boss_')
				? 'boss'
				: sheet.id.endsWith('_tiles')
					? 'tiles'
					: sheet.id.endsWith('_parallax')
						? 'parallax'
						: sheet.id.includes('item')
							? 'items'
							: sheet.id.includes('vfx')
								? 'vfx'
								: 'other';
	counts[family] = (counts[family] ?? 0) + 1;
	return counts;
}, {});

assert.deepEqual(roleCounts, {
	tiles: 8,
	parallax: 8,
	enemy: 16,
	character: 20,
	boss: 8,
	items: 3,
	vfx: 1,
});

const requireSourceArchive =
	process.env.REQUIRE_SPRITE_SOURCE_ARCHIVE === '1' ||
	process.env.REQUIRE_DALLE_SOURCE_ARCHIVE === '1';
let archivedSourceBoardsPresent = 0;
const declaredPromptSets = new Set();
const archivedPromptSetsPresent = new Set();
const hashes = new Set();
for (const sheet of production) {
	const sourcePath = join(root, sheet.file);
	const publicPath = join(root, 'apps/runner/public', sheet.file);
	const source = readFileSync(sourcePath);
	const published = readFileSync(publicPath);

	assert.ok(source.equals(published), `${sheet.id}: source/public PNG mismatch`);
	assert.ok(statSync(sourcePath).size > 7_000, `${sheet.id}: suspiciously small atlas`);
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

	assert.equal(
		typeof sheet.source.sourceSheet,
		'string',
		`${sheet.id}: missing sourceSheet metadata`
	);
	const sourceSheet = join(root, sheet.source.sourceSheet);
	if (existsSync(sourceSheet)) {
		assert.ok(statSync(sourceSheet).isFile(), `${sheet.id}: archived source is not a file`);
		archivedSourceBoardsPresent += 1;
	} else if (requireSourceArchive) {
		assert.fail(`${sheet.id}: missing archived source board`);
	}

	if (sheet.source.revision === '2026-07-17-production') {
		assert.equal(
			typeof sheet.source.promptSet,
			'string',
			`${sheet.id}: missing promptSet metadata`
		);
		declaredPromptSets.add(sheet.source.promptSet);
		const promptSet = join(root, sheet.source.promptSet);
		if (existsSync(promptSet)) {
			assert.ok(statSync(promptSet).isFile(), `${sheet.id}: archived prompt set is not a file`);
			archivedPromptSetsPresent.add(sheet.source.promptSet);
		} else if (requireSourceArchive) {
			assert.fail(`${sheet.id}: missing archived prompt record`);
		}
	} else {
		assert.equal(sheet.source.importer, 'scripts/import-dalle-sprites.py');
		assert.ok(
			['image_mapping.json', 'matching.txt', 'metadata.json'].includes(sheet.source.mapping),
			`${sheet.id}: invalid DALL·E mapping provenance`
		);
	}

	const hash = createHash('sha256').update(source).digest('hex');
	assert.ok(!hashes.has(hash), `${sheet.id}: duplicate production atlas`);
	hashes.add(hash);
}

console.log(
	`production sprites: ${production.length} authored sheets validated ` +
		`(${[...hashes].length} unique PNGs; ` +
		`${archivedSourceBoardsPresent}/${production.length} external source boards present; ` +
		`${archivedPromptSetsPresent.size}/${declaredPromptSets.size} prompt archives present)`
);

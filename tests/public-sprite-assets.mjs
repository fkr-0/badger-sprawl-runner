import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

async function fileHash(path) {
	const buffer = await readFile(path);
	return createHash('sha256').update(buffer).digest('hex');
}

function pngDimensions(buffer) {
	assert(buffer.length > 24, 'PNG buffer too small');
	assert(
		buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
		'invalid PNG signature'
	);
	return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function expectedDimensions(sheet) {
	const [fw, fh] = sheet.frameSize;
	if (sheet.grid) return [fw * sheet.grid.columns, fh * sheet.grid.rows];
	const maxFrames = Math.max(
		...Object.values(sheet.animations).map((animation) => animation.frames)
	);
	return [fw * maxFrames, fh * Object.keys(sheet.animations).length];
}

const sourceManifest = JSON.parse(await readFile('data/sprites.json', 'utf8'));
const publicManifest = JSON.parse(await readFile('apps/runner/public/data/sprites.json', 'utf8'));
assert(
	(await fileHash('data/sprites.json')) ===
		(await fileHash('apps/runner/public/data/sprites.json')),
	'apps/runner/public/data/sprites.json must be regenerated from data/sprites.json'
);
assert(
	publicManifest.spriteSheets.length === sourceManifest.spriteSheets.length,
	'public sprite manifest sheet count must match source manifest'
);

let checked = 0;
for (const sheet of sourceManifest.spriteSheets) {
	if (sheet.source?.classification === 'archival') continue;
	const assetPath = `apps/runner/public/${sheet.file}`;
	const info = await stat(assetPath);
	assert(info.size > 0, `sprite asset is empty: ${assetPath}`);
	const png = await readFile(assetPath);
	const [actualWidth, actualHeight] = pngDimensions(png);
	const [expectedWidth, expectedHeight] = expectedDimensions(sheet);
	assert(
		actualWidth === expectedWidth,
		`sprite asset width mismatch for ${sheet.id}: ${actualWidth} !== ${expectedWidth}`
	);
	assert(
		actualHeight === expectedHeight,
		`sprite asset height mismatch for ${sheet.id}: ${actualHeight} !== ${expectedHeight}`
	);
	checked++;
}

console.log(`badger-sprawl-runner public sprite assets ok (${checked} sheets)`);

import { readFile } from 'node:fs/promises';

async function json(path) {
	return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
}

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

const manifest = await json('data/game-manifest.json');
const items = await json('data/items.json');
const progression = await json('data/progression.json');
const sprites = await json('data/sprites.json');

assert(manifest.title === 'Badger Sprawl Runner', 'manifest title mismatch');
assert(Array.isArray(items.items) && items.items.length >= 10, 'expected at least 10 items');
assert(
	Array.isArray(progression.currencies) && progression.currencies.length >= 4,
	'expected progression currencies'
);
assert(
	Array.isArray(sprites.spriteSheets) && sprites.spriteSheets.length >= 4,
	'expected sprite sheets'
);

const itemIds = new Set(items.items.map((item) => item.id));
for (const id of manifest.coreItems) {
	assert(itemIds.has(id), `manifest core item missing from items.json: ${id}`);
}

for (const sheet of sprites.spriteSheets) {
	assert(sheet.id && sheet.file, `sprite sheet missing id/file: ${JSON.stringify(sheet)}`);
	assert(
		Array.isArray(sheet.frameSize) && sheet.frameSize.length === 2,
		`bad frameSize for ${sheet.id}`
	);
	assert(
		Object.keys(sheet.animations || {}).length > 0,
		`sprite sheet has no animations: ${sheet.id}`
	);
	for (const [name, anim] of Object.entries(sheet.animations)) {
		assert(Number.isInteger(anim.frames) && anim.frames > 0, `bad frame count ${sheet.id}.${name}`);
		assert(Number.isInteger(anim.fps) && anim.fps > 0, `bad fps ${sheet.id}.${name}`);
	}
}

console.log('badger-sprawl-runner data validation ok');

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
const enemyFamilies = await json('data/procgen/enemy-families.json');
const affixes = await json('data/procgen/affixes.json');
const stageProfiles = await json('data/procgen/stage-profiles.json');
const roomChunks = await json('data/procgen/room-chunks.json');

assert(manifest.title === 'Badger Sprawl Runner', 'manifest title mismatch');
assert(Array.isArray(items.items) && items.items.length >= 23, 'expected the expanded 23-item catalog');
assert(
	Array.isArray(progression.currencies) && progression.currencies.length >= 4,
	'expected progression currencies'
);
assert(
	Array.isArray(sprites.spriteSheets) && sprites.spriteSheets.length >= 4,
	'expected sprite sheets'
);
assert(Array.isArray(enemyFamilies.families) && enemyFamilies.families.length >= 5, 'expected procgen enemy families');
assert(Array.isArray(affixes.affixes) && affixes.affixes.length >= 5, 'expected procgen affixes');
assert(Array.isArray(stageProfiles.profiles) && stageProfiles.profiles.length >= 8, 'expected procgen stage profiles');
assert(Array.isArray(roomChunks.chunks) && roomChunks.chunks.length >= 3, 'expected procgen room chunks');

const itemIds = new Set(items.items.map((item) => item.id));
for (const id of manifest.coreItems) {
	assert(itemIds.has(id), `manifest core item missing from items.json: ${id}`);
}

const spriteSheetIds = new Set(sprites.spriteSheets.map((sheet) => sheet.id));
for (const item of items.items) {
	assert(item.iconAnimation, `item is missing iconAnimation: ${item.id}`);
	assert(spriteSheetIds.has(item.iconSheetId ?? 'item_icons'), `item references missing icon sheet: ${item.id}`);
	if (item.pickupSheetId) {
		assert(spriteSheetIds.has(item.pickupSheetId), `item references missing pickup sheet: ${item.id}`);
		assert(item.pickupAnimation, `item references pickup sheet without animation: ${item.id}`);
	}
}

for (const family of enemyFamilies.families) {
	assert(family.id && Array.isArray(family.units) && family.units.length > 0, `bad procgen family ${family.id}`);
	for (const unit of family.units) {
		assert(unit.id && unit.role && unit.cost > 0 && unit.hp > 0, `bad procgen unit ${family.id}.${unit.id}`);
	}
}
for (const affix of affixes.affixes) {
	assert(affix.id && Array.isArray(affix.allowedRoles), `bad procgen affix ${affix.id}`);
	assert(Array.isArray(affix.forbiddenWith), `bad forbiddenWith for affix ${affix.id}`);
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

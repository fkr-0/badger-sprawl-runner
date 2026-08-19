import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
	normalizeArcadeSpriteManifest,
	resolveArcadeSpriteFrame,
	validateArcadeSpriteManifest,
} from '@arcade/runtime/sprites';

const source = JSON.parse(
	await readFile(new URL('../data/sprites.json', import.meta.url), 'utf8')
);

assert.equal(
	validateArcadeSpriteManifest(source),
	true,
	'data/sprites.json must pass @arcade/runtime/sprites validation'
);

assert.deepEqual(
	Object.keys(source),
	['version', 'sheets'],
	'data/sprites.json must use the canonical ArcadeSpriteManifest top-level shape'
);

const manifest = normalizeArcadeSpriteManifest(source);
assert.equal(manifest.version, '1');
assert.ok(manifest.sheets.length > 0, 'normalized runtime manifest must contain sheets');
assert.equal(manifest.sheets.length, source.sheets.length);

const moss = manifest.sheets.find((sheet) => sheet.id === 'moss_badger');
assert.ok(moss, 'normalized runtime manifest must contain moss_badger');
const animationName = moss.animations.run ? 'run' : Object.keys(moss.animations)[0];
assert.ok(animationName, 'moss_badger must contain at least one animation');
const address = resolveArcadeSpriteFrame(moss, animationName, 0);
assert.ok(address, `runtime must resolve ${moss.id}.${animationName}[0]`);
assert.equal(address.frameWidth, moss.frameSize[0]);
assert.equal(address.frameHeight, moss.frameSize[1]);

console.log(
	`badger runtime sprite manifest ok: ${manifest.sheets.length} sheets; ${moss.id}.${animationName}[0] resolved`
);

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readJson = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));
const manifest = await readJson('release-train.json');
const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8');
const runtimeMetadata = await readJson('vendor/arcade-runtime.meta.json');
function parse(version, label) {
	const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
	assert.ok(match, `${label} must be an exact semantic version`);
	return match.slice(1).map(Number);
}
const current = parse(manifest.current, 'current');
const patch = parse(manifest.patch.version, 'patch');
const minor = parse(manifest.minor.version, 'minor');
assert.equal(manifest.schemaVersion, 1);
assert.deepEqual(patch, [current[0], current[1], current[2] + 1]);
assert.deepEqual(minor, [current[0], current[1] + 1, 0]);
assert.equal(manifest.minor.includesPatch, true);
for (const packageFile of manifest.packageFiles) {
	const packageJson = await readJson(packageFile);
	assert.equal(
		packageJson.version,
		manifest.current,
		`${packageFile} version differs from release train`
	);
	if (packageFile === 'package.json') assert.equal(packageJson.name, manifest.package);
}
assert.equal(runtimeMetadata.version, manifest.runtimeCompatibility.current);
assert.match(
	changelog,
	new RegExp(`^## \\[${manifest.patch.version.replaceAll('.', '\\.')}\\] - Unreleased$`, 'm')
);
assert.match(
	changelog,
	new RegExp(`^## \\[${manifest.minor.version.replaceAll('.', '\\.')}\\] - Planned$`, 'm')
);
console.info(
	`${manifest.package} release train verified: ${manifest.patch.version} patch, ${manifest.minor.version} minor`
);

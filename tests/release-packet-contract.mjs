import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { verifyReleasePacket } from '../scripts/verify-release-packet.mjs';

const root = resolve(import.meta.dirname, '..');
const sourcePath = join(root, 'release-evidence', 'releases', 'v1.5.1.json');
const source = JSON.parse(await readFile(sourcePath, 'utf8'));

const valid = await verifyReleasePacket(sourcePath, { target: source.release.tagTarget });
assert.equal(valid.status, 'passed');
assert.equal(valid.tag, 'v1.5.1');
assert.equal(valid.target, source.release.tagTarget);

const cliOutput = execFileSync(
	process.execPath,
	[
		join(root, 'scripts', 'verify-release-packet.mjs'),
		'--',
		'--packet',
		sourcePath,
		'--target',
		source.release.tagTarget,
	],
	{ cwd: root, encoding: 'utf8' }
);
assert.match(cliOutput, /release packet verified: v1\.5\.1/);

const workflow = await readFile(join(root, '.github', 'workflows', 'release-check.yml'), 'utf8');
assert.match(workflow, /tags: \['v\*\.\*\.\*'\]/);
assert.match(workflow, /fetch-depth: 0/);
assert.match(workflow, /verify-release-packet\.mjs --packet/);

const temp = await mkdtemp(join(tmpdir(), 'badger-release-packet-'));
try {
	await assertRejectsMutation(
		'bad-target.json',
		(packet) => {
			packet.release.tagTarget = '0'.repeat(40);
		},
		/tagTarget differs from requested target/
	);
	await assertRejectsMutation(
		'bad-member.json',
		(packet) => {
			packet.releaseMembers[0].version = '1.5.0';
		},
		/package version differs from packet|packet version differs from release version/
	);
	await assertRejectsMutation(
		'bad-next-patch.json',
		(packet) => {
			packet.releaseTrain.nextPatch = '1.5.9';
		},
		/nextPatch is not the next patch/
	);
} finally {
	await rm(temp, { recursive: true, force: true });
}

console.info('release packet contract ok');

async function assertRejectsMutation(name, mutate, expected) {
	const packet = structuredClone(source);
	mutate(packet);
	const path = join(temp, name);
	await writeFile(path, `${JSON.stringify(packet, null, 2)}\n`);
	await assert.rejects(
		() => verifyReleasePacket(path, { target: source.release.tagTarget }),
		expected
	);
}

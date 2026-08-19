import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const exactVersion = /^(\d+)\.(\d+)\.(\d+)$/;
const exactTag = /^v(\d+)\.(\d+)\.(\d+)$/;
const fullSha = /^[0-9a-f]{40}$/;
const sha256 = /^[0-9a-f]{64}$/;

export async function verifyReleasePacket(packetPath, options = {}) {
	const absolutePacketPath = resolve(root, packetPath);
	const packet = JSON.parse(await readFile(absolutePacketPath, 'utf8'));
	validateShape(packet);

	const requestedTag = options.tag ?? null;
	if (requestedTag !== null) {
		assert.match(requestedTag, exactTag, 'requested tag must be vMAJOR.MINOR.PATCH');
		assert.equal(packet.release.tag, requestedTag, 'packet tag differs from requested tag');
	}

	let target;
	if (requestedTag !== null) {
		const ref = `refs/tags/${requestedTag}`;
		assert.equal(git(['cat-file', '-t', ref]), 'tag', `${requestedTag} must be an annotated tag`);
		const tagObject = git(['rev-parse', ref]);
		const tagTarget = git(['rev-parse', `${ref}^{commit}`]);
		assert.equal(
			packet.release.tagObject,
			tagObject,
			'packet tagObject differs from Git tag object'
		);
		assert.equal(
			packet.release.tagTarget,
			tagTarget,
			'packet tagTarget differs from Git tag target'
		);
		target = tagTarget;
	} else if (options.target !== undefined) {
		target = git(['rev-parse', `${options.target}^{commit}`]);
		assert.equal(
			packet.release.tagTarget,
			target,
			'packet tagTarget differs from requested target'
		);
	} else {
		target = git(['rev-parse', `${packet.release.tagTarget}^{commit}`]);
	}

	assert.equal(target, packet.release.tagTarget, 'packet tagTarget is not the resolved commit');
	assert.equal(
		git(['rev-parse', `${target}^{tree}`]),
		packet.release.tree,
		'packet tree differs from tag target'
	);
	assert.equal(
		git(['show', '-s', '--format=%s', target]),
		packet.release.subject,
		'packet subject differs from tag target'
	);
	assert.equal(
		git(['rev-parse', `${target}^`]),
		packet.release.baseCommit,
		'packet baseCommit differs from tag target first parent'
	);

	const releaseTrain = readJsonAt(target, 'release-train.json');
	assert.equal(
		releaseTrain.current,
		packet.release.version,
		'tagged release train current version differs from packet'
	);
	assert.equal(
		packet.releaseTrain.current,
		packet.release.version,
		'packet releaseTrain.current differs from release version'
	);
	assert.equal(
		packet.releaseTrain.nextPatch,
		releaseTrain.patch.version,
		'packet nextPatch differs from tagged release train'
	);
	assert.equal(
		packet.releaseTrain.nextMinor,
		releaseTrain.minor.version,
		'packet nextMinor differs from tagged release train'
	);
	assert.deepEqual(
		[...releaseTrain.packageFiles].sort(),
		packet.releaseMembers.map((member) => member.path).sort(),
		'packet release members differ from tagged release train packageFiles'
	);

	for (const member of packet.releaseMembers) {
		const packageJson = readJsonAt(target, member.path);
		assert.equal(packageJson.name, member.name, `${member.path} package name differs from packet`);
		assert.equal(
			packageJson.version,
			member.version,
			`${member.path} package version differs from packet`
		);
		assert.equal(
			member.version,
			packet.release.version,
			`${member.path} packet version differs from release version`
		);
	}

	const runtimeMetadata = readJsonAt(target, 'vendor/arcade-runtime.meta.json');
	assert.equal(
		runtimeMetadata.version,
		packet.releaseTrain.runtimeCompatibility,
		'packet runtime compatibility differs from tagged vendored Runtime'
	);
	assert.equal(
		releaseTrain.runtimeCompatibility.current,
		packet.releaseTrain.runtimeCompatibility,
		'packet runtime compatibility differs from tagged release train'
	);

	const changelog = git(['show', `${target}:CHANGELOG.md`]);
	assert.match(
		changelog,
		new RegExp(
			`^## \\[${escapeRegExp(packet.release.version)}\\] - ${escapeRegExp(packet.release.date)}$`,
			'm'
		),
		'tagged changelog has no dated section for packet release'
	);

	return {
		status: 'passed',
		packet: basename(absolutePacketPath),
		tag: packet.release.tag,
		target,
		members: packet.releaseMembers.length,
		verificationEntries: packet.verification.length,
		artifacts: packet.artifacts.length,
	};
}

function validateShape(packet) {
	assert.equal(packet.contractVersion, 1, 'unsupported release packet contractVersion');
	assert.equal(typeof packet.release?.name, 'string', 'release.name must be a string');
	assert.match(
		packet.release?.version ?? '',
		exactVersion,
		'release.version must be an exact semantic version'
	);
	assert.match(
		packet.release?.date ?? '',
		/^\d{4}-\d{2}-\d{2}$/,
		'release.date must be YYYY-MM-DD'
	);
	assert.match(packet.release?.tag ?? '', exactTag, 'release.tag must be vMAJOR.MINOR.PATCH');
	assert.equal(
		packet.release.tag,
		`v${packet.release.version}`,
		'release.tag must match release.version'
	);
	for (const field of ['tagObject', 'tagTarget', 'baseCommit', 'tree']) {
		assert.match(packet.release?.[field] ?? '', fullSha, `release.${field} must be a full Git SHA`);
	}
	assert.equal(typeof packet.release?.subject, 'string', 'release.subject must be a string');
	assert.ok(packet.release.subject.length > 0, 'release.subject must not be empty');

	assert.ok(
		Array.isArray(packet.releaseMembers) && packet.releaseMembers.length > 0,
		'releaseMembers must not be empty'
	);
	const memberPaths = new Set();
	for (const member of packet.releaseMembers) {
		assert.equal(typeof member.path, 'string', 'release member path must be a string');
		assert.ok(member.path.length > 0, 'release member path must not be empty');
		assert.ok(!memberPaths.has(member.path), `duplicate release member path: ${member.path}`);
		memberPaths.add(member.path);
		assert.equal(typeof member.name, 'string', `${member.path} name must be a string`);
		assert.match(
			member.version ?? '',
			exactVersion,
			`${member.path} version must be an exact semantic version`
		);
	}

	for (const field of ['current', 'nextPatch', 'nextMinor', 'runtimeCompatibility']) {
		assert.match(
			packet.releaseTrain?.[field] ?? '',
			exactVersion,
			`releaseTrain.${field} must be an exact semantic version`
		);
	}
	const current = parseVersion(packet.releaseTrain.current);
	assert.deepEqual(
		parseVersion(packet.releaseTrain.nextPatch),
		[current[0], current[1], current[2] + 1],
		'releaseTrain.nextPatch is not the next patch'
	);
	assert.deepEqual(
		parseVersion(packet.releaseTrain.nextMinor),
		[current[0], current[1] + 1, 0],
		'releaseTrain.nextMinor is not the next minor'
	);

	assert.ok(
		Array.isArray(packet.verification) && packet.verification.length > 0,
		'verification must not be empty'
	);
	const commands = new Set();
	for (const entry of packet.verification) {
		assert.equal(typeof entry.command, 'string', 'verification command must be a string');
		assert.ok(entry.command.length > 0, 'verification command must not be empty');
		assert.ok(!commands.has(entry.command), `duplicate verification command: ${entry.command}`);
		commands.add(entry.command);
		assert.equal(entry.status, 'passed', `${entry.command} is not recorded as passed`);
		assert.equal(typeof entry.result, 'string', `${entry.command} result must be a string`);
	}

	assert.ok(Array.isArray(packet.artifacts), 'artifacts must be an array');
	const artifactPaths = new Set();
	for (const artifact of packet.artifacts) {
		assert.equal(typeof artifact.path, 'string', 'artifact path must be a string');
		assert.ok(!artifactPaths.has(artifact.path), `duplicate artifact path: ${artifact.path}`);
		artifactPaths.add(artifact.path);
		assert.ok(
			Number.isSafeInteger(artifact.bytes) && artifact.bytes >= 0,
			`${artifact.path} bytes must be a non-negative integer`
		);
		assert.match(artifact.sha256 ?? '', sha256, `${artifact.path} sha256 must be a SHA-256 digest`);
	}

	assert.ok(Array.isArray(packet.notes), 'notes must be an array');
	for (const note of packet.notes) {
		assert.equal(typeof note, 'string', 'release packet notes must be strings');
	}
	assert.equal(typeof packet.publication, 'object', 'publication must be an object');
	for (const field of [
		'pushRequested',
		'commitPushed',
		'tagPushed',
		'remoteTagPresentAtVerification',
		'releasePublished',
		'deploymentPerformed',
	]) {
		assert.equal(
			typeof packet.publication?.[field],
			'boolean',
			`publication.${field} must be boolean`
		);
	}
}

function parseVersion(version) {
	const match = exactVersion.exec(version);
	assert.ok(match, `${version} is not an exact semantic version`);
	return match.slice(1).map(Number);
}

function readJsonAt(ref, path) {
	return JSON.parse(git(['show', `${ref}:${path}`]));
}

function git(args) {
	return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trimEnd();
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseArgs(argv) {
	const options = {};
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (token === '--') continue;
		if (token === '--packet' || token === '--tag' || token === '--target') {
			const value = argv[index + 1];
			assert.ok(value, `${token} requires a value`);
			options[token.slice(2)] = value;
			index += 1;
			continue;
		}
		throw new Error(`unknown argument: ${token}`);
	}
	return options;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const packetPath =
			options.packet ??
			(options.tag ? join('release-evidence', 'releases', `${options.tag}.json`) : null);
		assert.ok(packetPath, 'pass --packet PATH or --tag vMAJOR.MINOR.PATCH');
		const result = await verifyReleasePacket(packetPath, options);
		console.info(
			`release packet verified: ${result.tag} -> ${result.target} (${result.members} members, ${result.verificationEntries} checks, ${result.artifacts} artifacts)`
		);
	} catch (error) {
		console.error(
			`release packet verification failed: ${error instanceof Error ? error.message : String(error)}`
		);
		process.exitCode = 1;
	}
}

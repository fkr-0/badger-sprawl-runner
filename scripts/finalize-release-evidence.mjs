import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const evidenceDate = process.env.BADGER_EVIDENCE_DATE ?? '2026-07-26';
const root = resolve('release-evidence', evidenceDate);
const browserRoot = join(root, 'browser');
const reportPath = join(browserRoot, 'report.json');

const requiredFiles = [
	'core-evidence.json',
	'build-lab/same-seed-runs.json',
	'accessibility/traversal-motion.json',
	'migrations/undercity-v1-to-v2.json',
	'localization/inventory.json',
	'localization/en-US.template.json',
	'localization/extraction-report.json',
	'vane-audio/cue-contract.json',
	'browser/report.json',
	'browser/baselines/reduced-motion-dub-colony.png',
	'browser/baselines/gamepad-lower-sprawl-jump.png',
	'browser/baselines/director-vane-phase-0-competence-proof.png',
	'browser/baselines/director-vane-phase-1-chromatic-lock.png',
	'browser/baselines/director-vane-phase-2-counterclaim-closed.png',
	'browser/baselines/director-vane-phase-3-ownership-collapse.png',
	'browser/baselines/director-vane-defeated.png',
];

const expectedCampaignSpecs = [
	'tests/e2e/lower-sprawl-vertical-slice.spec.ts',
	'tests/e2e/drainmarket-vertical-slice.spec.ts',
	'tests/e2e/chrome-arcology-vertical-slice.spec.ts',
	'tests/e2e/mirror-palace-vertical-slice.spec.ts',
	'tests/e2e/dub-colony-vertical-slice.spec.ts',
	'tests/e2e/late-campaign-vertical-slice.spec.ts',
];

const missingFiles = requiredFiles.filter((path) => !fileExists(join(root, path)));
if (missingFiles.length > 0) {
	throw new Error(`release evidence is incomplete; missing: ${missingFiles.join(', ')}`);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const tests = collectPlaywrightTests(report);
const failed = tests.filter((entry) => entry.status !== 'passed');
if (failed.length > 0) {
	throw new Error(
		`release evidence contains failed browser tests: ${failed
			.map((entry) => `${entry.file} :: ${entry.title} [${entry.status}]`)
			.join('; ')}`
	);
}

const recordedFiles = new Set(tests.map((entry) => normalizePath(entry.file)));
const missingCampaignSpecs = expectedCampaignSpecs.filter(
	(path) =>
		![...recordedFiles].some(
			(recorded) => recorded === fileName(path) || recorded.endsWith(`/${fileName(path)}`)
		)
);
if (missingCampaignSpecs.length > 0) {
	throw new Error(`campaign recording matrix is incomplete: ${missingCampaignSpecs.join(', ')}`);
}

const existingArtifacts = collectFiles(root).filter(
	(path) => !path.endsWith('/manifest.json') && !path.endsWith('/README.md')
);
const canonicalBrowserArtifacts = collectFiles(join(browserRoot, 'artifacts'));
const videoCount = canonicalBrowserArtifacts.filter((path) => path.endsWith('.webm')).length;
const traceCount = canonicalBrowserArtifacts.filter((path) => path.endsWith('trace.zip')).length;
const screenshotCount = canonicalBrowserArtifacts.filter((path) => path.endsWith('.png')).length;
const baselineScreenshotCount = collectFiles(join(browserRoot, 'baselines')).filter((path) =>
	path.endsWith('.png')
).length;
const reportVideoCopyCount = existingArtifacts.filter(
	(path) => path.includes('/browser/html-report/data/') && path.endsWith('.webm')
).length;
if (videoCount < tests.length || traceCount < tests.length) {
	throw new Error(
		`recording coverage is incomplete: ${tests.length} tests, ${videoCount} videos, ${traceCount} traces`
	);
}

const core = JSON.parse(readFileSync(join(root, 'core-evidence.json'), 'utf8'));
if (core.buildLab?.evidenceClass !== 'deterministic-benchmark-replay') {
	throw new Error('Build Lab evidence class is missing or ambiguous');
}
if (core.buildLab?.approval?.approved !== true) {
	throw new Error('three-build Lower Sprawl benchmark did not satisfy approval criteria');
}
if (core.undercity?.migrated?.schemaVersion !== 2) {
	throw new Error('undercity mid-room migration evidence did not reach schema v2');
}

const campaignIndex = expectedCampaignSpecs.map((path) => ({
	file: path,
	tests: tests.filter((entry) => fileName(normalizePath(entry.file)) === fileName(path)),
}));

writeJson(join(root, 'campaign', 'recording-index.json'), {
	contractVersion: 1,
	generatedFor: evidenceDate,
	coverage: {
		stages: [
			'lower-sprawl',
			'drainmarket',
			'chrome-arcology',
			'mirror-palace',
			'dub-colony',
			'antenna-barrens',
			'orbital-lift',
			'asteroid-redoubt',
		],
		specs: campaignIndex,
	},
	note: 'Campaign evidence is a stage-complete recording matrix. Chapters 6–8 are one continuous browser run; earlier chapters use authoritative save-seeded vertical slices.',
});

const artifacts = collectFiles(root).filter(
	(path) => !path.endsWith('/manifest.json') && !path.endsWith('/README.md')
);
const fileEntries = artifacts.map((path) => ({
	path: normalizePath(relative(root, path)),
	bytes: statSync(path).size,
	sha256: sha256(readFileSync(path)),
}));

const manifest = {
	contractVersion: 2,
	generatedFor: evidenceDate,
	status: 'complete',
	browser: {
		passedTests: tests.length,
		canonicalVideos: videoCount,
		canonicalTraces: traceCount,
		canonicalTestScreenshots: screenshotCount,
		explicitBaselineScreenshots: baselineScreenshotCount,
		htmlReportVideoCopies: reportVideoCopyCount,
		campaignSpecs: expectedCampaignSpecs.length,
	},
	claims: {
		campaignRecordingMatrixComplete: true,
		reducedMotionAndControllerRecorded: true,
		directorVaneVisualAudioBaselinesRecorded: true,
		undercityMidRoomMigrationRecorded: true,
		localizationTemplateExtracted: true,
		buildLabReplayTimelinesRecorded: true,
		threeSameSeedBenchmarksApproved: true,
		buildLabEvidenceIsHumanPerformance: false,
	},
	files: fileEntries,
};
writeJson(join(root, 'manifest.json'), manifest);
const manifestSha256 = sha256(readFileSync(join(root, 'manifest.json')));
writeFileSync(
	join(root, 'README.md'),
	`# Badger Sprawl Runner release evidence — ${evidenceDate}\n\nStatus: **complete**\n\n- Browser acceptance tests: ${tests.length} passed\n- Campaign recording specs: ${expectedCampaignSpecs.length}\n- Canonical videos: ${videoCount}\n- Canonical traces: ${traceCount}\n- Canonical test screenshots: ${screenshotCount}\n- Explicit visual baselines: ${baselineScreenshotCount}\n- HTML-report video copies: ${reportVideoCopyCount}\n- Build Lab runs: three deterministic same-seed benchmark replays; not human performance data\n- Manifest SHA-256: ${manifestSha256}\n`
);

console.info(
	JSON.stringify(
		{
			status: 'complete',
			root,
			passedTests: tests.length,
			videoCount,
			traceCount,
			screenshotCount,
			baselineScreenshotCount,
			reportVideoCopyCount,
			files: fileEntries.length,
			manifestSha256,
		},
		null,
		2
	)
);

function collectPlaywrightTests(value) {
	const output = [];
	visit(value, []);
	return output;

	function visit(node, titlePath) {
		if (!node || typeof node !== 'object') return;
		const nextPath =
			typeof node.title === 'string' && node.title ? [...titlePath, node.title] : titlePath;
		if (Array.isArray(node.specs)) {
			for (const spec of node.specs) {
				const specPath = spec.title ? [...nextPath, spec.title] : nextPath;
				for (const test of spec.tests ?? []) {
					const results = test.results ?? [];
					const finalResult = results.at(-1);
					output.push({
						file: node.file ?? spec.file ?? '',
						title: specPath.join(' › '),
						projectName: test.projectName ?? '',
						status: finalResult?.status ?? test.status ?? 'unknown',
						durationMs: finalResult?.duration ?? 0,
					});
				}
			}
		}
		for (const suite of node.suites ?? []) visit(suite, nextPath);
	}
}

function collectFiles(directory) {
	const output = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) output.push(...collectFiles(path));
		else if (entry.isFile()) output.push(path);
	}
	return output.sort();
}

function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fileExists(path) {
	try {
		return statSync(path).isFile();
	} catch {
		return false;
	}
}

function normalizePath(path) {
	return String(path).replaceAll('\\', '/');
}

function fileName(path) {
	return normalizePath(path).split('/').at(-1) ?? '';
}

function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

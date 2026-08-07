import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const renderRoot = join(root, 'docs', 'sprite-production', 'render-jobs');
const manifestPath = join(renderRoot, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

assert.equal(manifest.corpusVersion, 2, 'prompt corpus version must be 2');
assert.equal(manifest.currentEntryCount, 70, 'current entry count drifted');
assert.equal(manifest.expansionEntryCount, 151, 'expansion entry count drifted');
assert.equal(manifest.jobCount, 1226, 'individual render-job count drifted');
assert.equal(manifest.promptedFrameCount, 6292, 'prompted occupied-frame count drifted');
assert.deepEqual(manifest.constraints, { maxGridColumns: 4, maxGridRows: 4 });
assert.deepEqual(manifest.remainingGapJobCounts, {
	boss_action_gap: 24,
	character_state_gap: 80,
	enemy_state_gap: 64,
	player_gap: 18,
	vfx_gap: 32,
	world_gameplay_gap: 48,
});
assert.equal(
	Object.values(manifest.remainingGapJobCounts).reduce((sum, value) => sum + value, 0),
	266,
	'remaining-gap count must stay complete'
);

const requiredMetadata = [
	'animation_state',
	'animation_class',
	'atlas_family',
	'runtime_clip',
	'source_class',
	'review_state',
	'scope',
	'source_entry',
	'source_prompt_file',
	'category',
];
const keys = new Set();
let countedFrames = 0;

for (const job of manifest.jobs) {
	assert.ok(!keys.has(job.job_key), `duplicate job key: ${job.job_key}`);
	keys.add(job.job_key);
	for (const field of requiredMetadata) {
		assert.equal(typeof job[field], 'string', `${job.job_key} lacks string metadata ${field}`);
		assert.ok(job[field].length > 0, `${job.job_key} has empty metadata ${field}`);
	}
	assert.ok(Number.isInteger(job.frames) && job.frames > 0, `${job.job_key} has invalid frames`);
	assert.ok(job.grid.columns >= 1 && job.grid.columns <= 4, `${job.job_key} exceeds four columns`);
	assert.ok(job.grid.rows >= 1 && job.grid.rows <= 4, `${job.job_key} exceeds four rows`);
	assert.ok(job.frames <= job.grid.columns * job.grid.rows, `${job.job_key} overfills its grid`);
	assert.equal(
		job.output_size[0],
		job.grid.columns * job.cell_size[0],
		`${job.job_key} width mismatch`
	);
	assert.equal(
		job.output_size[1],
		job.grid.rows * job.cell_size[1],
		`${job.job_key} height mismatch`
	);
	assert.equal(job.review_state, 'pending_render', `${job.job_key} has unexpected review state`);

	const markdownPath = join(renderRoot, job.markdown);
	assert.ok(statSync(markdownPath).isFile(), `missing render-job Markdown: ${job.markdown}`);
	const markdown = readFileSync(markdownPath, 'utf8');
	assert.match(
		markdown,
		/## Prompt\n\n```text\n[\s\S]+?\n```/,
		`${job.job_key} lacks a prompt block`
	);
	assert.ok(
		!markdown.includes('{{') && !markdown.includes('}}'),
		`${job.job_key} has unresolved template tokens`
	);
	assert.ok(markdown.includes(`job_id: ${job.id}`), `${job.job_key} frontmatter job id mismatch`);
	countedFrames += job.frames;
}

assert.equal(keys.size, manifest.jobCount, 'manifest job-key cardinality mismatch');
assert.equal(countedFrames, manifest.promptedFrameCount, 'manifest prompted-frame total mismatch');

const promptIndex = readFileSync(
	join(root, 'docs', 'sprite-production', 'prompt-index.yml'),
	'utf8'
);
assert.ok(!promptIndex.includes('_prompt:'), 'public prompt index leaked private prompt payloads');
assert.match(
	promptIndex,
	/remaining_gap_catalog: docs\/sprite-production\/remaining-gaps\.yml/
);
assert.match(
	promptIndex,
	/render_job_manifest: docs\/sprite-production\/render-jobs\/manifest\.json/
);

const gapCatalog = readFileSync(
	join(root, 'docs', 'sprite-production', 'remaining-gaps.yml'),
	'utf8'
);
for (const section of [
	'player_gaps:',
	'enemy_state_extensions:',
	'character_state_extensions:',
	'boss_action_variants:',
	'world_gameplay_tiles:',
	'vfx_gaps:',
]) {
	assert.ok(gapCatalog.includes(section), `remaining gap catalog lacks ${section}`);
}

console.log(
	`Validated ${manifest.jobCount} individual sprite prompt jobs, ${manifest.promptedFrameCount} occupied frames, and ${Object.values(manifest.remainingGapJobCounts).reduce((sum, value) => sum + value, 0)} audited remaining-gap jobs.`
);

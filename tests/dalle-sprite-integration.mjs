import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const revision = '2026-07-19-dalle-import';
const manifest = JSON.parse(readFileSync(join(root, 'data/sprites.json'), 'utf8'));
const publicManifest = JSON.parse(
	readFileSync(join(root, 'apps/runner/public/data/sprites.json'), 'utf8')
);
assert.deepEqual(publicManifest, manifest, 'source/public sprite manifests diverged');

const imported = manifest.spriteSheets.filter((sheet) => sheet.source?.revision === revision);
assert.equal(imported.length, 55, 'expected the complete mapped DALLE runtime-import batch');

const required = new Set([
	'boss_boss_captain_grin_tollmech',
	'boss_boss_knife_drone_nest',
	'boss_boss_madame_vitrine_glasscourt',
	'boss_boss_reflection_judge_court',
	'boss_boss_director_vane_skylock',
	'enemy_clinic_repo',
	'enemy_mirror_sentinel',
	'enemy_feedback_guard',
	'enemy_customs_lancer',
	'enemy_vane_air_bailiff',
	'enemy_command_lock_partisan',
	'character_dr_mina_suture',
	'character_juno_jar',
	'character_lio',
	'character_little_ix',
	'character_mara_modulo',
	'character_black_ice_fox',
	'character_king_feedback',
	'character_madame_vitrine',
	'character_reflection_judge',
	'character_elevator_angel',
	'character_director_vane',
	'character_command_lock_faction',
	'items_extended',
	'item_icons',
	'item_icons_extended',
	'vfx_combat',
	'lower_sprawl_parallax',
	'chrome_arcology_parallax',
	'straylight_mirage_parallax',
	'dub_colony_parallax',
	'orbital_lift_parallax',
	'asteroid_redoubt_parallax',
	'lower_sprawl_tiles',
	'drainmarket_tiles',
	'chrome_arcology_tiles',
	'dub_colony_tiles',
	'orbital_lift_tiles',
	'enemy_rent_cop_piker',
	'enemy_turnstile_mite',
	'enemy_knife_drone',
	'enemy_chrome_bellhop',
	'enemy_masque_duelist',
	'enemy_signal_jammer_bat',
	'boss_boss_king_feedback_ampthrone',
	'boss_boss_black_ice_fox_node',
	'boss_boss_elevator_angel_counterweight',
	'character_auntie_subharmonic',
	'character_rook_null',
	'character_sister_version',
	'character_naya_root',
	'character_dj_calculus',
	'character_foreman_pell',
	'character_murr_murrby',
	'character_cobalt_carmine',
]);
assert.deepEqual(new Set(imported.map((sheet) => sheet.id)), required);

for (const sheet of imported) {
	const sourcePath = join(root, sheet.file);
	const publicPath = join(root, 'apps/runner/public', sheet.file);
	const source = readFileSync(sourcePath);
	const published = readFileSync(publicPath);
	assert.ok(source.equals(published), `${sheet.id}: source/public atlas mismatch`);
	assert.equal(source.subarray(1, 4).toString('ascii'), 'PNG', `${sheet.id}: not a PNG`);
	assert.equal(source[25], 6, `${sheet.id}: imported atlas must preserve RGBA transparency`);
	assert.ok(statSync(sourcePath).size > 7_000, `${sheet.id}: imported atlas is suspiciously small`);
	assert.ok(
		statSync(join(root, sheet.source.sourceSheet)).isFile(),
		`${sheet.id}: missing archived DALLE source board`
	);
	assert.ok(
		['image_mapping.json', 'matching.txt', 'metadata.json'].includes(sheet.source.mapping),
		`${sheet.id}: unexpected mapping source ${sheet.source.mapping}`
	);
	assert.equal(sheet.source.importer, 'scripts/import-dalle-sprites.py');
	assert.ok(sheet.source.description.length > 8, `${sheet.id}: missing useful source description`);
}

const automaticMap = JSON.parse(readFileSync(join(root, 'image_mapping.json'), 'utf8')).matches;
const manualLines = readFileSync(join(root, 'matching.txt'), 'utf8')
	.split(/\r?\n/)
	.filter((line) => /^\s*[\d,]+:/.test(line));
assert.equal(Object.keys(automaticMap).length, 26);
assert.ok(manualLines.length >= 30, 'matching.txt no longer carries the supplemental manual map');
assert.ok(
	manualLines.some((line) => line.includes('boss_captain_grin')),
	'manual boss mapping disappeared'
);
assert.ok(
	manualLines.some((line) => line.includes('char_lio')),
	'manual story-character mapping disappeared'
);
const provenanceCounts = imported.reduce((counts, sheet) => {
	counts[sheet.source.mapping] = (counts[sheet.source.mapping] ?? 0) + 1;
	return counts;
}, {});
assert.equal(provenanceCounts['matching.txt'], 35);
assert.equal(provenanceCounts['image_mapping.json'], 19);
assert.equal(provenanceCounts['metadata.json'], 1);

console.log(`DALLE sprite integration: ${imported.length} runtime atlases validated`);

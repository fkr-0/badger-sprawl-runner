import { access, readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const distRoot = join(root, 'apps/runner/dist');
const indexPath = join(distRoot, 'index.html');
const artifactLabRoot = join(root, 'dist');

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

const rootIndex = await readFile(join(root, 'index.html'), 'utf8');
assert(
	rootIndex.includes('./apps/runner/dist/index.html'),
	'root artifact entry must redirect to the production runner build'
);
assert(
	!rootIndex.includes('src/main.js'),
	'root artifact entry still launches the legacy prototype'
);

const html = await readFile(indexPath, 'utf8');
assert(html.includes('Badger Sprawl Runner'), 'dist index is missing app title');
assert(html.includes('id="game"'), 'dist index is missing the playable canvas');
assert(!html.includes('hud-panel'), 'dist index still exposes the legacy header shell');
assert(!html.includes('status-grid'), 'dist index still exposes the legacy status/debug panels');

const assetRefs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((match) => match[1]);
assert(assetRefs.length >= 2, 'dist index should reference js/css assets');

for (const ref of assetRefs) {
	const assetPath = join(distRoot, ref);
	assert(await exists(assetPath), `dist index references missing asset: ${ref}`);
}

const entryScriptRefs = [...html.matchAll(/<script[^>]+src="\.\/([^"]+\.js)"/g)].map(
	(match) => match[1]
);
assert(entryScriptRefs.length === 1, 'dist index should reference exactly one runner entry script');
const entryScript = entryScriptRefs[0];
assert(entryScript, 'dist index runner entry script could not be resolved');
const jsBundle = await readFile(join(distRoot, entryScript), 'utf8');
const entryStats = await stat(join(distRoot, entryScript));
assert(
	entryStats.size < 500_000,
	`runner entry bundle should stay below 500 kB after code splitting; got ${entryStats.size}`
);
const emittedAssets = await readdir(join(distRoot, 'assets'));
assert(
	emittedAssets.some((name) => /^pixi-runtime-.*\.js$/.test(name)),
	'runner build is missing the lazy Pixi runtime chunk'
);
assert(
	emittedAssets.some((name) => /^arcade-runtime-.*\.js$/.test(name)),
	'runner build is missing the shared arcade runtime chunk'
);
assert(
	!html.includes('pixi-runtime-'),
	'Pixi runtime must remain lazy and must not be preloaded by the default canvas build'
);
assert(
	!jsBundle.includes('SceneManager shell'),
	'runner bundle still contains the legacy debug shell'
);
assert(
	!jsBundle.includes('SceneManager routes Story'),
	'runner bundle still contains legacy implementation-status copy'
);
assert(
	jsBundle.includes('data/sprites.json'),
	'runner bundle is missing the relative sprite manifest URL'
);
assert(
	!jsBundle.includes('/data/sprites.json'),
	'runner bundle contains an absolute sprite manifest URL'
);
assert(
	jsBundle.includes('moss_badger_production'),
	'runner bundle does not select the production Moss sprite sheet'
);
assert(
	jsBundle.includes('lower_sprawl_backdrop'),
	'runner bundle does not select the Lower Sprawl production backdrop'
);

const spriteManifestPath = join(distRoot, 'data/sprites.json');
assert(await exists(spriteManifestPath), 'runner build is missing data/sprites.json');
const spriteManifest = JSON.parse(await readFile(spriteManifestPath, 'utf8'));
for (const sheet of spriteManifest.spriteSheets) {
	assert(
		await exists(join(distRoot, sheet.file)),
		`runner build is missing sprite sheet: ${sheet.file}`
	);
}

for (const requiredSheet of ['moss_badger_production', 'lower_sprawl_backdrop']) {
	assert(
		spriteManifest.spriteSheets.some((sheet) => sheet.id === requiredSheet),
		`runner build is missing production sheet: ${requiredSheet}`
	);
}

const labIndex = await readFile(join(artifactLabRoot, 'index.html'), 'utf8');
assert(labIndex === html, 'Artifact Lab dist/index.html is stale relative to the Vite build');
for (const ref of assetRefs) {
	assert(
		await exists(join(artifactLabRoot, ref)),
		`Artifact Lab target is missing built asset: ${ref}`
	);
}
assert(
	await exists(join(artifactLabRoot, 'assets/sprites/moss_badger_production.png')),
	'Artifact Lab target is missing the production Moss sprite'
);
assert(
	await exists(join(artifactLabRoot, 'assets/sprites/worlds/lower_sprawl_backdrop.png')),
	'Artifact Lab target is missing the Lower Sprawl backdrop'
);

console.log(`badger-sprawl-runner smoke ok (${spriteManifest.spriteSheets.length} sprite sheets)`);

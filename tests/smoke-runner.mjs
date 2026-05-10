import { access, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const distRoot = join(root, 'apps/runner/dist');
const indexPath = join(distRoot, 'index.html');

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

const html = await readFile(indexPath, 'utf8');
assert(html.includes('Badger Sprawl Runner'), 'dist index is missing app title');
assert(html.includes('Playable vertical slice'), 'dist index is missing vertical-slice copy');

const assetRefs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((match) => match[1]);
assert(assetRefs.length >= 2, 'dist index should reference js/css assets');

for (const ref of assetRefs) {
	const assetPath = join(distRoot, ref);
	assert(await exists(assetPath), `dist index references missing asset: ${ref}`);
}

const jsRefs = assetRefs.filter((ref) => ref.endsWith('.js'));
assert(jsRefs.length === 1, 'dist index should reference exactly one runner js bundle');
const jsBundle = await readFile(join(distRoot, jsRefs[0]), 'utf8');
assert(jsBundle.includes('SceneManager shell'), 'runner bundle is missing SceneManager shell text');
assert(
	jsBundle.includes('SceneManager routes Story'),
	'runner bundle is missing concrete route status text'
);

console.log('badger-sprawl-runner smoke ok');

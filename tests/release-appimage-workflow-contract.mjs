import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const workflow = await readFile(
	resolve(root, '.github', 'workflows', 'release-appimage.yml'),
	'utf8'
);

assert.match(workflow, /tags: \['v\*\.\*\.\*'\]/);
assert.match(workflow, /workflow_dispatch:/);
assert.match(workflow, /git cat-file -t/);
assert.match(workflow, /must be an annotated tag/);
assert.match(workflow, /git checkout --detach "refs\/tags\/\$RELEASE_TAG"/);
assert.match(workflow, /release-evidence\/releases\/\$\{RELEASE_TAG\}\.json/);
assert.match(workflow, /verify-release-packet\.mjs/);
assert.match(workflow, /pnpm run desktop:appimage/);
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
assert.match(packageJson.scripts['desktop:appimage'], /--publish never$/);
assert.match(workflow, /--appimage-version/);
assert.match(workflow, /sha256sum/);
assert.match(workflow, /actions\/upload-artifact@v4/);
assert.match(workflow, /gh release create/);
assert.match(workflow, /gh release upload/);
assert.match(workflow, /permissions:\n {2}contents: write/);

console.info('release AppImage workflow contract ok');

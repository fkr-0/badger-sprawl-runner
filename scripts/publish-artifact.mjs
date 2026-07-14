import { cp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const source = join(root, 'apps/runner/dist');
const target = join(root, 'dist');

await rm(target, { force: true, recursive: true });
await cp(source, target, { recursive: true });
console.log('Published Artifact Lab runner to dist/');

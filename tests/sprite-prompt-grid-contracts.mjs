import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

const root = new URL('../', import.meta.url).pathname;
const promptRoots = ['llm-sprite-generation', 'docs/workflows'];
const gridObjectPattern = /grid:\s*\{[^}\n]*columns:\s*(\d+)[^}\n]*rows:\s*(\d+)[^}\n]*\}/g;
const proseGridPatterns = [
	/\b(\d+)\s*(?:columns?|cols?)\s*by\s*(\d+)\s*rows?\b/gi,
	/\b(\d+)\s*by\s*(\d+)\s*grid\b/gi,
	/\b(\d+)x(\d+)\s*grid\b/gi,
	/\b(\d+)×(\d+)\s*grid\b/gi,
];
const outputHintPattern = /(?:^|[_-])(\d+)x(\d+)(?:[_-]|\.)/gi;
const rowReferencePattern = /\brow[_ ](\d+)\b/gi;
const sheetDimensionPattern =
	/\b(\d+)x(\d+)\s+px,\s+(?:exactly\s+)?(\d+)\s*(?:columns?\s+by|x|by)\s*(\d+)\s*(?:rows?|grid)[^\n.]*?(\d+)x\5\s+px/gi;

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(path);
		} else if (/\.(?:ya?ml|json|md)$/.test(entry.name)) {
			yield path;
		}
	}
}

const violations = [];

for (const promptRoot of promptRoots) {
	for await (const file of walk(join(root, promptRoot))) {
		const content = await readFile(file, 'utf8');
		const rel = relative(root, file);

		for (const match of content.matchAll(gridObjectPattern)) {
			const columns = Number(match[1]);
			const rows = Number(match[2]);
			if (columns > 4 || rows > 4) {
				violations.push(`${rel}: grid metadata ${columns}x${rows} exceeds 4x4`);
			}
		}

		for (const pattern of proseGridPatterns) {
			for (const match of content.matchAll(pattern)) {
				const columns = Number(match[1]);
				const rows = Number(match[2]);
				if (columns > 4 || rows > 4) {
					violations.push(`${rel}: prompt text ${match[0]} exceeds 4x4`);
				}
			}
		}

		for (const match of content.matchAll(outputHintPattern)) {
			const columns = Number(match[1]);
			const rows = Number(match[2]);
			if (columns > 4 || rows > 4) {
				violations.push(`${rel}: output/id grid hint ${match[0]} exceeds 4x4`);
			}
		}

		for (const match of content.matchAll(rowReferencePattern)) {
			const row = Number(match[1]);
			if (row > 4) {
				violations.push(`${rel}: row reference ${match[0]} exceeds 4-row grid limit`);
			}
		}

		for (const match of content.matchAll(sheetDimensionPattern)) {
			const width = Number(match[1]);
			const height = Number(match[2]);
			const columns = Number(match[3]);
			const rows = Number(match[4]);
			const cell = Number(match[5]);
			const expectedWidth = columns * cell;
			const expectedHeight = rows * cell;
			if (width !== expectedWidth || height !== expectedHeight) {
				violations.push(
					`${rel}: prose sheet size ${width}x${height} does not match ${columns}x${rows} cells at ${cell}px`
				);
			}
		}
	}
}

assert(
	violations.length === 0,
	`Sprite prompt grids must be 4x4 or smaller. Violations:\n${violations.join('\n')}`
);

console.log('badger-sprawl-runner sprite prompt grid contracts ok');

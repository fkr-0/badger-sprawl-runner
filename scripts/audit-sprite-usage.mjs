#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { normalizeArcadeSpriteManifest } from '@arcade/runtime/sprites';

const root = resolve(import.meta.dirname, '..');
const manifest = normalizeArcadeSpriteManifest(
	JSON.parse(readFileSync(join(root, 'data/sprites.json'), 'utf8'))
);
const scanRoots = ['apps/runner/src', 'packages', 'data'];
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md']);
const excluded = new Set([
	'data/sprites.json',
	'apps/runner/public/data/sprites.json',
	'data/sprite-prompts.json',
]);
const archivalSheets = new Set(
	manifest.sheets
		.filter((sheet) => sheet.source?.classification === 'archival')
		.map((sheet) => sheet.id)
);

function collectFiles(path, output = []) {
	for (const entry of readdirSync(path, { withFileTypes: true })) {
		if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === 'coverage')
			continue;
		const full = join(path, entry.name);
		if (entry.isDirectory()) collectFiles(full, output);
		else if (textExtensions.has(extname(entry.name))) output.push(full);
	}
	return output;
}

const files = scanRoots.flatMap((path) => collectFiles(join(root, path)));
const corpus = files
	.filter((path) => !excluded.has(relative(root, path)))
	.map((path) => ({ path: relative(root, path), content: readFileSync(path, 'utf8') }));

function isProductionReference(path) {
	return !(
		path.endsWith('.test.ts') ||
		path.endsWith('.spec.ts') ||
		path.includes('/tests/') ||
		path.startsWith('tests/')
	);
}

const usage = manifest.sheets.map((sheet) => {
	const references = corpus
		.filter(({ content }) => content.includes(sheet.id) || content.includes(sheet.file))
		.map(({ path }) => path);
	const productionReferences = references.filter(isProductionReference);
	return {
		id: sheet.id,
		file: sheet.file,
		classification: archivalSheets.has(sheet.id) ? 'archival' : 'runtime',
		imported: sheet.source?.revision === '2026-07-19-dalle-import',
		referenceCount: references.length,
		references,
		productionReferenceCount: productionReferences.length,
		productionReferences,
	};
});

const imported = usage.filter((entry) => entry.imported);
const runtime = usage.filter((entry) => entry.classification === 'runtime');
const runtimeUnreferenced = runtime.filter((entry) => entry.productionReferenceCount === 0);
const report = {
	generatedAt: new Date().toISOString(),
	totalSheets: usage.length,
	directlyReferenced: usage.filter((entry) => entry.referenceCount > 0).length,
	unreferenced: usage.filter((entry) => entry.referenceCount === 0).length,
	importedSheets: imported.length,
	importedReferenced: imported.filter((entry) => entry.referenceCount > 0).length,
	importedProductionReferenced: imported.filter((entry) => entry.productionReferenceCount > 0)
		.length,
	importedUnreferenced: imported
		.filter((entry) => entry.referenceCount === 0)
		.map((entry) => entry.id),
	importedProductionUnreferenced: imported
		.filter((entry) => entry.productionReferenceCount === 0)
		.map((entry) => entry.id),
	archivalSheets: [...archivalSheets].sort(),
	runtimeSheets: runtime.length,
	runtimeProductionReferenced: runtime.length - runtimeUnreferenced.length,
	runtimeProductionUnreferenced: runtimeUnreferenced.map((entry) => entry.id),
	usage,
};

const reportDir = join(root, 'generated/reports');
mkdirSync(reportDir, { recursive: true });
writeFileSync(join(reportDir, 'sprite-usage.json'), `${JSON.stringify(report, null, 2)}\n`);

const markdown = [
	'# Sprite usage audit',
	'',
	'> This is a static direct-reference audit. Runtime-selected IDs can be false negatives, but direct positives are authoritative.',
	'',
	`- Total sheets: **${report.totalSheets}**`,
	`- Directly referenced: **${report.directlyReferenced}**`,
	`- No direct reference: **${report.unreferenced}**`,
	`- DALLE-imported sheets: **${report.importedSheets}**`,
	`- Imported sheets directly referenced: **${report.importedReferenced}**`,
	`- Imported sheets referenced by production code/data: **${report.importedProductionReferenced}**`,
	`- Runtime sheets referenced by production code/data: **${report.runtimeProductionReferenced}/${report.runtimeSheets}**`,
	`- Explicit archival/source sheets: **${report.archivalSheets.length}**`,
	'',
	'## Imported sheets without a direct reference',
	'',
	...(report.importedUnreferenced.length
		? report.importedUnreferenced.map((id) => `- \`${id}\``)
		: ['All imported sheets have at least one direct code or data reference.']),
	'',
	'## Imported sheets without a production reference',
	'',
	...(report.importedProductionUnreferenced.length
		? report.importedProductionUnreferenced.map((id) => `- \`${id}\``)
		: ['All imported sheets are referenced by production code or data.']),
	'',
];
writeFileSync(join(reportDir, 'sprite-usage.md'), markdown.join('\n'));

console.log(
	`sprite usage: ${report.directlyReferenced}/${report.totalSheets} directly referenced; ` +
		`${report.importedReferenced}/${report.importedSheets} imported sheets referenced`
);
console.log(
	`production usage: ${report.importedProductionReferenced}/${report.importedSheets} imported sheets referenced by production code/data`
);
if (report.importedUnreferenced.length) {
	console.log(`imported without direct reference: ${report.importedUnreferenced.join(', ')}`);
}
if (report.runtimeProductionUnreferenced.length) {
	console.error(
		`runtime sheets without a production reference: ${report.runtimeProductionUnreferenced.join(', ')}`
	);
	process.exitCode = 1;
}

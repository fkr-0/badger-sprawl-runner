import { readFile } from 'node:fs/promises';

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

async function text(path) {
	return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

async function json(path) {
	return JSON.parse(await text(path));
}

const rootPackage = await json('package.json');
const runnerPackage = await json('apps/runner/package.json');
const readme = await text('README.md');
const runnerMain = await text('apps/runner/src/main.ts');
const runnerApp = await text('apps/runner/src/RunnerApp.ts');
const runnerGameFlow = await text('apps/runner/src/game/GameFlow.ts');
const modeRouter = await text('apps/runner/src/game/ModeRouter.ts');
const modeSceneFactories = await text('apps/runner/src/scenes/ModeSceneFactories.ts');
const smokeMain = await text('apps/runner/src/smokeMain.ts');
const legacyMain = await text('src/main.js');
const manifest = await json('data/game-manifest.json');
const items = await json('data/items.json');
const sprites = await json('data/sprites.json');

assert(rootPackage.version === '1.0.0', 'root package version must be 1.0.0 for v1 release');
assert(runnerPackage.version === '1.0.0', 'runner package version must be 1.0.0 for v1 release');

for (const command of [
	'pnpm run test',
	'pnpm run typecheck',
	'pnpm run build',
	'pnpm run smoke:runner',
	'pnpm run lint',
]) {
	assert(readme.includes(command), `README release command missing: ${command}`);
}

for (const phrase of ['v1.0 release scope', 'apps/runner', 'legacy static prototype', 'todo.md']) {
	assert(readme.includes(phrase), `README missing v1 release phrase: ${phrase}`);
}

for (const required of ['createRunnerApp', 'app.start()', 'SceneManager shell']) {
	assert(
		runnerMain.includes(required),
		`runner entrypoint missing SceneManager shell surface: ${required}`
	);
}

for (const required of [
	'new SceneManager',
	'routeModeSelection',
	'createDefaultModeSceneFactories',
	'new TitleScene',
]) {
	assert(runnerApp.includes(required), `RunnerApp missing scene shell wiring: ${required}`);
}

assert(
	!modeRouter.includes('RoutedModeScene'),
	'ModeRouter must not use placeholder RoutedModeScene'
);
for (const required of ['StoryFlowScene', 'TrainingScene', 'VersusScene', 'SkillTreeScene']) {
	assert(
		modeSceneFactories.includes(required),
		`ModeSceneFactories missing concrete scene: ${required}`
	);
}

for (const required of ['BADGER SPRAWL RUNNER', 'createLocalStorageSaveDriver', 'loadGameFlow']) {
	assert(
		smokeMain.includes(required),
		`smoke harness missing prototype runtime surface: ${required}`
	);
}

for (const mode of ['story', 'versus', 'training', 'skills']) {
	assert(runnerGameFlow.includes(mode), `runner flow missing menu mode: ${mode}`);
}

for (const scene of ['TitleScene', 'StageRunScene', 'TrainingScene', 'HordeScene']) {
	const scenePath = `apps/runner/src/scenes/${scene}.ts`;
	const sceneSource = await text(scenePath);
	assert(
		sceneSource.includes(`export class ${scene}`),
		`runner scene missing export: ${scenePath}`
	);
}

for (const control of ['KeyJ', 'KeyK', 'KeyE', 'KeyM', 'Space']) {
	assert(legacyMain.includes(control), `missing legacy gameplay control binding: ${control}`);
}

for (const kind of ['rocket', 'railgun', 'stim', 'katana']) {
	assert(
		legacyMain.includes(`p.kind === '${kind}'`),
		`legacy pickup kind is not handled by collect(): ${kind}`
	);
}

const itemIds = new Set(items.items.map((item) => item.id));
for (const id of manifest.coreItems) {
	assert(itemIds.has(id), `core manifest item missing from items.json: ${id}`);
}

for (const sheet of sprites.spriteSheets) {
	assert(
		sheet.file.startsWith('assets/sprites/') ||
			sheet.file.startsWith('./assets/sprites/') ||
			sheet.file.startsWith('generated/') ||
			sheet.file.startsWith('./generated/'),
		`sprite sheet path is outside supported asset namespaces: ${sheet.id}`
	);
}

console.log('badger-sprawl-runner runtime contracts ok');

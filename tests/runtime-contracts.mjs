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
const rendererSource = await text('apps/runner/src/renderer/Renderer.ts');
const uiRendererSource = await text('apps/runner/src/renderer/UIRenderer.ts');
const itemSystemSource = await text('apps/runner/src/systems/ItemSystem.ts');
const stageRunSceneSource = await text('apps/runner/src/scenes/StageRunScene.ts');
const storyFlowSceneSource = await text('apps/runner/src/scenes/StoryFlowScene.ts');
const dialoguePortraitRendererSource = await text('apps/runner/src/renderer/DialoguePortraitRenderer.ts');
const shopSceneSource = await text('apps/runner/src/scenes/ShopScene.ts');
const shopEngineSource = await text('packages/progression/src/ShopEngine.ts');
const campaignSource = await text('apps/runner/src/game/Campaign.ts');
const spriteRendererSource = await text('apps/runner/src/renderer/SpriteRenderer.ts');
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









for (const required of [
	'chapterId: string',
	'toChapterId',
	'completedChapterIds',
	'getCurrentChapterId',
	'getCompletedChapterIds',
]) {
	assert(runnerGameFlow.includes(required), `GameFlow missing chapter progression bridge: ${required}`);
}

for (const required of [
	'SideQuest',
	'CAMPAIGN_SIDE_QUESTS',
	'meter-maidens-ledger',
	'tools-not-heroes',
]) {
	assert(campaignSource.includes(required), `Campaign missing side quest integration: ${required}`);
}
for (const required of ['sideQuests?: SideQuest[]', 'sideQuests: stage.sideQuests?.map']) {
	assert(runnerGameFlow.includes(required), `GameFlow missing side quest stage projection: ${required}`);
}
for (const required of ['stage.sideQuests?.[0]', 'Side job:', 'sideQuest.objective.slice']) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing side quest panel rendering: ${required}`);
}

for (const required of [
	'getPriceModifier',
	'heatMarkup',
	'favorDiscount',
	'guileDiscount',
	'priceModifier',
]) {
	assert(shopEngineSource.includes(required), `ShopEngine missing heat/favor economy pricing: ${required}`);
}
for (const required of [
	'currentOffer',
	'refreshOffer',
	'this.shopEngine.generateOffer',
	'this.metaState.orbitHeat',
	'this.metaState.dubFavor',
	'getGuileFromSkills',
	'modifier.toFixed(2)',
]) {
	assert(shopSceneSource.includes(required), `ShopScene missing trust/heat shop wiring: ${required}`);
}

for (const required of [
	'getCurrentStage()',
	'choiceOutcomes: stage.choiceOutcomes?.map',
]) {
	assert(runnerGameFlow.includes(required), `GameFlow missing current-stage choice API: ${required}`);
}
for (const required of [
	'renderStageChoicePanel',
	'handleKeyDown',
	'chooseStageChoice',
	'ArrowUp',
	'ArrowDown',
	"/^[1-9]$/",
	'lastChoiceResult',
	'getCurrentStage()',
]) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing stage choice UI wiring: ${required}`);
}

for (const required of [
	'getAnimationEvents',
	'SpriteAnimationEvent',
	'animation.events.filter',
]) {
	assert(spriteRendererSource.includes(required), `SpriteRenderer missing animation event API: ${required}`);
}
for (const required of [
	'advanceAnimationFrames',
	'emitAnimationEvents',
	"getAnimationEvents('moss_badger'",
	"case 'footstep'",
	"case 'vfx'",
]) {
	assert(stageRunSceneSource.includes(required), `StageRunScene missing animation event dispatch: ${required}`);
}

for (const required of [
	'DialoguePortraitRenderer',
	'getDialoguePortrait',
	'character_naya_root',
	'character_rook_null',
	'character_sister_version',
	'character_lio',
	'moss_badger',
	'spriteRenderer.drawFrame',
	'fallbackLabel',
]) {
	assert(
		dialoguePortraitRendererSource.includes(required),
		`DialoguePortraitRenderer missing portrait contract: ${required}`,
	);
}
for (const required of [
	'renderDialoguePanel',
	'renderDialoguePortrait',
	'getCurrentDialogue()',
	'getCurrentDebrief()',
	"state.mode === 'dialogue'",
	"state.mode === 'debrief'",
]) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing dialogue portrait wiring: ${required}`);
}
assert(
	rendererSource.includes('DialoguePortraitRenderer') && rendererSource.includes('renderDialoguePortrait'),
	'Renderer must expose DialoguePortraitRenderer through renderDialoguePortrait',
);

for (const required of [
	'isStoryPayloadPickup',
	'applyPersistedPayloadPickups',
	'getCollectedStoryPayloadIds',
	"pickup.persistence === 'story_payload'",
]) {
	assert(itemSystemSource.includes(required), `ItemSystem missing story payload persistence contract: ${required}`);
}
for (const required of [
	'StageRunSceneOptions',
	'acquiredPayloadIds',
	'onStoryPayloadCollected',
	'applyPersistedPayloadPickups(this.pickups',
]) {
	assert(stageRunSceneSource.includes(required), `StageRunScene missing story payload persistence wiring: ${required}`);
}

for (const required of [
	'HUD_ICON_SHEET',
	'item_icons',
	'rocket_backpack_icon',
	'railgun_icon',
	'katana_icon',
	'stim_pack_icon',
	'spriteRenderer.drawFrame(HUD_ICON_SHEET',
	'getHudIconSlots',
]) {
	assert(uiRendererSource.includes(required), `UIRenderer missing item icon HUD contract: ${required}`);
}
assert(
	rendererSource.includes('this.uiRenderer.render(this.ctx, player, camera, this.spriteRenderer)'),
	'Renderer must pass SpriteRenderer into UIRenderer so item_icons can render',
);

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

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
const storyContentSystemDoc = await text('docs/story-content-system.md');
const dialogueSystemDoc = await text('docs/dialogue-system.md');
const storyFlavourIntegrationDoc = await text('docs/story-flavour-integration.md');
const runnerMain = await text('apps/runner/src/main.ts');
const runnerApp = await text('apps/runner/src/RunnerApp.ts');
const modeMenuSource = await text('apps/runner/src/game/ModeMenu.ts');
const titleSceneSource = await text('apps/runner/src/scenes/TitleScene.ts');
const storyProgressSummarySource = await text('apps/runner/src/game/StoryProgressSummary.ts');
const storyProgressMigrationSource = await text('apps/runner/src/game/StoryProgressMigration.ts');
const endingCardsSource = await text('apps/runner/src/game/EndingCards.ts');
const autosaveFeedbackSource = await text('apps/runner/src/storage/AutosaveFeedback.ts');
const storyBalanceRulesSource = await text('apps/runner/src/game/StoryBalanceRules.ts');
const campaignBarrelSource = await text('apps/runner/src/game/Campaign.ts');
const campaignSchemaSource = await text('apps/runner/src/game/campaign/schema.ts');
const campaignDataSource = await text('apps/runner/src/game/campaign/campaignData.ts');
const campaignSideQuestSource = await text('apps/runner/src/game/campaign/sideQuests.ts');
const campaignMinigameSource = await text('apps/runner/src/game/campaign/minigames.ts');
const campaignConsequenceSource = await text('apps/runner/src/game/campaign/branchConsequences.ts');
const runnerGameFlow = await text('apps/runner/src/game/GameFlow.ts');
const rendererSource = await text('apps/runner/src/renderer/Renderer.ts');
const uiRendererSource = await text('apps/runner/src/renderer/UIRenderer.ts');
const itemSystemSource = await text('apps/runner/src/systems/ItemSystem.ts');
const stageRunSceneSource = await text('apps/runner/src/scenes/StageRunScene.ts');
const stageRunOptionsSource = await text('apps/runner/src/game/StageRunOptions.ts');
const stageLayoutRegistrySource = await text('apps/runner/src/world/stageLayoutRegistry.ts');
const encounterGeneratorSource = await text('apps/runner/src/procgen/EncounterGenerator.ts');
const sideRoomGeneratorSource = await text('apps/runner/src/procgen/SideRoomGenerator.ts');
const endlessSprawlRunSource = await text('apps/runner/src/procgen/EndlessSprawlRun.ts');
const storyFlowSceneSource = await text('apps/runner/src/scenes/StoryFlowScene.ts');
const modeSceneFactoriesSource = await text('apps/runner/src/scenes/ModeSceneFactories.ts');
const dialoguePortraitRendererSource = await text('apps/runner/src/renderer/DialoguePortraitRenderer.ts');
const shopSceneSource = await text('apps/runner/src/scenes/ShopScene.ts');
const shopEngineSource = await text('packages/progression/src/ShopEngine.ts');
const companionSystemSource = await text('apps/runner/src/systems/CompanionSystem.ts');
const bossPhaseSystemSource = await text('apps/runner/src/systems/BossPhaseSystem.ts');
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

for (const required of [
	'Story Content System',
	'CampaignStage',
	'BossContract',
	'ChoiceOutcome',
	'BranchConsequence',
	'StageRunOptions',
	'EncounterGenerator',
	'EndlessSprawlRun',
	'tests/e2e/story-content.spec.ts',
]) {
	assert(storyContentSystemDoc.includes(required), `story content system doc missing: ${required}`);
}


for (const required of [
	'Dialogue System',
	'DialogueSpec',
	'DebriefSpec',
	'ChoiceOutcome',
	'BranchChoiceRecap',
	'badger:story-choice-recap',
	'BRANCH_DEBRIEF_LINES',
	'StoryFlowScene_controls',
	'StoryProgressMigration',
	'tests/e2e/story-choice-recap.spec.ts',
]) {
	assert(dialogueSystemDoc.includes(required), `dialogue system doc missing: ${required}`);
}


for (const required of [
	'Story Flavour Integration',
	'docs/story-flavour.yml',
	'data/story-content.generated.ts',
	'data/story-content.ts',
	'apps/runner/src/game/Campaign.ts',
	'StoryContentLoader',
	'GameFlow',
	'StageRunOptions',
	'tests/story-content-loader.mjs',
	'tests/e2e/story-content.spec.ts',
]) {
	assert(storyFlavourIntegrationDoc.includes(required), `story flavour integration doc missing: ${required}`);
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
	'renderCompanionStatus',
	'companionShield',
	'rookOverlayActive',
	'companionHint',
	'Naya shield',
	'Rook overlay active',
]) {
	assert(uiRendererSource.includes(required), `UIRenderer missing companion HUD status: ${required}`);
}





for (const required of [
	'StoryFlowSceneOptions',
	'BranchChoiceRecap',
	'getLastChoiceRecap',
	'buildChoiceRecap',
	'badger:story-choice-recap',
	'Branch recap:',
	'Heat ${formatSigned',
	'StageDebugDetail',
	'getLastDebugDetail',
	'toggleStageDebugPanel',
	'buildStageDebugDetail',
	'badger:stage-debug-detail',
	'Stage debug detail',
	"event.key.toLowerCase() === 'd'",
	'onStartStage',
	'buildStageRunSceneOptions(this.flow)',
	"event.key.toLowerCase() === 'r'",
	'D: debug',
]) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing StageRunScene launch/debug seam: ${required}`);
}
for (const required of [
	'stageModifiers?: { id: string; label: string; kind: string }[]',
	'stageModifiers: stage.stageModifiers?.map',
]) {
	assert(runnerGameFlow.includes(required), `GameFlow missing debug stage modifier projection: ${required}`);
}
for (const required of [
	'StageRunScene',
	'onStartStage: (stageOptions) =>',
	'const scene = new StageRunScene({ ...stageOptions, onReturnToTitle: options.onReturnToTitle })',
	'options.onStartStoryStage?.(scene)',
]) {
	assert(modeSceneFactoriesSource.includes(required), `ModeSceneFactories missing StoryFlow-to-StageRunScene wiring: ${required}`);
}

for (const required of [
	'BRANCH_DEBRIEF_LINES',
	'buildDebriefLines',
	'lio_protected',
	'colony_alignment_chorus',
	'ledger_public_dump',
	'cargo_full_release',
	'broadcast_publish_tools',
]) {
	assert(runnerGameFlow.includes(required), `GameFlow missing branch-specific debrief contract: ${required}`);
}

for (const required of [
	'createDefaultModeSceneFactories({',
	'onStartStoryStage: (scene) => sceneManager.replace(scene)',
	'onReturnToTitle: () => sceneManager.replace(createTitleScene())',
	'createLocalStorageSaveDriver(window.localStorage)',
	'loadGameFlow(saveDriver)',
	'storyProgress: flow.getStoryProgress()',
]) {
	assert(runnerApp.includes(required), `RunnerApp missing StoryFlow-to-StageRunScene scene replacement: ${required}`);
}
for (const [source, required] of [
	[modeSceneFactoriesSource, 'onReturnToTitle?: () => void'],
	[modeSceneFactoriesSource, 'new TrainingScene({ onReturnToTitle: options.onReturnToTitle })'],
	[modeSceneFactoriesSource, 'new VersusScene({ onReturnToTitle: options.onReturnToTitle })'],
	[modeSceneFactoriesSource, 'new SkillTreeScene({ onReturnToTitle: options.onReturnToTitle })'],
	[stageRunSceneSource, 'onReturnToTitle?: () => void'],
	[stageRunSceneSource, "event.code === 'Escape'"],
]) {
	assert(source.includes(required), `scene return-to-title contract missing: ${required}`);
}

for (const required of [
	'buildStageRunSceneOptions',
	'getCurrentStage()',
	'getStoryProgress()',
	'getActiveBranchConsequences(stage.id)',
	'stage && isRuntimeStageId(stage.id) ? stage.id : undefined',
	'acquiredPayloadIds: storyProgress.acquiredPayloads',
	'branchGameplayHooks',
	'procgenSeed',
	'generatedEnemyPacks',
	'generatedSideRooms',
	'bossPhases: stage?.boss?.phases?.map',
	'bossPlaceholder: stage?.boss',
	'tutorialBeats: stage?.tutorialBeats?.map',
]) {
	assert(stageRunOptionsSource.includes(required), `StageRunOptions missing GameFlow-to-StageRunScene adapter: ${required}`);
}
for (const required of [
	'RUNTIME_STAGE_IDS',
	'RuntimeStageId',
	'cloneStageLayout',
	'cargo_reversal_key_pickup',
	'asteroid_transmitter_root_pickup',
]) {
	assert(stageLayoutRegistrySource.includes(required), `stageLayoutRegistry missing runtime stage layout contract: ${required}`);
}
for (const required of [
	'RuntimeTutorialBeat',
	'RuntimeBossPlaceholder',
	'bossPlaceholder?: RuntimeBossPlaceholder',
	'getBossPlaceholder',
	'badger:boss-placeholder',
	'createBossPlaceholder',
	'tutorialBeats?: readonly RuntimeTutorialBeat[]',
	'getTutorialOverlayBeats',
	'badger:tutorial-overlay',
	'renderTutorialOverlay',
	'Tutorial beats',
	'stageId?: RuntimeStageId',
	'cloneStageLayout(this.options.stageId)',
	'generatedEnemyPacks?: readonly GeneratedEnemyPack[]',
	'generatedSideRooms?: readonly GeneratedSideRoom[]',
	'this.encounterGenerator.generatePacks',
	'sideRooms.flatMap((room) => room.platforms)',
]) {
	assert(stageRunSceneSource.includes(required), `StageRunScene missing runtime stage layout/procgen selection: ${required}`);
}
for (const required of [
	'EncounterGenerator',
	'SeededRng',
	'DEFAULT_ENEMY_FAMILIES',
	'DEFAULT_AFFIXES',
	'DEFAULT_STAGE_PROFILES',
	'generatePack',
	'forbiddenWith',
	'procgenAffixes',
]) {
	assert(encounterGeneratorSource.includes(required), `EncounterGenerator missing procedural enemy contract: ${required}`);
}
for (const required of [
	'buildEndlessSprawlRun',
	'ENDLESS_STAGE_ROTATION',
	'enemyPackCount',
	'sideRoomCount',
	'ambush_warning_overlay',
]) {
	assert(endlessSprawlRunSource.includes(required), `EndlessSprawlRun missing endless mode contract: ${required}`);
}

for (const required of [
	"export * from './campaign/schema'",
	"export { CAMPAIGN } from './campaign/campaignData'",
	"export { CAMPAIGN_SIDE_QUESTS } from './campaign/sideQuests'",
	"export { CAMPAIGN_MINIGAMES } from './campaign/minigames'",
	"export { BRANCH_CONSEQUENCES } from './campaign/branchConsequences'",
]) {
	assert(campaignBarrelSource.includes(required), `Campaign barrel missing split export: ${required}`);
}
for (const [source, required] of [
	[campaignSchemaSource, 'export interface CampaignStage'],
	[campaignDataSource, 'export const CAMPAIGN'],
	[campaignSideQuestSource, 'export const CAMPAIGN_SIDE_QUESTS'],
	[campaignMinigameSource, 'export const CAMPAIGN_MINIGAMES'],
	[campaignConsequenceSource, 'export const BRANCH_CONSEQUENCES'],
]) {
	assert(source.includes(required), `campaign content split missing marker: ${required}`);
}


for (const required of [
	'buildStoryBalanceRules',
	'merchantPriceModifier',
	'allyAssistLevel',
	'hazardIntensity',
	'endingTone',
	'getPriceModifier',
]) {
	assert(storyBalanceRulesSource.includes(required), `StoryBalanceRules missing heat/favor balance contract: ${required}`);
}
for (const required of [
	'balanceRules = buildStoryBalanceRules(meta, storyProgress)',
	'balanceRules,',
]) {
	assert(stageRunOptionsSource.includes(required), `StageRunOptions missing story balance projection: ${required}`);
}
for (const required of [
	'balanceRules?: StoryBalanceRules',
	'getBalanceRules',
	'badger:story-balance',
	'renderBalanceOverlay',
	'Story balance',
]) {
	assert(stageRunSceneSource.includes(required), `StageRunScene missing story balance runtime surface: ${required}`);
}


for (const required of [
	'autosaveGameFlow',
	'AutosaveReason',
	'Autosaved branch choice',
	'Autosaved stage progress',
	'Autosaved skill purchase',
	'Autosaved campaign completion',
	'badger:autosave-feedback',
]) {
	assert(autosaveFeedbackSource.includes(required), `AutosaveFeedback missing visible autosave contract: ${required}`);
}
for (const required of [
	"onAutosave?: (reason: 'branch-choice')",
	'getLastAutosaveFeedback',
	'renderAutosaveFeedback',
	"this.options.onAutosave?.('branch-choice')",
]) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing autosave feedback surface: ${required}`);
}
for (const required of [
	'autosaveGameFlow(saveDriver, flow, reason)',
	'onAutosave: (reason) => autosaveGameFlow(saveDriver, flow, reason)',
]) {
	assert(runnerApp.includes(required), `RunnerApp missing autosave feedback wiring: ${required}`);
}


for (const required of [
	'buildEndingCard',
	'getEndingCards',
	'Abolish Skylock',
	'Chorus Control',
	'Publish the Tools',
	'broadcast_abolish_skylock',
	'broadcast_chorus_control',
	'broadcast_publish_tools',
]) {
	assert(endingCardsSource.includes(required), `EndingCards missing final doctrine contract: ${required}`);
}
for (const required of [
	'getEndingCard',
	'renderEndingCard',
	'badger:ending-card',
	'buildEndingCard(this.options.storyProgress)',
]) {
	assert(titleSceneSource.includes(required), `TitleScene missing ending card surface: ${required}`);
}

for (const required of [
	'STORY_PROGRESS_SCHEMA_VERSION',
	'createDefaultStoryProgress',
	'migrateStoryProgress',
	'schema-v2-story-branches',
	'lio-trust-inferred',
	'colony-alignment-inferred',
	'final-broadcast-doctrine-inferred',
]) {
	assert(storyProgressMigrationSource.includes(required), `StoryProgressMigration missing save migration contract: ${required}`);
}
for (const required of [
	'loadGameFlow(saveDriver)',
	'createLocalStorageSaveDriver(window.localStorage)',
]) {
	assert(runnerApp.includes(required), `RunnerApp missing save-backed GameFlow load: ${required}`);
}

for (const required of [
	'buildStoryProgressSummary',
	'formatStoryProgressSummary',
	'badger:title-progress-summary',
	'getStoryProgressSummary',
	'Final doctrine:',
]) {
	assert(titleSceneSource.includes(required) || storyProgressSummarySource.includes(required), `title progress summary missing: ${required}`);
}

for (const required of ['endless', 'Endless Sprawl']) {
	assert(
		modeSceneFactoriesSource.includes(required) || runnerGameFlow.includes(required) || runnerApp.includes(required) || modeMenuSource.includes(required),
		`endless mode route missing: ${required}`
	);
}

for (const required of [
	'SideRoomGenerator',
	'DEFAULT_ROOM_CHUNKS',
	'generateSideRooms',
	'GeneratedSideRoom',
	'platforms: this.buildPlatforms(anchorX)',
	'pickups: this.buildPickups',
	'enemyPacks',
]) {
	assert(sideRoomGeneratorSource.includes(required), `SideRoomGenerator missing optional side-room contract: ${required}`);
}

for (const required of [
	'BossPhaseSystem',
	'RuntimeBossPhase',
	'BossPhaseRuntimeState',
	'applyPhasePressure',
	'bossPhaseLabel',
	'bossPhaseMechanic',
]) {
	assert(bossPhaseSystemSource.includes(required), `BossPhaseSystem missing runtime boss phase contract: ${required}`);
}
for (const required of [
	'bossPhases?: readonly RuntimeBossPhase[]',
	'private bossPhases: BossPhaseSystem',
	'this.bossPhases.step',
	'bossPhaseHint',
]) {
	assert(stageRunSceneSource.includes(required), `StageRunScene missing boss phase runtime wiring: ${required}`);
}
assert(rendererSource.includes('enemy.bossPhaseLabel'), 'Renderer must draw boss phase overlays');
assert(uiRendererSource.includes('bossPhaseHint'), 'UIRenderer must surface active boss phase hints');

for (const required of [
	'CompanionGameplayModifiers',
	'resolveCompanionGameplayModifiers',
	'naya_shield_bonus',
	'ambush_warning_overlay',
	'companion_assist_ready',
	'companion_assist_delay',
]) {
	assert(companionSystemSource.includes(required), `CompanionSystem missing branch gameplay modifier contract: ${required}`);
}
for (const required of [
	'branchGameplayHooks?: readonly string[]',
	'resolveCompanionGameplayModifiers(options.branchGameplayHooks ?? [])',
]) {
	assert(stageRunSceneSource.includes(required), `StageRunScene missing branch gameplay hook option: ${required}`);
}

for (const required of [
	'CompanionSystem',
	'naya_root',
	'rook_null',
	'auntie_subharmonic',
	'mitigateDamage',
	'rookOverlayUntil',
	'auntieHint',
]) {
	assert(companionSystemSource.includes(required), `CompanionSystem missing runtime companion contract: ${required}`);
}
for (const required of [
	'private companions: CompanionSystem',
	'mitigateDamage: (amount)',
	'this.companions.step',
	'companionShield',
	'rookMarked',
	'companionHint',
]) {
	assert(stageRunSceneSource.includes(required), `StageRunScene missing companion gameplay wiring: ${required}`);
}
assert(rendererSource.includes('enemy.rookMarked'), 'Renderer must draw Rook-marked enemy overlays');

for (const required of [
	'chapterId: string',
	'toChapterId',
	'completedChapterIds',
	'getCurrentChapterId',
	'getCompletedChapterIds',
]) {
	assert(runnerGameFlow.includes(required), `GameFlow missing chapter progression bridge: ${required}`);
}




for (const [source, required] of [
	[campaignSchemaSource, 'BranchConsequence'],
	[campaignConsequenceSource, 'BRANCH_CONSEQUENCES'],
	[campaignConsequenceSource, 'companion_assist_ready'],
	[campaignConsequenceSource, 'final_broadcast_toolkit'],
]) {
	assert(source.includes(required), `Campaign split missing branch consequence contract: ${required}`);
}
for (const required of [
	'type BranchConsequence',
	'getActiveBranchConsequences',
	'BRANCH_CONSEQUENCES.filter',
	'resultFlags.has(consequence.resultFlag)',
]) {
	assert(runnerGameFlow.includes(required), `GameFlow missing active branch consequence API: ${required}`);
}
for (const required of [
	'getActiveBranchConsequences(stage.id)',
	'Branch effect:',
	'branchConsequence.uiHint.slice',
]) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing branch consequence panel rendering: ${required}`);
}

for (const required of ['type BossPhase', 'phases?: BossPhase[]', 'phases: stage.boss.phases?.map((phase) => ({ ...phase }))']) {
	assert(runnerGameFlow.includes(required), `GameFlow missing boss phase projection: ${required}`);
}
for (const required of ['stage.boss?.phases?.[0]', 'Boss phase:', 'bossPhase.mechanic.slice']) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing boss phase panel rendering: ${required}`);
}

for (const [source, required] of [
	[campaignSchemaSource, 'StageMinigame'],
	[campaignMinigameSource, 'CAMPAIGN_MINIGAMES'],
	[campaignMinigameSource, 'toll-gate-rhythm'],
	[campaignMinigameSource, 'public-toolkit-broadcast'],
]) {
	assert(source.includes(required), `Campaign split missing minigame integration: ${required}`);
}
for (const required of ['minigames?: StageMinigame[]', 'minigames: stage.minigames?.map']) {
	assert(runnerGameFlow.includes(required), `GameFlow missing minigame stage projection: ${required}`);
}
for (const required of ['stage.minigames?.[0]', 'Minigame:', 'minigame.kind']) {
	assert(storyFlowSceneSource.includes(required), `StoryFlowScene missing minigame panel rendering: ${required}`);
}

for (const [source, required] of [
	[campaignSchemaSource, 'SideQuest'],
	[campaignSideQuestSource, 'CAMPAIGN_SIDE_QUESTS'],
	[campaignSideQuestSource, 'meter-maidens-ledger'],
	[campaignSideQuestSource, 'tools-not-heroes'],
]) {
	assert(source.includes(required), `Campaign split missing side quest integration: ${required}`);
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

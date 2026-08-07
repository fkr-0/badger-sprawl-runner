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
const companionSystemDoc = await text('docs/companion-system.md');
const runnerMain = await text('apps/runner/src/main.ts');
const runnerApp = await text('apps/runner/src/RunnerApp.ts');
const runnerIndex = await text('apps/runner/index.html');
const rootIndex = await text('index.html');
const runtimeEnvironmentSource = await text('apps/runner/src/runtime/RuntimeEnvironment.ts');
const modeMenuSource = await text('apps/runner/src/game/ModeMenu.ts');
const titleSceneSource = await text('apps/runner/src/scenes/TitleScene.ts');
const storyProgressSummarySource = await text('apps/runner/src/game/StoryProgressSummary.ts');
const storyProgressMigrationSource = await text('apps/runner/src/game/StoryProgressMigration.ts');
const endingCardsSource = await text('apps/runner/src/game/EndingCards.ts');
const autosaveFeedbackSource = await text('apps/runner/src/storage/AutosaveFeedback.ts');
const storyBalanceRulesSource = await text('apps/runner/src/game/StoryBalanceRules.ts');
const stageRuntimeConfigSource = await text('apps/runner/src/game/StageRuntimeConfig.ts');
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
const lateStageObjectivesSource = await text('apps/runner/src/game/LateStageObjectives.ts');
const stageRunOptionsSource = await text('apps/runner/src/game/StageRunOptions.ts');
const stageLayoutRegistrySource = await text('apps/runner/src/world/stageLayoutRegistry.ts');
const encounterGeneratorSource = await text('apps/runner/src/procgen/EncounterGenerator.ts');
const sideRoomGeneratorSource = await text('apps/runner/src/procgen/SideRoomGenerator.ts');
const endlessSprawlRunSource = await text('apps/runner/src/procgen/EndlessSprawlRun.ts');
const storyFlowSceneSource = await text('apps/runner/src/scenes/StoryFlowScene.ts');
const modeSceneFactoriesSource = await text('apps/runner/src/scenes/ModeSceneFactories.ts');
const trainingSceneSource = await text('apps/runner/src/scenes/TrainingScene.ts');
const trainingModeSource = await text('apps/runner/src/game/TrainingMode.ts');
const trainingDummySource = await text('apps/runner/src/actors/TrainingDummy.ts');
const trainingStageSelectionSource = await text('apps/runner/src/game/TrainingStageSelection.ts');
const gameplayHudLayoutSource = await text('apps/runner/src/renderer/GameplayHudLayout.ts');
const meleeComboSource = await text('apps/runner/src/systems/MeleeComboSystem.ts');
const dialoguePortraitRendererSource = await text(
	'apps/runner/src/renderer/DialoguePortraitRenderer.ts'
);
const shopSceneSource = await text('apps/runner/src/scenes/ShopScene.ts');
const shopEngineSource = await text('packages/progression/src/ShopEngine.ts');
const locationSceneSource = await text('apps/runner/src/scenes/LocationScene.ts');
const worldServiceDirectorSource = await text(
	'apps/runner/src/game/adventure/WorldServiceDirector.ts'
);
const companionSystemSource = await text('apps/runner/src/systems/CompanionSystem.ts');
const bossPhaseSystemSource = await text('apps/runner/src/systems/BossPhaseSystem.ts');
const campaignSource = await text('apps/runner/src/game/Campaign.ts');
const animationStateSource = await text('apps/runner/src/renderer/AnimationState.ts');
const spritePlaybackSource = await text('packages/sprite-contracts/src/playback.ts');
const modeRouter = await text('apps/runner/src/game/ModeRouter.ts');
const modeSceneFactories = await text('apps/runner/src/scenes/ModeSceneFactories.ts');
const smokeMain = await text('apps/runner/src/smokeMain.ts');
const legacyMain = await text('src/main.js');
const manifest = await json('data/game-manifest.json');
const items = await json('data/items.json');
const sprites = await json('data/sprites.json');

assert(
	!lateStageObjectivesSource.includes('solutionIndexes'),
	'LateStageObjectives must not expose authored solution indexes through the production snapshot'
);

for (const required of [
	"'fasttype'",
	"'cargo-routing'",
	"'broadcast-composition'",
	'interface-started',
	'interface-failed',
	'interface-completed',
	'handleInterfaceKey',
	'incorrectColumnIds',
	'assistActive',
	'completeActiveInterface',
]) {
	assert(
		lateStageObjectivesSource.includes(required),
		`LateStageObjectives missing dedicated late-campaign interface contract: ${required}`
	);
}
for (const required of [
	'renderLateStageInterface',
	'renderFastTypeInterface',
	'renderSelectionInterface',
	'lateStageObjectives?.step(dt)',
	'lateStageObjectives?.handleInterfaceKey(event)',
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing dedicated late-campaign interface wiring: ${required}`
	);
}

assert(
	rootPackage.version === runnerPackage.version,
	'root and runner package versions must stay aligned'
);
assert(
	/^1\.\d+\.\d+$/.test(rootPackage.version),
	'release package version must remain valid v1 semver'
);

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
	assert(
		storyFlavourIntegrationDoc.includes(required),
		`story flavour integration doc missing: ${required}`
	);
}

for (const required of [
	'Companion System',
	'CompanionSystem.ts',
	'naya_root',
	'rook_null',
	'auntie_subharmonic',
	'companion_assist_ready',
	'companion_assist_delay',
	'naya_shield_bonus',
	'ambush_warning_overlay',
	'StoryBalanceRules',
	'murr_murrby',
]) {
	assert(companionSystemDoc.includes(required), `companion system doc missing: ${required}`);
}

for (const phrase of [
	'v1.0 release scope',
	'apps/runner',
	'legacy static prototype',
	'pnpm run verify:release',
	'pnpm run stage:artifact-lab',
	'deploy-release-dry-run',
]) {
	assert(readme.includes(phrase), `README missing release/deploy phrase: ${phrase}`);
}

for (const script of [
	'verify:release',
	'test:e2e:drainmarket',
	'test:e2e:chrome-arcology',
	'test:e2e:mirror-palace',
	'test:e2e:dub-colony',
	'test:e2e:progression',
	'stage:artifact-lab',
	'deploy:artifact-lab:dry-run',
	'deploy:artifact-lab',
]) {
	assert(rootPackage.scripts[script], `root package is missing gated release script: ${script}`);
}

for (const required of ['createRunnerApp', 'app.start()', 'runtimeToolsEnabled']) {
	assert(
		runnerMain.includes(required),
		`runner entrypoint missing clean production bootstrap surface: ${required}`
	);
}
assert(
	!runnerMain.includes('SceneManager shell'),
	'runner entrypoint must not expose legacy debug copy'
);
assert(!runnerIndex.includes('hud-panel'), 'runner index must not expose the legacy header shell');
assert(!runnerIndex.includes('status-grid'), 'runner index must not expose legacy status panels');
assert(
	rootIndex.includes('./apps/runner/dist/index.html'),
	'root artifact entry must redirect to the built runner'
);
for (const required of ['resolveRuntimeAssetUrl', 'data/sprites.json', 'badger:sprites-ready']) {
	assert(
		runnerApp.includes(required),
		`RunnerApp missing production sprite bootstrap: ${required}`
	);
}
for (const required of ["assetPath.replace(/^\\/+/, '')", "searchParams.get('debug') === '1'"]) {
	assert(
		runtimeEnvironmentSource.includes(required),
		`runtime environment missing mount-safe production rule: ${required}`
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
	'createTrainingStageSeed',
	'selectTrainingStage',
	'new StageRunScene',
	'getTrainingState',
	'getGameplayHudLayoutSnapshot',
	'onRerollStage',
]) {
	assert(
		trainingSceneSource.includes(required),
		`TrainingScene missing composed runtime contract: ${required}`
	);
}
for (const required of [
	'showHitboxes',
	'showHurtboxes',
	'showFrameData',
	'showDamageNumbers',
	'lastHitDamage',
	'comboDamage',
	'hitsPerSecond',
	'railReloadDeltaMs',
	'parryWindowDeltaMs',
	'meleeActiveFrames',
	'recoveryFrames',
	'hackCastTimeMs',
]) {
	assert(
		trainingModeSource.includes(required),
		`TrainingMode missing live measurement contract: ${required}`
	);
}
for (const required of [
	'Number.POSITIVE_INFINITY',
	'configureTrainingDummy',
	"case 'walking'",
	"case 'jumping'",
	"case 'attacking'",
	"case 'flying'",
	'usesPatternController: true',
]) {
	assert(
		trainingDummySource.includes(required),
		`TrainingDummy missing behavior contract: ${required}`
	);
}
for (const required of ['RUNTIME_STAGE_IDS', 'hashSeed', 'previousStageId']) {
	assert(
		trainingStageSelectionSource.includes(required),
		`training stage selection missing deterministic random-stage contract: ${required}`
	);
}
for (const required of [
	'buildGameplayHudLayout',
	'vitals',
	'companions',
	'objective',
	'combat',
	'gear',
	'context',
]) {
	assert(
		gameplayHudLayoutSource.includes(required),
		`gameplay HUD layout missing release contract: ${required}`
	);
}
for (const required of ['targetId: enemy.id', 'moveId: move.id']) {
	assert(
		meleeComboSource.includes(required),
		`melee telemetry missing observable hit contract: ${required}`
	);
}

for (const required of [
	'renderCompanionStatus',
	'companionShield',
	'rookOverlayActive',
	'companionHint',
	'Naya shield',
	'Rook overlay active',
]) {
	assert(
		uiRendererSource.includes(required),
		`UIRenderer missing companion HUD status: ${required}`
	);
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
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing StageRunScene launch/debug seam: ${required}`
	);
}
for (const required of [
	'stageModifiers?: StageModifier[]',
	'stageModifiers: stage.stageModifiers?.map',
	'type StageModifier',
	'type StageTemplate',
]) {
	assert(
		runnerGameFlow.includes(required),
		`GameFlow missing debug stage modifier projection: ${required}`
	);
}
for (const required of [
	'StageRunScene',
	'onStartStage: (stageOptions) =>',
	'const scene = new StageRunScene({',
	'onStageComplete: options.onCompleteStoryStage',
	'options.onStartStoryStage?.(scene)',
]) {
	assert(
		modeSceneFactoriesSource.includes(required),
		`ModeSceneFactories missing StoryFlow-to-StageRunScene wiring: ${required}`
	);
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
	assert(
		runnerGameFlow.includes(required),
		`GameFlow missing branch-specific debrief contract: ${required}`
	);
}

for (const required of [
	'createDefaultModeSceneFactories({',
	'onStartStoryStage: (scene) => sceneManager.replace(scene)',
	'onReturnToTitle: () => sceneManager.replace(createTitleScene())',
	'createLocalStorageSaveDriver(window.localStorage)',
	'loadGameSession(saveDriver)',
	'storyProgress: flow.getStoryProgress()',
]) {
	assert(
		runnerApp.includes(required),
		`RunnerApp missing StoryFlow-to-StageRunScene scene replacement: ${required}`
	);
}
for (const [source, required] of [
	[modeSceneFactoriesSource, 'onReturnToTitle?: () => void'],
	[modeSceneFactoriesSource, 'new TrainingScene({ onReturnToTitle: options.onReturnToTitle })'],
	[modeSceneFactoriesSource, 'new VersusScene({ onReturnToTitle: options.onReturnToTitle })'],
	[modeSceneFactoriesSource, 'new SkillTreeScene({'],
	[modeSceneFactoriesSource, 'flow: storyFlow'],
	[modeSceneFactoriesSource, 'onAutosave: options.onAutosave'],
	[stageRunSceneSource, 'onReturnToTitle?: () => void'],
	[stageRunSceneSource, "event.code === 'Escape'"],
]) {
	assert(source.includes(required), `scene return-to-title contract missing: ${required}`);
}

for (const required of [
	'buildStageRuntimeConfig',
	'cameraPressure',
	'payloadRewardId',
	'bossPlaceholderId',
	'modifierRules',
	'beat-timing',
	'code-gate-pressure',
]) {
	assert(
		stageRuntimeConfigSource.includes(required),
		`StageRuntimeConfig missing runtime mapping contract: ${required}`
	);
}
for (const required of ['const runtimeConfig = buildStageRuntimeConfig(stage)', 'runtimeConfig,']) {
	assert(
		stageRunOptionsSource.includes(required),
		`StageRunOptions missing runtime config projection: ${required}`
	);
}
for (const required of [
	'runtimeConfig?: StageRuntimeConfig',
	'getRuntimeConfig',
	'badger:stage-runtime-config',
	'renderRuntimeConfigOverlay',
	'Stage runtime config',
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing runtime config surface: ${required}`
	);
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
	'const boss = stage?.boss',
	'const bossPhases =',
	'boss?.phases?.map',
	'boss?.behavior?.phases.map',
	'boss?.hackDuel?.mechanics.map',
	'bossPhases,',
	'bossPlaceholder: boss',
	'tutorialBeats: stage?.tutorialBeats?.map',
	'runtimeConfig,',
]) {
	assert(
		stageRunOptionsSource.includes(required),
		`StageRunOptions missing GameFlow-to-StageRunScene adapter: ${required}`
	);
}
for (const required of [
	'RUNTIME_STAGE_IDS',
	'RuntimeStageId',
	'cloneStageLayout',
	'cargo_reversal_key_pickup',
	'asteroid_transmitter_root_pickup',
]) {
	assert(
		stageLayoutRegistrySource.includes(required),
		`stageLayoutRegistry missing runtime stage layout contract: ${required}`
	);
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
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing runtime stage layout/procgen selection: ${required}`
	);
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
	assert(
		encounterGeneratorSource.includes(required),
		`EncounterGenerator missing procedural enemy contract: ${required}`
	);
}
for (const required of [
	'buildEndlessSprawlRun',
	'ENDLESS_STAGE_ROTATION',
	'enemyPackCount',
	'sideRoomCount',
	'ambush_warning_overlay',
]) {
	assert(
		endlessSprawlRunSource.includes(required),
		`EndlessSprawlRun missing endless mode contract: ${required}`
	);
}

for (const required of [
	"export * from './campaign/schema'",
	"export { CAMPAIGN } from './campaign/campaignData'",
	"export { CAMPAIGN_SIDE_QUESTS } from './campaign/sideQuests'",
	"export { CAMPAIGN_MINIGAMES } from './campaign/minigames'",
	"export { BRANCH_CONSEQUENCES } from './campaign/branchConsequences'",
]) {
	assert(
		campaignBarrelSource.includes(required),
		`Campaign barrel missing split export: ${required}`
	);
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
	assert(
		storyBalanceRulesSource.includes(required),
		`StoryBalanceRules missing heat/favor balance contract: ${required}`
	);
}
for (const required of [
	'balanceRules = buildStoryBalanceRules(meta, storyProgress)',
	'balanceRules,',
]) {
	assert(
		stageRunOptionsSource.includes(required),
		`StageRunOptions missing story balance projection: ${required}`
	);
}
for (const required of [
	'balanceRules?: StoryBalanceRules',
	'getBalanceRules',
	'badger:story-balance',
	'renderBalanceOverlay',
	'Story balance',
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing story balance runtime surface: ${required}`
	);
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
	assert(
		autosaveFeedbackSource.includes(required),
		`AutosaveFeedback missing visible autosave contract: ${required}`
	);
}
for (const required of [
	'onAutosave?: (reason: AutosaveReason)',
	'getLastAutosaveFeedback',
	'renderAutosaveFeedback',
	"this.options.onAutosave?.('branch-choice')",
]) {
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing autosave feedback surface: ${required}`
	);
}
for (const required of [
	'onAutosave: (reason) =>',
	'autosaveGameFlow(saveDriver, flow, reason, adventure.getAdventureState())',
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
	assert(
		endingCardsSource.includes(required),
		`EndingCards missing final doctrine contract: ${required}`
	);
}
for (const required of [
	'getEndingCard',
	'renderEndingCard',
	'badger:ending-card',
	'buildEndingCard(this.options.storyProgress)',
]) {
	assert(
		titleSceneSource.includes(required),
		`TitleScene missing ending card surface: ${required}`
	);
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
	assert(
		storyProgressMigrationSource.includes(required),
		`StoryProgressMigration missing save migration contract: ${required}`
	);
}
for (const required of [
	'loadGameSession(saveDriver)',
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
	assert(
		titleSceneSource.includes(required) || storyProgressSummarySource.includes(required),
		`title progress summary missing: ${required}`
	);
}

for (const required of ['endless', 'Endless Sprawl']) {
	assert(
		modeSceneFactoriesSource.includes(required) ||
			runnerGameFlow.includes(required) ||
			runnerApp.includes(required) ||
			modeMenuSource.includes(required),
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
	assert(
		sideRoomGeneratorSource.includes(required),
		`SideRoomGenerator missing optional side-room contract: ${required}`
	);
}

for (const required of [
	'BossPhaseSystem',
	'RuntimeBossPhase',
	'BossPhaseRuntimeState',
	'applyPhasePressure',
	'bossPhaseLabel',
	'bossPhaseMechanic',
]) {
	assert(
		bossPhaseSystemSource.includes(required),
		`BossPhaseSystem missing runtime boss phase contract: ${required}`
	);
}
for (const required of [
	'bossPhases?: readonly RuntimeBossPhase[]',
	'private bossPhases: BossPhaseSystem',
	'this.bossPhases.step',
	'bossPhaseHint',
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing boss phase runtime wiring: ${required}`
	);
}
assert(rendererSource.includes('enemy.bossPhaseLabel'), 'Renderer must draw boss phase overlays');
assert(
	uiRendererSource.includes('bossPhaseHint'),
	'UIRenderer must surface active boss phase hints'
);

for (const required of [
	'CompanionGameplayModifiers',
	'resolveCompanionGameplayModifiers',
	'naya_shield_bonus',
	'ambush_warning_overlay',
	'companion_assist_ready',
	'companion_assist_delay',
]) {
	assert(
		companionSystemSource.includes(required),
		`CompanionSystem missing branch gameplay modifier contract: ${required}`
	);
}
for (const required of [
	'branchGameplayHooks?: readonly string[]',
	'resolveCompanionGameplayModifiers(options.branchGameplayHooks ?? [])',
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing branch gameplay hook option: ${required}`
	);
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
	assert(
		companionSystemSource.includes(required),
		`CompanionSystem missing runtime companion contract: ${required}`
	);
}
for (const required of [
	'private companions: CompanionSystem',
	'mitigateDamage: (amount)',
	'this.companions.step',
	'companionShield',
	'rookMarked',
	'companionHint',
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing companion gameplay wiring: ${required}`
	);
}
assert(
	rendererSource.includes('enemy.rookMarked'),
	'Renderer must draw Rook-marked enemy overlays'
);

for (const required of [
	'chapterId: string',
	'toChapterId',
	'completedChapterIds',
	'getCurrentChapterId',
	'getCompletedChapterIds',
]) {
	assert(
		runnerGameFlow.includes(required),
		`GameFlow missing chapter progression bridge: ${required}`
	);
}

for (const [source, required] of [
	[campaignSchemaSource, 'BranchConsequence'],
	[campaignConsequenceSource, 'BRANCH_CONSEQUENCES'],
	[campaignConsequenceSource, 'companion_assist_ready'],
	[campaignConsequenceSource, 'final_broadcast_toolkit'],
]) {
	assert(
		source.includes(required),
		`Campaign split missing branch consequence contract: ${required}`
	);
}
for (const required of [
	'type BranchConsequence',
	'getActiveBranchConsequences',
	'BRANCH_CONSEQUENCES.filter',
	'resultFlags.has(consequence.resultFlag)',
]) {
	assert(
		runnerGameFlow.includes(required),
		`GameFlow missing active branch consequence API: ${required}`
	);
}
for (const required of [
	'getActiveBranchConsequences(stage.id)',
	'Branch effect:',
	'branchConsequence.uiHint',
]) {
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing branch consequence panel rendering: ${required}`
	);
}

for (const required of [
	'type BossPhase',
	'phases?: BossPhase[]',
	'phases: stage.boss.phases?.map((phase) => ({ ...phase }))',
]) {
	assert(runnerGameFlow.includes(required), `GameFlow missing boss phase projection: ${required}`);
}
for (const required of ['stage.boss?.phases?.[0]', 'Boss phase:', 'bossPhase.mechanic']) {
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing boss phase panel rendering: ${required}`
	);
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
	assert(
		runnerGameFlow.includes(required),
		`GameFlow missing minigame stage projection: ${required}`
	);
}
for (const required of ['stage.minigames?.[0]', 'Minigame:', 'minigame.kind']) {
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing minigame panel rendering: ${required}`
	);
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
	assert(
		runnerGameFlow.includes(required),
		`GameFlow missing side quest stage projection: ${required}`
	);
}
for (const required of ['stage.sideQuests?.[0]', 'Side job:', 'sideQuest.objective']) {
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing side quest panel rendering: ${required}`
	);
}

for (const required of [
	'getPriceModifier',
	'heatMarkup',
	'favorDiscount',
	'guileDiscount',
	'priceModifier',
]) {
	assert(
		shopEngineSource.includes(required),
		`ShopEngine missing heat/favor economy pricing: ${required}`
	);
}
for (const required of [
	'LEGACY_SHOP_SCENE_QUARANTINED',
	'NO SHADOW SHOP',
	'WorldServiceDirector inside LocationScene',
	'performs no save reads and no save writes',
]) {
	assert(
		shopSceneSource.includes(required),
		`ShopScene missing shadow-economy quarantine contract: ${required}`
	);
}
for (const required of [
	'getShopOffer',
	'purchaseItem',
	'projectOffer',
	'meta.orbitHeat',
	'meta.dubFavor',
	'executeTransaction',
	'spendCredchips',
	'getEconomyTelemetry',
]) {
	assert(
		worldServiceDirectorSource.includes(required),
		`WorldServiceDirector missing canonical trust/heat economy ownership: ${required}`
	);
}
for (const required of [
	'new WorldServiceDirector',
	'this.services.getShopOffer',
	'this.services.purchaseItem',
	'onAutosaveWorld',
]) {
	assert(
		locationSceneSource.includes(required),
		`LocationScene missing canonical world-service shop wiring: ${required}`
	);
}

for (const required of ['getCurrentStage()', 'choiceOutcomes: stage.choiceOutcomes?.map']) {
	assert(
		runnerGameFlow.includes(required),
		`GameFlow missing current-stage choice API: ${required}`
	);
}
for (const required of [
	'renderStageChoicePanel',
	'handleKeyDown',
	'chooseStageChoice',
	'ArrowUp',
	'ArrowDown',
	'/^[1-9]$/',
	'lastChoiceResult',
	'getCurrentStage()',
	'syncStageSelection',
	'startCurrentStage()',
	'selectionCommitted',
	'fitText',
]) {
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing stage choice UI wiring: ${required}`
	);
}

for (const required of [
	'advanceSpriteAnimation',
	'collectArcadeSpriteAnimationEvents',
	'completedThisStep',
	'advancedFrames',
	'events',
]) {
	assert(
		spritePlaybackSource.includes(required),
		`Shared sprite playback missing animation event API: ${required}`
	);
}
for (const required of ['advanceAnimationStep', 'SpriteAnimationPlaybackStep']) {
	assert(
		animationStateSource.includes(required),
		`AnimationState missing shared playback facade: ${required}`
	);
}
for (const required of [
	'advanceAnimationFrames',
	'advanceAnimationStep',
	'step.events',
	'emitAnimationEvent',
	"case 'footstep'",
	"case 'vfx'",
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing animation event dispatch: ${required}`
	);
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
		`DialoguePortraitRenderer missing portrait contract: ${required}`
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
	assert(
		storyFlowSceneSource.includes(required),
		`StoryFlowScene missing dialogue portrait wiring: ${required}`
	);
}
assert(
	rendererSource.includes('DialoguePortraitRenderer') &&
		rendererSource.includes('renderDialoguePortrait'),
	'Renderer must expose DialoguePortraitRenderer through renderDialoguePortrait'
);

for (const required of [
	'isStoryPayloadPickup',
	'applyPersistedPayloadPickups',
	'getCollectedStoryPayloadIds',
	"pickup.persistence === 'story_payload'",
]) {
	assert(
		itemSystemSource.includes(required),
		`ItemSystem missing story payload persistence contract: ${required}`
	);
}
for (const required of [
	'StageRunSceneOptions',
	'acquiredPayloadIds',
	'onStoryPayloadCollected',
	'applyPersistedPayloadPickups(this.pickups',
]) {
	assert(
		stageRunSceneSource.includes(required),
		`StageRunScene missing story payload persistence wiring: ${required}`
	);
}

for (const required of [
	'HUD_ICON_SHEET',
	'item_icons',
	'rocket_backpack_icon',
	'railgun_icon',
	'katana_icon',
	'stim_pack_icon',
	'getHudIconSlots',
]) {
	assert(
		uiRendererSource.includes(required),
		`UIRenderer missing item icon HUD contract: ${required}`
	);
}
assert(
	/spriteRenderer\.drawFrame\(\s*HUD_ICON_SHEET/.test(uiRendererSource),
	'UIRenderer must draw HUD item icons from HUD_ICON_SHEET'
);
assert(
	/this\.uiRenderer\.render\(\s*this\.ctx,\s*player,\s*camera,\s*this\.spriteRenderer(?:\s*,|\s*\))/.test(
		rendererSource
	),
	'Renderer must pass SpriteRenderer into UIRenderer so item_icons can render'
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

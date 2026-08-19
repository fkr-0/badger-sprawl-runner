import { readFile } from 'node:fs/promises';
import {
	advanceArcadeAnimationClock,
	createArcadeAnimationClock,
	playArcadeAnimationClock,
} from '@arcade/runtime/animation';

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

async function text(path) {
	return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

async function json(path) {
	return JSON.parse(await text(path));
}

const animationPlan = await text('animation.yml');
const sprites = await json('data/sprites.json');
const items = await json('data/items.json');
const storySource = await text('docs/story-flavour.yml');
const lowerSprawlLayout = await json('data/stages/lower-sprawl.layout.json');
const stageScene = await text('apps/runner/src/scenes/StageRunScene.ts');
const itemSystem = await text('apps/runner/src/systems/ItemSystem.ts');
const renderer = await text('apps/runner/src/renderer/Renderer.ts');
const typedLayout = await text('apps/runner/src/world/lowerSprawlLayout.ts');

const spriteRenderer = await text('apps/runner/src/renderer/SpriteRenderer.ts');
const spriteContractsIndex = await text('packages/sprite-contracts/src/index.ts');

let runtimeClock = createArcadeAnimationClock({
	frameCount: 4,
	frameDuration: 0.1,
	mode: 'loop',
});
runtimeClock = playArcadeAnimationClock(runtimeClock);
runtimeClock = advanceArcadeAnimationClock(runtimeClock, 0.11, {
	frameCount: 4,
	frameDuration: 0.1,
	mode: 'loop',
});
assert(runtimeClock.frame === 1, 'Arcade Runtime animation clock must advance to frame 1');
assert(runtimeClock.frameAdvances === 1, 'Arcade Runtime animation clock must report one frame edge');
assert(
	Array.isArray(runtimeClock.advancedFrames) && runtimeClock.advancedFrames[0] === 1,
	'Arcade Runtime animation clock must report the crossed frame'
);

for (const required of [
	'frames_grid_vs_individual_pngs:',
	'item_pickup_model:',
	'pose_and_animation_requirements:',
	'id: anim_003_align_animation_names',
	'id: anim_004_build_stage_pickup_layout_schema',
	'id: anim_005_item_visual_state_machine',
]) {
	assert(animationPlan.includes(required), `animation.yml missing planning contract: ${required}`);
}

for (const implementedTask of [
	'anim_003_align_animation_names',
	'anim_004_build_stage_pickup_layout_schema',
	'anim_005_item_visual_state_machine',
]) {
	const taskIndex = animationPlan.indexOf(`id: ${implementedTask}`);
	assert(taskIndex >= 0, `animation.yml missing implemented task ${implementedTask}`);
	const taskBlock = animationPlan.slice(taskIndex, taskIndex + 260);
	assert(
		taskBlock.includes('status: done'),
		`animation.yml task should be marked done: ${implementedTask}`
	);
}

assert(
	spriteRenderer.includes('manifest = normalizeArcadeSpriteManifest(await this.fetchManifest(manifestUrl))') &&
		spriteRenderer.includes('const runtimeSheets = manifest.sheets.filter(isRuntimeSpriteSheet)') &&
		spriteRenderer.includes('this.manifest = manifest'),
	'SpriteRenderer must normalize data/sprites.json before reading sheets'
);
assert(
	spriteContractsIndex.includes('normalizeArcadeSpriteManifest') &&
		spriteContractsIndex.includes('normalizeSpriteManifest'),
	'sprite-contracts must re-export the runtime normalizer and retain the deprecated compatibility facade'
);
assert(
	Array.isArray(sprites.sheets),
	'data/sprites.json must keep the canonical runtime sheets manifest shape'
);
assert(
	sprites.sheets.some(
		(sheet) => sheet.id === 'comfy_badger_run_grid' && sheet.grid?.columns === 4
	),
	'data/sprites.json must retain explicit generated run grid metadata'
);

const sheetById = new Map(sprites.sheets.map((sheet) => [sheet.id, sheet]));
const mossAnimations = sheetById.get('moss_badger')?.animations ?? {};
const productionMoss = sheetById.get('moss_badger_production');
const productionMossAnimations = productionMoss?.animations ?? {};
assert(productionMoss, 'data/sprites.json missing moss_badger_production sheet');
assert(
	productionMoss.file === 'assets/sprites/moss_badger_production.png',
	'moss_badger_production must keep the stable production URL'
);
for (const [animation, minimumFrames] of Object.entries({
	idle: 4,
	run: 8,
	skid: 3,
	jump_up: 3,
	fall: 3,
	melee_claws: 5,
	melee_katana: 7,
	shoot_railgun: 5,
	rocket_boost: 6,
	hack: 4,
	interact: 4,
	victory: 6,
	pickup_react: 3,
	death_or_down: 6,
	parry: 4,
})) {
	assert(
		productionMossAnimations[animation]?.frames >= minimumFrames,
		`moss_badger_production.${animation} must contain at least ${minimumFrames} authored frames`
	);
}
for (const animation of [
	'idle',
	'run',
	'jump_up',
	'fall',
	'melee_claws',
	'melee_katana',
	'pickup_react',
	'interact',
	'death_or_down',
	'parry',
]) {
	assert(mossAnimations[animation], `moss_badger manifest missing runtime animation: ${animation}`);
}

for (const [animationName, requiredKinds] of Object.entries({
	run: ['footstep'],
	melee_claws: ['action_window', 'hitbox', 'vfx', 'cancel_window'],
	melee_katana: ['action_window', 'hitbox', 'vfx', 'cancel_window'],
	shoot_railgun: ['hitbox', 'vfx'],
	rocket_boost: ['vfx'],
	parry: ['action_window', 'vfx', 'cancel_window'],
})) {
	const animation = mossAnimations[animationName];
	assert(
		animation?.events?.length > 0,
		`moss_badger.${animationName} must declare animation events`
	);
	for (const kind of requiredKinds) {
		assert(
			animation.events.some((event) => event.kind === kind),
			`moss_badger.${animationName} missing animation event kind: ${kind}`
		);
	}
}
for (const animationName of ['melee_claws', 'melee_katana', 'shoot_railgun']) {
	assert(
		mossAnimations[animationName].hitboxes?.length > 0,
		`moss_badger.${animationName} must declare hitboxes`
	);
}
for (const [animationName, animation] of Object.entries(mossAnimations)) {
	assert(animation.anchor?.length === 2, `moss_badger.${animationName} must declare anchor`);
	assert(animation.hurtboxes?.length > 0, `moss_badger.${animationName} must declare hurtboxes`);
}

assert(
	!stageScene.includes("playAnimation(animState, 'jump')"),
	'StageRunScene must not reference absent jump animation'
);
assert(
	!stageScene.includes("playAnimation(animState, 'attack'"),
	'StageRunScene must not reference absent attack animation'
);
for (const runtimeAnimation of [
	'jump_up',
	'melee_katana',
	'melee_claws',
	'hack',
	'interact',
	'pickup_react',
	'victory',
]) {
	assert(
		stageScene.includes(runtimeAnimation),
		`StageRunScene missing aligned animation: ${runtimeAnimation}`
	);
}

assert(
	stageScene.includes('cloneStageLayout(this.options.stageId)') &&
		!stageScene.includes('// Pickups from prototype'),
	'StageRunScene should load world data from the stage layout registry instead of hard-coded pickup arrays'
);
assert(
	typedLayout.includes('export const lowerSprawlLayout'),
	'typed lower sprawl layout export missing'
);

assert(lowerSprawlLayout.schemaVersion === 1, 'stage layout schemaVersion must be 1');
assert(lowerSprawlLayout.id === 'lower-sprawl-prototype', 'unexpected lower sprawl layout id');
assert(
	Array.isArray(lowerSprawlLayout.platforms) && lowerSprawlLayout.platforms.length >= 7,
	'expected platforms in stage layout'
);
assert(
	Array.isArray(lowerSprawlLayout.pickups) && lowerSprawlLayout.pickups.length >= 4,
	'expected pickups in stage layout'
);
assert(
	Array.isArray(lowerSprawlLayout.enemies) && lowerSprawlLayout.enemies.length >= 2,
	'expected enemies in stage layout'
);

const iconSheet = sheetById.get('item_icons');
const extendedIconSheet = sheetById.get('item_icons_extended');
const skillIconSheet = sheetById.get('skill_icons');
assert(iconSheet, 'data/sprites.json missing item_icons sheet');
assert(extendedIconSheet, 'data/sprites.json missing item_icons_extended sheet');
assert(skillIconSheet, 'data/sprites.json missing skill_icons sheet');
assert(
	iconSheet.frameSize?.[0] === 32 && iconSheet.frameSize?.[1] === 32,
	'item_icons must use 32x32 frames'
);
assert(
	iconSheet.grid?.columns === 4 && iconSheet.grid?.rows === 4,
	'item_icons must reserve a 4x4 grid for current item set'
);
assert(
	extendedIconSheet.grid?.columns === 4 && extendedIconSheet.grid?.rows === 2,
	'item_icons_extended must use a 4x2 grid'
);
assert(
	skillIconSheet.grid?.columns === 5 && skillIconSheet.grid?.rows === 4,
	'skill_icons must use a 5x4 graph grid'
);

for (const item of items.items) {
	assert(
		item.iconAnimation === `${item.id}_icon`,
		`item ${item.id} must declare deterministic iconAnimation`
	);
	const itemIconSheetId = item.iconSheetId ?? 'item_icons';
	const itemIconSheet = sheetById.get(itemIconSheetId);
	assert(itemIconSheet, `item ${item.id} references missing icon sheet: ${itemIconSheetId}`);
	const iconAnimation = itemIconSheet.animations?.[item.iconAnimation];
	assert(
		iconAnimation,
		`${itemIconSheetId} missing icon animation for item ${item.id}: ${item.iconAnimation}`
	);
	assert(iconAnimation.frames === 1, `item icon must be one frame: ${item.iconAnimation}`);
	const sheetIndex = items.items
		.filter((candidate) => (candidate.iconSheetId ?? 'item_icons') === itemIconSheetId)
		.findIndex((candidate) => candidate.id === item.id);
	assert(
		iconAnimation.order?.[0] === sheetIndex,
		`item icon order should map within ${itemIconSheetId}: ${item.iconAnimation}`
	);
	assert(iconAnimation.tags?.includes('ui'), `item icon must be tagged ui: ${item.iconAnimation}`);
	assert(
		iconAnimation.tags?.includes('icon'),
		`item icon must be tagged icon: ${item.iconAnimation}`
	);
}

const itemSheetAnimations = sheetById.get('items_core')?.animations ?? {};
const extendedItemAnimations = sheetById.get('items_extended')?.animations ?? {};
for (const item of items.items.filter(
	(candidate) => candidate.pickupSheetId === 'items_extended'
)) {
	assert(item.pickupAnimation, `extended item ${item.id} must declare pickupAnimation`);
	assert(
		extendedItemAnimations[item.pickupAnimation],
		`items_extended missing pickup animation: ${item.pickupAnimation}`
	);
}

for (const skillId of [
	'double_swipe',
	'parry_tooth',
	'claw_rush',
	'undercut_audit',
	'peoples_finisher',
	'rail_mastery',
	'piercing_shot',
	'capacitor_ritual',
	'chain_conductor',
	'public_record',
	'fuel_sipper',
	'vector_kick',
	'badger_afterburn',
	'skyline_reversal',
	'communal_thrust',
	'street_syntax',
	'black_ice_bite',
	'ghost_invoice',
	'remote_arc',
	'public_exploit',
]) {
	assert(skillIconSheet.animations?.[`${skillId}_icon`], `skill_icons missing ${skillId}_icon`);
}
for (const storyPayloadAnimation of [
	'wafer_key_pickup',
	'elevator_seed_pickup',
	'mirror_pass_pickup',
	'bass_reactor_core_pickup',
	'debt_ledger_shard_pickup',
	'cargo_reversal_key_pickup',
	'asteroid_transmitter_root_pickup',
]) {
	assert(
		itemSheetAnimations[storyPayloadAnimation],
		`items_core missing story payload pickup animation: ${storyPayloadAnimation}`
	);
	assert(
		itemSheetAnimations[storyPayloadAnimation].tags?.includes('story_payload'),
		`story payload animation must be tagged story_payload: ${storyPayloadAnimation}`
	);
}

const requiredWorlds = [
	'lower_sprawl',
	'chrome_arcology',
	'straylight_mirage',
	'dub_colony',
	'antenna_barrens',
	'orbital_lift',
	'asteroid_redoubt',
];
for (const worldId of requiredWorlds) {
	const tileSheet = sheetById.get(`${worldId}_tiles`);
	assert(tileSheet, `missing world tile sheet: ${worldId}_tiles`);
	assert(tileSheet.world === worldId, `world tile sheet must declare world: ${worldId}`);
	assert(tileSheet.role === 'tiles', `world tile sheet must declare tile role: ${worldId}`);
	assert(
		tileSheet.frameSize?.[0] === 32 && tileSheet.frameSize?.[1] === 32,
		`world tiles must be 32x32: ${worldId}`
	);
	const tileAnimations = Object.values(tileSheet.animations ?? {});
	for (const requiredTag of ['solid', 'collision_safe', 'decorative', 'animated_prop', 'hazard']) {
		assert(
			tileAnimations.some((animation) => animation.tags?.includes(requiredTag)),
			`world tile sheet ${worldId} missing tag ${requiredTag}`
		);
	}
	assert(
		tileAnimations.some((animation) => animation.tags?.some((tag) => tag.startsWith('material:'))),
		`world tile sheet ${worldId} missing material tag`
	);

	const parallaxSheet = sheetById.get(`${worldId}_parallax`);
	assert(parallaxSheet, `missing world parallax sheet: ${worldId}_parallax`);
	assert(parallaxSheet.world === worldId, `world parallax sheet must declare world: ${worldId}`);
	assert(
		parallaxSheet.role === 'parallax',
		`world parallax sheet must declare parallax role: ${worldId}`
	);
	assert(
		parallaxSheet.grid?.columns === 3 && parallaxSheet.grid?.rows === 1,
		`world parallax must use a 3x1 grid: ${worldId}`
	);
	for (const plate of ['back_plate', 'mid_plate', 'front_plate']) {
		assert(parallaxSheet.animations?.[plate], `world parallax sheet ${worldId} missing ${plate}`);
		assert(
			parallaxSheet.animations[plate].tags?.includes('parallax'),
			`world parallax ${worldId}.${plate} missing parallax tag`
		);
	}
}

const vfxAnimations = sheetById.get('vfx_combat')?.animations ?? {};
for (const vfxAnimation of ['pickup_burst', 'story_payload_reveal']) {
	assert(vfxAnimations[vfxAnimation], `vfx_combat missing animation: ${vfxAnimation}`);
}

for (const pickup of lowerSprawlLayout.pickups) {
	for (const field of [
		'id',
		'itemId',
		'x',
		'y',
		'kind',
		'radius',
		'visualState',
		'animation',
		'persistence',
	]) {
		assert(
			pickup[field] !== undefined,
			`layout pickup ${pickup.id ?? '<unknown>'} missing ${field}`
		);
	}
	assert(pickup.visualState === 'available', `layout pickup ${pickup.id} should start available`);
	assert(
		Number.isFinite(pickup.radius) && pickup.radius > 0,
		`layout pickup ${pickup.id} needs positive radius`
	);
	assert(
		itemSheetAnimations[pickup.animation],
		`pickup ${pickup.id} animation missing from items_core: ${pickup.animation}`
	);
	assert(typedLayout.includes(`id: '${pickup.id}'`), `typed layout missing pickup ${pickup.id}`);
}
const storyPayloadPickup = lowerSprawlLayout.pickups.find(
	(pickup) => pickup.persistence === 'story_payload'
);
assert(storyPayloadPickup, 'lower sprawl layout must include a story_payload pickup');
assert(
	storyPayloadPickup.itemId === 'wafer_key',
	'lower sprawl story payload pickup must be wafer_key'
);
assert(
	storyPayloadPickup.animation === 'wafer_key_pickup',
	'lower sprawl story payload pickup must use wafer_key animation'
);
assert(
	typedLayout.includes("persistence: 'story_payload'"),
	'typed layout must carry story_payload persistence'
);
assert(
	typedLayout.includes("itemId: 'wafer_key'"),
	'typed layout must carry wafer_key story payload'
);

const requiredDialoguePortraitSheets = [
	'character_auntie_subharmonic',
	'character_lio',
	'character_murr_murrby',
	'character_naya_root',
	'character_rook_null',
	'character_sister_version',
	'moss_badger',
];
for (const sheetId of requiredDialoguePortraitSheets) {
	assert(
		sheetById.get(sheetId),
		`dialogue portrait sheet missing from sprite manifest: ${sheetId}`
	);
}

const characterRequiredAnimations = ['idle', 'talk', 'assist', 'react', 'exit'];
const characterSheets = sprites.sheets.filter((sheet) =>
	['companion', 'npc', 'merchant', 'npc_boss_context'].includes(sheet.role)
);
assert(
	characterSheets.length >= 20,
	`expected at least 20 non-player character sheets, got ${characterSheets.length}`
);
for (const sheet of characterSheets) {
	assert(
		sheet.id.startsWith('character_'),
		`character sheet id must start with character_: ${sheet.id}`
	);
	assert(
		sheet.file.startsWith('assets/sprites/characters/'),
		`character sheet file path must be under characters: ${sheet.id}`
	);
	assert(
		sheet.frameSize?.[0] === 48 && sheet.frameSize?.[1] === 48,
		`character sheet must use 48x48 frames: ${sheet.id}`
	);
	assert(sheet.sourceChapter, `character sheet missing sourceChapter: ${sheet.id}`);
	assert(sheet.sourceName, `character sheet missing sourceName: ${sheet.id}`);
	assert(sheet.sourceRole, `character sheet missing sourceRole: ${sheet.id}`);
	assert(sheet.sourcePrompt, `character sheet missing visual source prompt: ${sheet.id}`);
	for (const animation of characterRequiredAnimations) {
		assert(sheet.animations?.[animation], `character sheet ${sheet.id} missing ${animation}`);
		assert(
			sheet.animations[animation].tags?.includes('character'),
			`character animation must include character tag: ${sheet.id}.${animation}`
		);
	}
}

const enemyRequiredAnimations = [
	'idle',
	'patrol_or_move',
	'windup',
	'attack',
	'hurt',
	'stun_or_parried',
	'death',
];
const bossRequiredAnimations = [
	...enemyRequiredAnimations,
	'phase_intro',
	'phase_transition',
	'signature_attack',
	'defeat',
];
const enemySheets = sprites.sheets.filter((sheet) => sheet.role === 'enemy');
const bossSheets = sprites.sheets.filter((sheet) => sheet.role === 'boss');
assert(
	enemySheets.length >= 16,
	`expected at least 16 story enemy sheets, got ${enemySheets.length}`
);
assert(bossSheets.length >= 8, `expected at least 8 boss sheets, got ${bossSheets.length}`);
for (const sheet of enemySheets) {
	assert(sheet.id.startsWith('enemy_'), `enemy sheet id must start with enemy_: ${sheet.id}`);
	assert(
		sheet.file.startsWith('assets/sprites/enemies/'),
		`enemy sheet file path must be under enemies: ${sheet.id}`
	);
	assert(
		sheet.frameSize?.[0] === 48 && sheet.frameSize?.[1] === 48,
		`enemy sheet must use 48x48 frames: ${sheet.id}`
	);
	assert(sheet.sourceChapter, `enemy sheet missing sourceChapter: ${sheet.id}`);
	assert(
		sheet.sourcePrompt || sheet.sourceModelName,
		`enemy sheet missing source prompt/model metadata: ${sheet.id}`
	);
	for (const animation of enemyRequiredAnimations) {
		assert(sheet.animations?.[animation], `enemy sheet ${sheet.id} missing ${animation}`);
		assert(
			sheet.animations[animation].tags?.includes('enemy'),
			`enemy animation must include enemy tag: ${sheet.id}.${animation}`
		);
	}
}
for (const sheet of bossSheets) {
	assert(sheet.id.startsWith('boss_'), `boss sheet id must start with boss_: ${sheet.id}`);
	assert(
		sheet.file.startsWith('assets/sprites/bosses/'),
		`boss sheet file path must be under bosses: ${sheet.id}`
	);
	assert(
		sheet.frameSize?.[0] === 96 && sheet.frameSize?.[1] === 96,
		`boss sheet must use 96x96 frames: ${sheet.id}`
	);
	assert(sheet.phaseCount >= 1, `boss sheet must record phaseCount: ${sheet.id}`);
	assert(sheet.sourceChapter, `boss sheet missing sourceChapter: ${sheet.id}`);
	assert(
		sheet.sourcePrompt || sheet.sourceModelName,
		`boss sheet missing source prompt/model metadata: ${sheet.id}`
	);
	for (const animation of bossRequiredAnimations) {
		assert(sheet.animations?.[animation], `boss sheet ${sheet.id} missing ${animation}`);
		assert(
			sheet.animations[animation].tags?.includes('boss'),
			`boss animation must include boss tag: ${sheet.id}.${animation}`
		);
	}
}

for (const state of ['available', 'magnetized', 'collecting', 'collected', 'respawn_pending']) {
	assert(itemSystem.includes(`'${state}'`), `ItemSystem missing pickup visual state: ${state}`);
}
for (const required of ['collectTimer', 'COLLECT_ANIMATION_SECONDS', 'onCollect?.(pickup)']) {
	assert(itemSystem.includes(required), `ItemSystem missing collection-state hook: ${required}`);
}
for (const required of [
	'items_core',
	'p.animation',
	'p.spriteSheetId',
	"p.visualState === 'collecting'",
]) {
	assert(
		renderer.includes(required),
		`Renderer missing pickup animation rendering hook: ${required}`
	);
}

console.log('badger-sprawl-runner animation contracts ok');

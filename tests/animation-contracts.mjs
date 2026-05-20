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
	assert(taskBlock.includes('status: done'), `animation.yml task should be marked done: ${implementedTask}`);
}


assert(
	spriteRenderer.includes('normalizeSpriteManifest(await response.json())'),
	'SpriteRenderer must normalize data/sprites.json before reading sheets',
);
assert(
	spriteContractsIndex.includes('normalizeSpriteManifest'),
	'sprite-contracts package must export normalizeSpriteManifest',
);
assert(Array.isArray(sprites.spriteSheets), 'data/sprites.json must keep spriteSheets project manifest shape');
assert(
	sprites.spriteSheets.some((sheet) => sheet.id === 'comfy_badger_run_grid' && sheet.grid?.columns === 4),
	'data/sprites.json must retain explicit generated run grid metadata',
);

const sheetById = new Map(sprites.spriteSheets.map((sheet) => [sheet.id, sheet]));
const mossAnimations = sheetById.get('moss_badger')?.animations ?? {};
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

assert(!stageScene.includes("playAnimation(animState, 'jump')"), 'StageRunScene must not reference absent jump animation');
assert(!stageScene.includes("playAnimation(animState, 'attack'"), 'StageRunScene must not reference absent attack animation');
for (const runtimeAnimation of ['jump_up', 'melee_katana', 'melee_claws']) {
	assert(stageScene.includes(runtimeAnimation), `StageRunScene missing aligned animation: ${runtimeAnimation}`);
}

assert(
	stageScene.includes('cloneLowerSprawlLayout') && !stageScene.includes('// Pickups from prototype'),
	'StageRunScene should load world data from lowerSprawlLayout instead of hard-coded pickup arrays',
);
assert(typedLayout.includes('export const lowerSprawlLayout'), 'typed lower sprawl layout export missing');

assert(lowerSprawlLayout.schemaVersion === 1, 'stage layout schemaVersion must be 1');
assert(lowerSprawlLayout.id === 'lower-sprawl-prototype', 'unexpected lower sprawl layout id');
assert(Array.isArray(lowerSprawlLayout.platforms) && lowerSprawlLayout.platforms.length >= 7, 'expected platforms in stage layout');
assert(Array.isArray(lowerSprawlLayout.pickups) && lowerSprawlLayout.pickups.length >= 4, 'expected pickups in stage layout');
assert(Array.isArray(lowerSprawlLayout.enemies) && lowerSprawlLayout.enemies.length >= 2, 'expected enemies in stage layout');

const iconSheet = sheetById.get('item_icons');
assert(iconSheet, 'data/sprites.json missing item_icons sheet');
assert(iconSheet.frameSize?.[0] === 32 && iconSheet.frameSize?.[1] === 32, 'item_icons must use 32x32 frames');
assert(iconSheet.grid?.columns === 4 && iconSheet.grid?.rows === 4, 'item_icons must reserve a 4x4 grid for current item set');

for (const [index, item] of items.items.entries()) {
	assert(item.iconAnimation === `${item.id}_icon`, `item ${item.id} must declare deterministic iconAnimation`);
	const iconAnimation = iconSheet.animations?.[item.iconAnimation];
	assert(iconAnimation, `item_icons missing icon animation for item ${item.id}: ${item.iconAnimation}`);
	assert(iconAnimation.frames === 1, `item icon must be one frame: ${item.iconAnimation}`);
	assert(iconAnimation.order?.[0] === index, `item icon order should map to item index: ${item.iconAnimation}`);
	assert(iconAnimation.tags?.includes('ui'), `item icon must be tagged ui: ${item.iconAnimation}`);
	assert(iconAnimation.tags?.includes('icon'), `item icon must be tagged icon: ${item.iconAnimation}`);
}

const itemSheetAnimations = sheetById.get('items_core')?.animations ?? {};
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
		`items_core missing story payload pickup animation: ${storyPayloadAnimation}`,
	);
	assert(
		itemSheetAnimations[storyPayloadAnimation].tags?.includes('story_payload'),
		`story payload animation must be tagged story_payload: ${storyPayloadAnimation}`,
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
	assert(tileSheet.frameSize?.[0] === 32 && tileSheet.frameSize?.[1] === 32, `world tiles must be 32x32: ${worldId}`);
	const tileAnimations = Object.values(tileSheet.animations ?? {});
	for (const requiredTag of ['solid', 'collision_safe', 'decorative', 'animated_prop', 'hazard']) {
		assert(
			tileAnimations.some((animation) => animation.tags?.includes(requiredTag)),
			`world tile sheet ${worldId} missing tag ${requiredTag}`,
		);
	}
	assert(
		tileAnimations.some((animation) => animation.tags?.some((tag) => tag.startsWith('material:'))),
		`world tile sheet ${worldId} missing material tag`,
	);

	const parallaxSheet = sheetById.get(`${worldId}_parallax`);
	assert(parallaxSheet, `missing world parallax sheet: ${worldId}_parallax`);
	assert(parallaxSheet.world === worldId, `world parallax sheet must declare world: ${worldId}`);
	assert(parallaxSheet.role === 'parallax', `world parallax sheet must declare parallax role: ${worldId}`);
	assert(parallaxSheet.grid?.columns === 3 && parallaxSheet.grid?.rows === 1, `world parallax must use a 3x1 grid: ${worldId}`);
	for (const plate of ['back_plate', 'mid_plate', 'front_plate']) {
		assert(parallaxSheet.animations?.[plate], `world parallax sheet ${worldId} missing ${plate}`);
		assert(parallaxSheet.animations[plate].tags?.includes('parallax'), `world parallax ${worldId}.${plate} missing parallax tag`);
	}
}

const vfxAnimations = sheetById.get('vfx_combat')?.animations ?? {};
for (const vfxAnimation of ['pickup_burst', 'story_payload_reveal']) {
	assert(vfxAnimations[vfxAnimation], `vfx_combat missing animation: ${vfxAnimation}`);
}

for (const pickup of lowerSprawlLayout.pickups) {
	for (const field of ['id', 'itemId', 'x', 'y', 'kind', 'radius', 'visualState', 'animation', 'persistence']) {
		assert(pickup[field] !== undefined, `layout pickup ${pickup.id ?? '<unknown>'} missing ${field}`);
	}
	assert(pickup.visualState === 'available', `layout pickup ${pickup.id} should start available`);
	assert(Number.isFinite(pickup.radius) && pickup.radius > 0, `layout pickup ${pickup.id} needs positive radius`);
	assert(itemSheetAnimations[pickup.animation], `pickup ${pickup.id} animation missing from items_core: ${pickup.animation}`);
	assert(typedLayout.includes(`id: '${pickup.id}'`), `typed layout missing pickup ${pickup.id}`);
}
const storyPayloadPickup = lowerSprawlLayout.pickups.find((pickup) => pickup.persistence === 'story_payload');
assert(storyPayloadPickup, 'lower sprawl layout must include a story_payload pickup');
assert(storyPayloadPickup.itemId === 'wafer_key', 'lower sprawl story payload pickup must be wafer_key');
assert(storyPayloadPickup.animation === 'wafer_key_pickup', 'lower sprawl story payload pickup must use wafer_key animation');
assert(typedLayout.includes("persistence: 'story_payload'"), 'typed layout must carry story_payload persistence');
assert(typedLayout.includes("itemId: 'wafer_key'"), 'typed layout must carry wafer_key story payload');

const characterRequiredAnimations = ['idle', 'talk', 'assist', 'react', 'exit'];
const characterSheets = sprites.spriteSheets.filter((sheet) =>
	['companion', 'npc', 'merchant', 'npc_boss_context'].includes(sheet.role),
);
assert(characterSheets.length >= 20, `expected at least 20 non-player character sheets, got ${characterSheets.length}`);
for (const sheet of characterSheets) {
	assert(sheet.id.startsWith('character_'), `character sheet id must start with character_: ${sheet.id}`);
	assert(sheet.file.startsWith('assets/sprites/characters/'), `character sheet file path must be under characters: ${sheet.id}`);
	assert(sheet.frameSize?.[0] === 48 && sheet.frameSize?.[1] === 48, `character sheet must use 48x48 frames: ${sheet.id}`);
	assert(sheet.sourceChapter, `character sheet missing sourceChapter: ${sheet.id}`);
	assert(sheet.sourceName, `character sheet missing sourceName: ${sheet.id}`);
	assert(sheet.sourceRole, `character sheet missing sourceRole: ${sheet.id}`);
	assert(sheet.sourcePrompt, `character sheet missing visual source prompt: ${sheet.id}`);
	for (const animation of characterRequiredAnimations) {
		assert(sheet.animations?.[animation], `character sheet ${sheet.id} missing ${animation}`);
		assert(sheet.animations[animation].tags?.includes('character'), `character animation must include character tag: ${sheet.id}.${animation}`);
	}
}

const enemyRequiredAnimations = ['idle', 'patrol_or_move', 'windup', 'attack', 'hurt', 'stun_or_parried', 'death'];
const bossRequiredAnimations = [
	...enemyRequiredAnimations,
	'phase_intro',
	'phase_transition',
	'signature_attack',
	'defeat',
];
const enemySheets = sprites.spriteSheets.filter((sheet) => sheet.role === 'enemy');
const bossSheets = sprites.spriteSheets.filter((sheet) => sheet.role === 'boss');
assert(enemySheets.length >= 16, `expected at least 16 story enemy sheets, got ${enemySheets.length}`);
assert(bossSheets.length >= 8, `expected at least 8 boss sheets, got ${bossSheets.length}`);
for (const sheet of enemySheets) {
	assert(sheet.id.startsWith('enemy_'), `enemy sheet id must start with enemy_: ${sheet.id}`);
	assert(sheet.file.startsWith('assets/sprites/enemies/'), `enemy sheet file path must be under enemies: ${sheet.id}`);
	assert(sheet.frameSize?.[0] === 48 && sheet.frameSize?.[1] === 48, `enemy sheet must use 48x48 frames: ${sheet.id}`);
	assert(sheet.sourceChapter, `enemy sheet missing sourceChapter: ${sheet.id}`);
	assert(sheet.sourcePrompt || sheet.sourceModelName, `enemy sheet missing source prompt/model metadata: ${sheet.id}`);
	for (const animation of enemyRequiredAnimations) {
		assert(sheet.animations?.[animation], `enemy sheet ${sheet.id} missing ${animation}`);
		assert(sheet.animations[animation].tags?.includes('enemy'), `enemy animation must include enemy tag: ${sheet.id}.${animation}`);
	}
}
for (const sheet of bossSheets) {
	assert(sheet.id.startsWith('boss_'), `boss sheet id must start with boss_: ${sheet.id}`);
	assert(sheet.file.startsWith('assets/sprites/bosses/'), `boss sheet file path must be under bosses: ${sheet.id}`);
	assert(sheet.frameSize?.[0] === 96 && sheet.frameSize?.[1] === 96, `boss sheet must use 96x96 frames: ${sheet.id}`);
	assert(sheet.phaseCount >= 1, `boss sheet must record phaseCount: ${sheet.id}`);
	assert(sheet.sourceChapter, `boss sheet missing sourceChapter: ${sheet.id}`);
	assert(sheet.sourcePrompt || sheet.sourceModelName, `boss sheet missing source prompt/model metadata: ${sheet.id}`);
	for (const animation of bossRequiredAnimations) {
		assert(sheet.animations?.[animation], `boss sheet ${sheet.id} missing ${animation}`);
		assert(sheet.animations[animation].tags?.includes('boss'), `boss animation must include boss tag: ${sheet.id}.${animation}`);
	}
}

for (const state of ['available', 'magnetized', 'collecting', 'collected', 'respawn_pending']) {
	assert(itemSystem.includes(`'${state}'`), `ItemSystem missing pickup visual state: ${state}`);
}
for (const required of ['collectTimer', 'COLLECT_ANIMATION_SECONDS', 'onCollect?.(pickup)']) {
	assert(itemSystem.includes(required), `ItemSystem missing collection-state hook: ${required}`);
}
for (const required of ['items_core', 'p.animation', "p.visualState === 'collecting'"]) {
	assert(renderer.includes(required), `Renderer missing pickup animation rendering hook: ${required}`);
}

console.log('badger-sprawl-runner animation contracts ok');

export type BadgerChunkName =
	| 'vite-runtime'
	| 'pixi-runtime'
	| 'arcade-runtime'
	| 'vendor-runtime'
	| 'game-runtime'
	| 'scene-shells'
	| 'adventure-content'
	| 'campaign-content'
	| 'content-dashboard'
	| 'procedural-expeditions'
	| 'runner-renderer'
	| 'persistence'
	| 'badger-packages';

const ADVENTURE_CONTENT_PATTERN =
	/(?:Content|Catalog|PlaceLedger|SocialSpaces|WorldGraph|InfrastructureNetwork|WorldSchedule)\.ts$/;

/**
 * Stable ownership-oriented production chunks.
 *
 * Campaign state, combat systems, adventure directors, and StageRun form one
 * intentionally cyclic execution core and therefore share `game-runtime`.
 * Authored data, scene shells, procedural expeditions, rendering, persistence,
 * workspace packages, and external runtimes remain independently cacheable.
 */
export function badgerManualChunk(moduleId: string): BadgerChunkName | undefined {
	const id = moduleId.replaceAll('\\', '/');
	if (id.includes('vite/preload-helper')) return 'vite-runtime';
	if (id.includes('/node_modules/.pnpm/pixi.js@')) return 'pixi-runtime';
	if (id.endsWith('/vendor/arcade-runtime.mjs')) return 'arcade-runtime';
	if (id.includes('/node_modules/')) return 'vendor-runtime';
	if (id.includes('/packages/')) return 'badger-packages';
	if (id.endsWith('/src/game/adventure/AdventureContentDashboard.ts')) {
		return 'content-dashboard';
	}
	if (
		id.endsWith('/src/game/adventure/WorldGraph.ts') ||
		id.endsWith('/src/game/adventure/CuratedRewardCatalog.ts')
	) {
		return 'game-runtime';
	}
	if (id.includes('/src/game/adventure/') && ADVENTURE_CONTENT_PATTERN.test(id)) {
		return 'adventure-content';
	}
	if (id.endsWith('/src/game/Campaign.ts') || id.includes('/src/game/campaign/')) {
		return 'campaign-content';
	}
	// The active undercity save owns canonical expedition inventory and injury
	// state, so it participates in the execution core. Keeping only the leaf
	// generators separate prevents a procedural-expeditions ↔ game-runtime
	// cycle while preserving a cacheable procedural content chunk.
	if (id.endsWith('/src/procgen/UndercityExpedition.ts')) return 'game-runtime';
	if (id.includes('/src/procgen/')) return 'procedural-expeditions';
	if (id.includes('/src/storage/')) return 'persistence';
	if (id.includes('/src/renderer/')) return 'runner-renderer';
	if (id.includes('/src/scenes/') && !id.endsWith('/src/scenes/StageRunScene.ts')) {
		return 'scene-shells';
	}
	if (
		id.endsWith('/src/scenes/StageRunScene.ts') ||
		id.includes('/src/systems/') ||
		id.includes('/src/game/')
	) {
		return 'game-runtime';
	}
	return undefined;
}

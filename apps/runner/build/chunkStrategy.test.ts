import { describe, expect, it } from 'vitest';
import { badgerManualChunk } from './chunkStrategy';

describe('badgerManualChunk', () => {
	it('keeps the intentionally cyclic execution core in one chunk', () => {
		expect(badgerManualChunk('/repo/apps/runner/src/scenes/StageRunScene.ts')).toBe(
			'game-runtime'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/game/GameFlow.ts')).toBe('game-runtime');
		expect(badgerManualChunk('/repo/apps/runner/src/game/adventure/WorldDirector.ts')).toBe(
			'game-runtime'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/systems/CombatSystem.ts')).toBe(
			'game-runtime'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/procgen/UndercityExpedition.ts')).toBe(
			'game-runtime'
		);
	});

	it('separates authored content from execution and shell ownership', () => {
		expect(badgerManualChunk('/repo/apps/runner/src/scenes/SubwayMapScene.ts')).toBe(
			'scene-shells'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/game/adventure/QuestCatalog.ts')).toBe(
			'adventure-content'
		);
		expect(
			badgerManualChunk('/repo/apps/runner/src/game/adventure/AlgorithmicCivicContent.ts')
		).toBe('adventure-content');
		expect(
			badgerManualChunk('/repo/apps/runner/src/game/adventure/AdventureContentDashboard.ts')
		).toBe('content-dashboard');
		expect(badgerManualChunk('/repo/apps/runner/src/game/adventure/WorldGraph.ts')).toBe(
			'game-runtime'
		);
		expect(
			badgerManualChunk('/repo/apps/runner/src/game/adventure/CuratedRewardCatalog.ts')
		).toBe('game-runtime');
		expect(badgerManualChunk('/repo/apps/runner/src/game/Campaign.ts')).toBe(
			'campaign-content'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/game/campaign/sideQuests.ts')).toBe(
			'campaign-content'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/procgen/EncounterGenerator.ts')).toBe(
			'procedural-expeditions'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/storage/SaveStore.ts')).toBe('persistence');
		expect(badgerManualChunk('/repo/apps/runner/src/renderer/Renderer.ts')).toBe(
			'runner-renderer'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/renderer/BadgerPixiBridge.ts')).toBe(
			'pixi-bridge'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/renderer/BadgerPixiActors.ts')).toBe(
			'pixi-bridge'
		);
	});

	it('keeps shared external runtimes in stable vendor chunks', () => {
		expect(
			badgerManualChunk('/repo/node_modules/.pnpm/pixi.js@8.19.0/node_modules/pixi.js/index.mjs')
		).toBe('pixi-runtime');
		expect(badgerManualChunk('/repo/vendor/arcade-runtime.mjs')).toBe('arcade-runtime');
		expect(badgerManualChunk('/repo/node_modules/lodash/index.js')).toBe('vendor-runtime');
		expect(badgerManualChunk('/repo/packages/progression/src/index.ts')).toBe('badger-packages');
	});

	it('normalizes Windows-style paths and leaves entry-only modules unassigned', () => {
		expect(badgerManualChunk('C:\\repo\\apps\\runner\\src\\systems\\CombatSystem.ts')).toBe(
			'game-runtime'
		);
		expect(badgerManualChunk('/repo/apps/runner/src/main.ts')).toBeUndefined();
	});
});

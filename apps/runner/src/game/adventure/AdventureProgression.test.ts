import { describe, expect, it } from 'vitest';
import { createDefaultStoryProgress } from '../StoryProgressMigration';
import { applyStageCompletion, createAdventureSaveFromStoryProgress } from './AdventureProgression';
import { WorldDirector } from './WorldDirector';

describe('adventure progression migration', () => {
	it('projects completed linear stages into discovered persistent districts', () => {
		const state = createAdventureSaveFromStoryProgress({
			...createDefaultStoryProgress(),
			currentStageId: 'chrome-arcology',
			completedStageIds: ['lower-sprawl', 'drainmarket'],
			completedChapterIds: ['ch01', 'ch02'],
		});

		expect(state.districtPhases).toMatchObject({
			'lower-sprawl': 'transformed',
			drainmarket: 'transformed',
			'chrome-arcology': 'contested',
		});
		expect(state.discoveredLocationIds).toContain('chrome-arcology:route');
		expect(state.unlockedRouteIds).toContain('transit:drainmarket:chrome-arcology');
		expect(state.currentLocationId).toBe('chrome-arcology:safehouse');
		expect(state.respawnAnchor).toEqual({
			locationId: 'chrome-arcology:safehouse',
			spawnId: 'respawn',
		});
	});

	it('projects orbital-lift completion into a city homecoming and final launch', () => {
		const state = createAdventureSaveFromStoryProgress({
			...createDefaultStoryProgress(),
			currentStageId: 'asteroid-redoubt',
			completedStageIds: [
				'lower-sprawl',
				'drainmarket',
				'chrome-arcology',
				'mirror-palace',
				'dub-colony',
				'antenna-barrens',
				'orbital-lift',
			],
		});

		expect(state.unlockedRouteIds).toContain('homecoming:orbital-lift:lower-sprawl');
		expect(state.unlockedRouteIds).toContain('launch:lower-sprawl:asteroid-redoubt');
		expect(state.unlockedRouteIds).not.toContain('transit:orbital-lift:asteroid-redoubt');
		expect(state.currentLocationId).toBe('asteroid-redoubt:safehouse');
		expect(state.worldFlags).toContain('homecoming:return-delegation-arrived');
		expect(state.npcStates).toMatchObject({
			'rook-null': { currentLocationId: 'lower-sprawl:station' },
			'naya-root': { currentLocationId: 'lower-sprawl:station' },
			'juno-jar': { currentLocationId: 'lower-sprawl:station' },
			'orchid-debt': { currentLocationId: 'lower-sprawl:station' },
			'bassie-knot': { currentLocationId: 'lower-sprawl:station' },
			'coco-loop': { currentLocationId: 'lower-sprawl:station' },
		});
	});

	it('returns a live orbital-lift completion to Blue Mercy before the final launch', () => {
		const world = new WorldDirector();
		world.debugTravelTo('orbital-lift:stronghold');
		world.execute({ type: 'relocate-npc', npcId: 'naya-root', locationId: 'dub-colony:station' });
		world.execute({ type: 'relocate-npc', npcId: 'juno-jar', locationId: 'dub-colony:station' });
		world.execute({ type: 'relocate-npc', npcId: 'orchid-debt', locationId: 'mirror-palace:station' });

		applyStageCompletion(world, 'orbital-lift');

		expect(world.getState()).toMatchObject({
			currentLocationId: 'lower-sprawl:station',
			currentSpawnId: 'arrival',
			respawnAnchor: {
				locationId: 'lower-sprawl:safehouse',
				spawnId: 'respawn',
			},
		});
		expect(world.getState().unlockedRouteIds).toContain(
			'launch:lower-sprawl:asteroid-redoubt'
		);
		expect(world.getState().npcStates).toMatchObject({
			'naya-root': { currentLocationId: 'lower-sprawl:station' },
			'juno-jar': { currentLocationId: 'lower-sprawl:station' },
			'orchid-debt': { currentLocationId: 'lower-sprawl:station' },
			'portia-drift': { currentLocationId: 'orbital-lift:station' },
			'ames-oxygen': { currentLocationId: 'orbital-lift:settlement' },
		});
	});

	it('returns final completion to Commons Dawn while preserving the Redoubt as a peer node', () => {
		const world = new WorldDirector();
		world.debugTravelTo('asteroid-redoubt:stronghold');

		applyStageCompletion(world, 'asteroid-redoubt');

		expect(world.getState()).toMatchObject({
			currentLocationId: 'lower-sprawl:station',
			currentSpawnId: 'arrival',
			respawnAnchor: {
				locationId: 'lower-sprawl:safehouse',
				spawnId: 'respawn',
			},
			npcStates: {
				'choir-of-static': { currentLocationId: 'lower-sprawl:station' },
				'little-ix': { currentLocationId: 'lower-sprawl:station' },
				'witness-zero': { currentLocationId: 'drainmarket:settlement' },
				'return-signal-sam': { currentLocationId: 'asteroid-redoubt:station' },
			},
		});
		expect(world.getState().worldFlags).toEqual(
			expect.arrayContaining(['commons:return-signal-open', 'commons:toolkits-mirrored'])
		);
	});

	it('migrates a completed campaign directly into the transformed subway rather than the frontier', () => {
		const state = createAdventureSaveFromStoryProgress({
			...createDefaultStoryProgress(),
			currentStageId: 'asteroid-redoubt',
			completedStageIds: [
				'lower-sprawl',
				'drainmarket',
				'chrome-arcology',
				'mirror-palace',
				'dub-colony',
				'antenna-barrens',
				'orbital-lift',
				'asteroid-redoubt',
			],
			campaignComplete: true,
		});

		expect(state.currentLocationId).toBe('lower-sprawl:station');
		expect(state.respawnAnchor).toEqual({
			locationId: 'lower-sprawl:safehouse',
			spawnId: 'respawn',
		});
		expect(state.districtPhases['asteroid-redoubt']).toBe('transformed');
	});
});

import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../GameFlow';
import { createDefaultAdventureSave } from './AdventureState';
import { resolveWorldSchedule, validateWorldSchedule } from './WorldSchedule';

describe('world schedule', () => {
	it('moves Lio and Rook into the Arcology during the vertical shift', () => {
		expect(validateWorldSchedule()).toEqual([]);
		const flow = createGameFlow(undefined, {
			currentStageId: 'chrome-arcology',
			completedStageIds: ['lower-sprawl', 'drainmarket'],
		});
		const schedule = resolveWorldSchedule(createDefaultAdventureSave(), flow.getStoryProgress());

		expect(schedule).toMatchObject({
			beat: 'vertical-shift',
			scheduledLocationByNpcId: {
				'lio-vale': 'chrome-arcology:settlement',
				'rook-null': 'chrome-arcology:safehouse',
			},
		});
	});

	it('assembles the final expedition across the Redoubt during the Last Route beat', () => {
		const flow = createGameFlow(undefined, {
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
		const schedule = resolveWorldSchedule(createDefaultAdventureSave(), flow.getStoryProgress());

		expect(schedule).toMatchObject({
			beat: 'last-route',
			scheduledLocationByNpcId: {
				'choir-of-static': 'asteroid-redoubt:safehouse',
				'aunt-aster': 'asteroid-redoubt:safehouse',
				'witness-zero': 'asteroid-redoubt:settlement',
				'little-ix': 'asteroid-redoubt:settlement',
				'return-signal-sam': 'asteroid-redoubt:station',
				'director-vane': 'asteroid-redoubt:settlement',
				'della-redact': 'asteroid-redoubt:settlement',
			},
		});
	});

	it('keeps former enforcement specialists in accountable public work', () => {
		const forecastFlow = createGameFlow(undefined, {
			currentStageId: 'orbital-lift',
			completedStageIds: [
				'lower-sprawl',
				'drainmarket',
				'chrome-arcology',
				'mirror-palace',
				'dub-colony',
				'antenna-barrens',
			],
		});
		const forecast = resolveWorldSchedule(
			createDefaultAdventureSave(),
			forecastFlow.getStoryProgress()
		);
		expect(forecast).toMatchObject({
			beat: 'public-forecast',
			scheduledLocationByNpcId: {
				'maceo-margin': 'antenna-barrens:settlement',
				'rita-latch': 'orbital-lift:station',
			},
		});

		const completeFlow = createGameFlow(undefined, {
			campaignComplete: true,
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
		});
		const commonsDawn = resolveWorldSchedule(
			createDefaultAdventureSave(),
			completeFlow.getStoryProgress()
		);
		expect(commonsDawn).toMatchObject({
			beat: 'commons-dawn',
			scheduledLocationByNpcId: {
				'maceo-margin': 'antenna-barrens:station',
				'rita-latch': 'orbital-lift:station',
				'della-redact': 'asteroid-redoubt:station',
			},
		});
	});

	it('mirrors colony specialists back onto Blue Mercy during homecoming', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'orbital-lift',
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
		const schedule = resolveWorldSchedule(createDefaultAdventureSave(), flow.getStoryProgress());

		expect(schedule.beat).toBe('homecoming');
		expect(schedule.scheduledLocationByNpcId).toMatchObject({
			'rook-null': 'lower-sprawl:station',
			'naya-root': 'lower-sprawl:station',
			'juno-jar': 'lower-sprawl:station',
			'orchid-debt': 'lower-sprawl:station',
			'bassie-knot': 'lower-sprawl:station',
			'coco-loop': 'lower-sprawl:station',
		});
	});

	it('moves the Palace service cast into the hidden local during the skybound beat', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'mirror-palace',
			completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology'],
		});
		const schedule = resolveWorldSchedule(createDefaultAdventureSave(), flow.getStoryProgress());

		expect(schedule).toMatchObject({
			beat: 'skybound',
			scheduledLocationByNpcId: {
				'sable-meridian': 'mirror-palace:safehouse',
				'orchid-debt': 'mirror-palace:settlement',
				'portia-drift': 'mirror-palace:station',
				'reflection-judge': 'mirror-palace:settlement',
			},
		});
	});

	it('moves the colony crews through their working institutions before homecoming', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'dub-colony',
			completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace'],
		});
		const schedule = resolveWorldSchedule(createDefaultAdventureSave(), flow.getStoryProgress());

		expect(schedule).toMatchObject({
			beat: 'colony-watch',
			scheduledLocationByNpcId: {
				'auntie-subharmonic': 'dub-colony:safehouse',
				'juno-jar': 'dub-colony:safehouse',
				'naya-root': 'dub-colony:settlement',
				'bassie-knot': 'dub-colony:settlement',
				'old-quasar-jones': 'dub-colony:station',
			},
		});
	});

	it('lets explicit durable relocation remain a separate higher-authority decision', () => {
		const adventure = createDefaultAdventureSave({
			npcStates: {
				'rook-null': {
					met: true,
					trust: 4,
					conversationIds: [],
					flags: [],
					currentLocationId: 'drainmarket:station',
				},
			},
		});
		const schedule = resolveWorldSchedule(
			adventure,
			createGameFlow(undefined, { currentStageId: 'chrome-arcology' }).getStoryProgress()
		);

		expect(schedule.scheduledLocationByNpcId['rook-null']).toBe('chrome-arcology:safehouse');
		expect(adventure.npcStates['rook-null']?.currentLocationId).toBe('drainmarket:station');
	});
});

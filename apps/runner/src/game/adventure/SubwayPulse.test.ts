import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../GameFlow';
import { createDefaultAdventureSave } from './AdventureState';
import { resolveSubwayPulse } from './SubwayPulse';

describe('subway pulse', () => {
	it('changes from extraction meter to pirate public signal', () => {
		const flow = createGameFlow();
		expect(resolveSubwayPulse(createDefaultAdventureSave(), flow.getStoryProgress()).era).toBe(
			'metered-silence'
		);
		expect(
			resolveSubwayPulse(
				createDefaultAdventureSave({ districtPhases: { 'lower-sprawl': 'transformed' } }),
				flow.getStoryProgress()
			).era
		).toBe('pirate-whisper');
	});

	it('frames orbital-lift completion as the return home', () => {
		const flow = createGameFlow(undefined, { completedStageIds: ['orbital-lift'] });
		expect(resolveSubwayPulse(createDefaultAdventureSave(), flow.getStoryProgress()).era).toBe(
			'homebound-static'
		);
	});

	it('turns the subway into a vertical ghost before the Elevator Seed is liberated', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'chrome-arcology',
			completedStageIds: ['lower-sprawl', 'drainmarket'],
		});
		expect(resolveSubwayPulse(createDefaultAdventureSave(), flow.getStoryProgress())).toMatchObject({
			era: 'vertical-ghost',
			label: 'THE VERTICAL GHOST',
		});
	});

	it('closes the colony connection into a peer commons loop after Dub Colony', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'antenna-barrens',
			completedStageIds: [
				'lower-sprawl',
				'drainmarket',
				'chrome-arcology',
				'mirror-palace',
				'dub-colony',
			],
		});
		expect(resolveSubwayPulse(createDefaultAdventureSave(), flow.getStoryProgress())).toMatchObject({
			era: 'commons-loop',
			label: 'THE COMMONS LOOP',
		});
	});

	it('launches the final expedition as a Last Route from an already transformed city', () => {
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
		expect(resolveSubwayPulse(createDefaultAdventureSave(), flow.getStoryProgress())).toMatchObject({
			era: 'last-route',
			label: 'THE LAST ROUTE',
		});
	});
});


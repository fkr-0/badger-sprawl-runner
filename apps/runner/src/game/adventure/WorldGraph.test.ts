import { describe, expect, it } from 'vitest';
import { CAMPAIGN } from '../Campaign';
import {
	ADVENTURE_TRAVEL_GRAPH,
	getDistrictForStage,
	validateWorldGraph,
} from './WorldGraph';

describe('adventure world graph', () => {
	it('is internally valid and covers every campaign stage', () => {
		expect(validateWorldGraph(ADVENTURE_TRAVEL_GRAPH)).toEqual({ valid: true, errors: [] });
		for (const stage of CAMPAIGN.stages) {
			expect(getDistrictForStage(ADVENTURE_TRAVEL_GRAPH, stage.id)?.id).toBe(stage.id);
		}
	});

	it('returns from orbit through the city before the final asteroid launch', () => {
		expect(ADVENTURE_TRAVEL_GRAPH.routes).toContainEqual(
			expect.objectContaining({
				id: 'homecoming:orbital-lift:lower-sprawl',
				from: 'orbital-lift:station',
				to: 'lower-sprawl:station',
			})
		);
		expect(ADVENTURE_TRAVEL_GRAPH.routes).toContainEqual(
			expect.objectContaining({
				id: 'launch:lower-sprawl:asteroid-redoubt',
				from: 'lower-sprawl:station',
				to: 'asteroid-redoubt:station',
			})
		);
		expect(
			ADVENTURE_TRAVEL_GRAPH.routes.some(
				(route) => route.id === 'transit:orbital-lift:asteroid-redoubt'
			)
		).toBe(false);
	});

	it('gives every district a persistent place vocabulary', () => {
		for (const district of ADVENTURE_TRAVEL_GRAPH.districts) {
			const kinds = ADVENTURE_TRAVEL_GRAPH.locations
				.filter((location) => location.districtId === district.id)
				.map((location) => location.kind);
			expect(new Set(kinds)).toEqual(
				new Set(['safehouse', 'settlement', 'route', 'stronghold', 'station'])
			);
			expect(district.postStoryPhase).toBe('transformed');
		}
	});
});

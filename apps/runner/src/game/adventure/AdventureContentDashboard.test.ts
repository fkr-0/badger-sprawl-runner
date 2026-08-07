import { describe, expect, it } from 'vitest';
import { buildAdventureContentDashboard } from './AdventureContentDashboard';

describe('AdventureContentDashboard', () => {
	it('projects one valid production report across authored and procedural catalogs', () => {
		const dashboard = buildAdventureContentDashboard();

		expect(dashboard.errors).toEqual([]);
		expect(dashboard).toMatchObject({
			valid: true,
			generatedAtRevision: 2,
			summary: {
				districts: 8,
				undercityEntrances: 5,
				undercityContracts: 4,
				proceduralVendors: 3,
				proceduralElites: 4,
			},
			missingStageArtIds: [],
			orphanUndercityEntranceIds: [],
		});
		expect(dashboard.districts).toHaveLength(8);
		expect(dashboard.districts.every((district) => district.stageArtReady)).toBe(true);
	});

	it('makes the computer-science motifs queryable instead of hiding them in prose', () => {
		const dashboard = buildAdventureContentDashboard();
		const motifsByQuest = Object.fromEntries(
			dashboard.quests.map((quest) => [quest.id, quest.algorithmicMotifs])
		);

		expect(motifsByQuest['chrome-arcology:contract-no-one-in-the-remainder']).toContain(
			'bin-packing'
		);
		expect(motifsByQuest['dub-colony:side-four-colors-no-crown']).toContain(
			'graph-coloring'
		);
		expect(motifsByQuest['antenna-barrens:side-assume-the-model-is-complete']).toContain(
			'proof-by-contradiction'
		);
		expect(motifsByQuest['asteroid-redoubt:side-incomplete-timetable']).toContain(
			'incompleteness'
		);
		expect(dashboard.summary.algorithmicQuestCount).toBeGreaterThanOrEqual(4);
	});

	it('reports district service and schedule coverage in stable order', () => {
		const dashboard = buildAdventureContentDashboard();
		expect(dashboard.districts.map((district) => district.id)).toEqual([
			'antenna-barrens',
			'asteroid-redoubt',
			'chrome-arcology',
			'drainmarket',
			'dub-colony',
			'lower-sprawl',
			'mirror-palace',
			'orbital-lift',
		]);
		expect(
			dashboard.districts.find((district) => district.id === 'asteroid-redoubt')
		).toMatchObject({
			locationCount: 5,
			placeCount: 3,
			stageArtReady: true,
		});
	});
});

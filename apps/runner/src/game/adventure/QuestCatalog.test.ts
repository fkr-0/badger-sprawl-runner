import { describe, expect, it } from 'vitest';
import { QUEST_CATALOG, getQuestDef, validateQuestCatalog } from './QuestCatalog';

describe('adventure quest catalog', () => {
	it('is structurally valid and gives the Lower Sprawl a full quest set', () => {
		expect(validateQuestCatalog()).toEqual([]);
		expect(QUEST_CATALOG.filter((quest) => quest.districtId === 'lower-sprawl')).toHaveLength(5);
		expect(getQuestDef('lower-sprawl:main-song-of-the-toll')?.steps).toHaveLength(6);
	});

	it('makes the return to the city an explicit main-story step', () => {
		const main = getQuestDef('main:the-city-moves');
		expect(main?.steps.map((step) => step.id)).toContain('take-the-long-way-home');
		expect(main?.steps.map((step) => step.id)).toContain('write-the-last-route');
	});
});


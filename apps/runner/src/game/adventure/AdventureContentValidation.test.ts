import { describe, expect, it } from 'vitest';
import { validateAdventureContent } from './AdventureContentValidation';

describe('adventure content validation', () => {
	it('keeps world, place, NPC, conversation, quest, and consequence references coherent', () => {
		const report = validateAdventureContent();
		expect(report.errors).toEqual([]);
		expect(report).toMatchObject({
			valid: true,
			summary: {
				districts: 8,
				places: 24,
				socialLayouts: 24,
				infrastructureNodes: 23,
				infrastructureLinks: 39,
				scheduleRules: 56,
				npcs: 54,
				quests: 37,
				encounterTopologies: 8,
				encounterZones: 24,
				encounterPortals: 19,
				encounterTraps: 11,
				encounterApproachPlans: 32,
			},
		});
	});
});


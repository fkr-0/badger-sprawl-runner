import { describe, expect, it } from 'vitest';
import { getQuestDef } from './QuestCatalog';
import {
	buildProgressionCadence,
	calculateQuestCompletionExperience,
} from './ProgressionCadence';

describe('progression cadence', () => {
	it('gives authored structural depth more XP without rewarding kill count', () => {
		const global = getQuestDef('main:the-city-moves');
		const contract = getQuestDef('lower-sprawl:contract-silent-platform');
		expect(global && contract).toBeTruthy();
		expect(calculateQuestCompletionExperience(global!)).toBeGreaterThan(
			calculateQuestCompletionExperience(contract!)
		);
	});

	it('keeps the critical campaign near level five and optional completion meaningfully higher', () => {
		const cadence = buildProgressionCadence();
		expect(cadence.milestones).toHaveLength(8);
		expect(cadence.criticalPathLevel).toBeGreaterThanOrEqual(5);
		expect(cadence.criticalPathLevel).toBeLessThanOrEqual(6);
		expect(cadence.completionistLevel).toBeGreaterThan(cadence.criticalPathLevel);
		expect(cadence.milestones.at(-1)?.level).toBe(cadence.criticalPathLevel);
		expect(cadence).toMatchObject({
			campaignBlueprintShards: 12,
			skillNodeCount: 48,
			fullSkillTreeCost: 103,
			supportsFirstCapstone: true,
		});
		expect(cadence.minimumCapstonePathCost).toBeLessThanOrEqual(
			cadence.campaignBlueprintShards
		);
	});
});

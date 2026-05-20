import { describe, expect, it } from 'vitest';
import { DEFAULT_PROCGEN_CATALOG, EncounterGenerator } from './EncounterGenerator';

describe('EncounterGenerator', () => {
	it('generates deterministic enemy packs from stage id and seed', () => {
		const generator = new EncounterGenerator();
		const input = { stageId: 'antenna-barrens', seed: 'static-seed', orbitHeat: 4 };
		expect(generator.generatePack(input)).toEqual(generator.generatePack(input));
	});

	it('selects stage-appropriate enemy families', () => {
		const generator = new EncounterGenerator();
		const pack = generator.generatePack({ stageId: 'drainmarket', seed: 'market-seed' });
		expect(pack.familyId).toBe('drainmarket_knives');
		expect(pack.enemies.length).toBeGreaterThan(0);
		expect(pack.enemies.every((enemy) => enemy.procgenFamily && enemy.procgenRole)).toBe(true);
	});

	it('adds rank and heat budget pressure', () => {
		const generator = new EncounterGenerator({
			...DEFAULT_PROCGEN_CATALOG,
			profiles: [
				{
					stageId: 'test-stage',
					basePackBudget: 5,
					familyWeights: { toll_authority: 1 },
					rankWeights: { elite: 1 },
				},
			],
		});
		const pack = generator.generatePack({ stageId: 'test-stage', seed: 'budget', orbitHeat: 6 });
		expect(pack.rank).toBe('elite');
		expect(pack.budget).toBe(12);
		expect(pack.affixes.length).toBeGreaterThan(0);
	});

	it('does not combine forbidden affix pairs', () => {
		const generator = new EncounterGenerator({
			...DEFAULT_PROCGEN_CATALOG,
			profiles: [
				{
					stageId: 'test-stage',
					basePackBudget: 8,
					familyWeights: { toll_authority: 1 },
					rankWeights: { unique: 1 },
				},
			],
		});
		for (let index = 0; index < 20; index += 1) {
			const pack = generator.generatePack({ stageId: 'test-stage', seed: `forbidden-${index}` });
			expect(pack.affixes).not.toEqual(expect.arrayContaining(['debt_shield', 'mirror_counter']));
			expect(pack.affixes).not.toEqual(expect.arrayContaining(['fast_route', 'knife_cloud']));
		}
	});
});

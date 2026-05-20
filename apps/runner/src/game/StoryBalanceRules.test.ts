import { describe, expect, it } from 'vitest';
import { createDefaultStoryProgress } from './StoryProgressMigration';
import { buildStoryBalanceRules } from './StoryBalanceRules';

const baseMeta = {
	credchips: 0,
	blueprintShards: 0,
	purchasedSkills: [],
	dubFavor: 0,
	orbitHeat: 0,
};

describe('buildStoryBalanceRules', () => {
	it('keeps neutral rules at baseline', () => {
		const rules = buildStoryBalanceRules(baseMeta, createDefaultStoryProgress());
		expect(rules).toMatchObject({
			merchantPriceModifier: 1,
			allyAssistLevel: 'none',
			hazardIntensity: 'standard',
			endingTone: 'undecided',
		});
	});

	it('raises hazard pressure and prices with heat while honoring ally branch support', () => {
		const rules = buildStoryBalanceRules(
			{ ...baseMeta, orbitHeat: 6, dubFavor: 3 },
			{
				...createDefaultStoryProgress(),
				lioTrust: 'protected',
				resultFlags: ['lio_protected', 'ledger_public_dump'],
			}
		);
		expect(rules.merchantPriceModifier).toBeGreaterThan(1);
		expect(rules.hazardIntensity).toBe('extreme');
		expect(rules.allyAssistLevel).toBe('high');
		expect(rules.endingTone).toBe('mercy');
		expect(rules.activeReasons).toEqual(expect.arrayContaining(['heat:6', 'favor:3', 'ledger:public']));
	});

	it('surfaces final broadcast doctrine as ending tone', () => {
		const rules = buildStoryBalanceRules(
			{ ...baseMeta, orbitHeat: 2, dubFavor: 5, purchasedSkills: ['silver_tongue'] },
			{
				...createDefaultStoryProgress(),
				finalBroadcastDoctrine: 'publish-tools',
				resultFlags: ['broadcast_publish_tools'],
			}
		);
		expect(rules.endingTone).toBe('public-tools');
		expect(rules.merchantPriceModifier).toBeLessThan(1);
	});
});

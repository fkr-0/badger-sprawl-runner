import { describe, expect, it } from 'vitest';
import { ResolutionRewardDirector, calculateResolutionExperience } from './ResolutionRewardDirector';
import { WorldDirector } from './WorldDirector';

describe('ResolutionRewardDirector', () => {
	it('awards equal base XP to equal-threat direct and non-combat approaches', () => {
		const claw = calculateResolutionExperience({
			resolutionId: 'a',
			stageId: 'lower-sprawl',
			threatRank: 3,
			approaches: ['claw'],
		});
		const hacking = calculateResolutionExperience({
			resolutionId: 'b',
			stageId: 'lower-sprawl',
			threatRank: 3,
			approaches: ['hacking'],
		});
		expect(claw).toBe(hacking);
	});

	it('records mastery, levels, and an idempotent claim ledger', () => {
		const world = new WorldDirector();
		const rewards = new ResolutionRewardDirector(world);
		const first = rewards.recordResolution({
			resolutionId: 'captain-grin',
			stageId: 'lower-sprawl',
			threatRank: 5,
			approaches: ['hacking', 'social'],
			majorObjective: true,
		});
		const repeated = rewards.recordResolution({
			resolutionId: 'captain-grin',
			stageId: 'lower-sprawl',
			threatRank: 5,
			approaches: ['claw'],
			majorObjective: true,
		});

		expect(first).toMatchObject({ changed: true, levelGained: true, levelAfter: 2 });
		expect(repeated).toMatchObject({ ok: true, changed: false, experience: 0 });
		expect(world.getState().advancement).toMatchObject({
			level: 2,
			mastery: { hacking: 1, social: 1, claw: 0 },
			claimedRewardIds: ['resolution:lower-sprawl:captain-grin'],
		});
	});

	it('rewards demanding constraints without privileging one build family', () => {
		const ordinary = calculateResolutionExperience({
			resolutionId: 'ordinary',
			stageId: 'drainmarket',
			threatRank: 2,
			approaches: ['ballistics'],
		});
		const constrained = calculateResolutionExperience({
			resolutionId: 'constrained',
			stageId: 'drainmarket',
			threatRank: 2,
			approaches: ['ghoststep'],
			nonLethal: true,
			undetected: true,
		});
		expect(constrained).toBeGreaterThan(ordinary);
	});
});

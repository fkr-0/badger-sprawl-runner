import { describe, expect, it } from 'vitest';
import { createGameFlow } from './GameFlow';

function enterLowerSprawl(flow: ReturnType<typeof createGameFlow>): void {
	flow.selectMenu('story');
	flow.advanceTitleCard();
	while (flow.getState().mode === 'dialogue') flow.advanceDialogue();
}

describe('GameFlow first-world runtime results', () => {
	it('awards quest and puzzle progression once and records tutorial flags', () => {
		const flow = createGameFlow();
		enterLowerSprawl(flow);
		const result = {
			stageId: 'lower-sprawl',
			completedQuestIds: ['meter-maidens-ledger'],
			completedMinigameIds: ['toll-gate-rhythm'],
			completedTutorialIds: ['jump-coyote', 'public-route-reading'],
			buildTelemetry: {
				runId: 'run:lower-sprawl:1',
				stageId: 'lower-sprawl',
				durationSeconds: 120,
				loadoutItemIds: ['signal_jammer', 'phase_pick'],
				skillRanks: { hacking: 2 },
				approaches: ['hacking' as const, 'ghoststep' as const],
				damageDealt: 10,
				damageTaken: 2,
				kills: 1,
				alarmsTriggered: 0,
				alarmsSpoofed: 2,
				alarmsDisabled: 1,
				civiliansDocumenting: 0,
				civiliansEvacuated: 0,
				civiliansSheltered: 1,
				standDownAppeals: 1,
				salvageBanked: 5,
				salvageLost: 0,
				deaths: 0,
			},
		};

		flow.recordStageRuntimeResult(result);
		flow.recordStageRuntimeResult(result);

		expect(flow.getMeta()).toMatchObject({
			credchips: 25,
			dubFavor: 2,
			unlockedBoons: ['safer_route_rumor', 'lower_sprawl_route_safety'],
		});
		expect(flow.getStoryProgress().resultFlags).toEqual(
			expect.arrayContaining([
				'quest_meter_maidens_ledger',
				'puzzle_toll_gate_rhythm',
				'tutorial_jump_coyote',
				'tutorial_public_route_reading',
			])
		);
		expect(flow.getBuildTelemetryHistory('lower-sprawl')).toEqual([
			expect.objectContaining({
				runId: 'run:lower-sprawl:1',
				approaches: ['hacking', 'ghoststep'],
			}),
		]);
	});

	it('exposes hydrated skill nodes after spending the first-world shard', () => {
		const flow = createGameFlow({ blueprintShards: 1 });

		expect(flow.purchaseSkill('double_swipe').ok).toBe(true);
		expect(flow.getSkills().find((skill) => skill.id === 'double_swipe')).toMatchObject({
			unlocked: true,
			cost: 1,
		});
		expect(flow.getMeta()).toMatchObject({ blueprintShards: 0, purchasedSkills: ['double_swipe'] });
	});
});

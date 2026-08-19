import { describe, expect, it } from 'vitest';
import {
	advanceEncounter,
	advanceStageGraph,
	createEncounterState,
	createStageGraphState,
} from '@arcade/runtime/stages';
import { CAMPAIGN } from './Campaign';
import {
	advanceBadgerCampaignStage,
	BADGER_CAMPAIGN_ENCOUNTER_PLANS,
	BADGER_CAMPAIGN_STAGE_GRAPH,
	BADGER_HORDE_ENCOUNTER_PLAN,
	createBadgerCampaignStageState,
	inspectBadgerCampaignProgress,
} from './RuntimeStageComposition';

describe('runtime stage composition adapters', () => {
	it('normalizes the authored campaign in chapter order', () => {
		expect(BADGER_CAMPAIGN_STAGE_GRAPH.nodes.map((node) => node.id)).toEqual(
			CAMPAIGN.stages.map((stage) => stage.id),
		);
		expect(BADGER_CAMPAIGN_STAGE_GRAPH.nodes.at(-1)?.terminal).toBe(true);
	});

	it('advances campaign stages through the shared graph contract', () => {
		const initial = createStageGraphState(BADGER_CAMPAIGN_STAGE_GRAPH);
		const advanced = advanceStageGraph(BADGER_CAMPAIGN_STAGE_GRAPH, initial, 'clear');
		expect(advanced.state.currentNodeId).toBe(CAMPAIGN.stages[1]?.id);
		expect(advanced.state.completedNodeIds).toEqual([CAMPAIGN.stages[0]?.id]);
	});

	it('exposes stage rooms and horde waves as shared encounter plans', () => {
		const firstStage = CAMPAIGN.stages[0]!;
		expect(BADGER_CAMPAIGN_ENCOUNTER_PLANS[firstStage.id]?.encounters.at(-1)?.kind).toBe('boss');
		const horde = advanceEncounter(
			BADGER_HORDE_ENCOUNTER_PLAN,
			createEncounterState(BADGER_HORDE_ENCOUNTER_PLAN),
		);
		expect(horde.encounter?.id).toBe('horde-wave-1');
		expect(horde.state.currentEncounterId).toBe('horde-wave-2');
	});

	it('projects persisted story progress into deterministic shared graph state', () => {
		const state = createBadgerCampaignStageState({
			currentStageId: 'mirror-palace',
			completedStageIds: ['drainmarket', 'lower-sprawl', 'unknown-stage'],
			campaignComplete: false,
		});

		expect(state).toMatchObject({
			currentNodeId: 'mirror-palace',
			completedNodeIds: ['lower-sprawl', 'drainmarket'],
			visitedNodeIds: ['lower-sprawl', 'drainmarket', 'mirror-palace'],
			status: 'active',
			sequence: 2,
			revision: 2,
		});
		expect(inspectBadgerCampaignProgress({
			currentStageId: 'mirror-palace',
			completedStageIds: ['lower-sprawl', 'drainmarket'],
			campaignComplete: false,
		})).toMatchObject({
			currentNodeId: 'mirror-palace',
			completed: 2,
			total: CAMPAIGN.stages.length,
		});
	});

	it('advances persisted campaign progress and completes the terminal stage', () => {
		const next = advanceBadgerCampaignStage({
			currentStageId: 'lower-sprawl',
			completedStageIds: ['lower-sprawl'],
			campaignComplete: false,
		});
		expect(next.state.currentNodeId).toBe('drainmarket');
		expect(next.events.map((event) => event.kind)).toContain('stage-transitioned');

		const terminalStage = CAMPAIGN.stages.at(-1)!;
		const completed = advanceBadgerCampaignStage({
			currentStageId: terminalStage.id,
			completedStageIds: CAMPAIGN.stages.map((stage) => stage.id),
			campaignComplete: false,
		});
		expect(completed.state.status).toBe('complete');
		expect(completed.events.map((event) => event.kind)).toContain('graph-completed');
	});

	it('normalizes legacy campaign-complete saves to the terminal graph state', () => {
		const state = createBadgerCampaignStageState({
			currentStageId: 'lower-sprawl',
			completedStageIds: [],
			campaignComplete: true,
		});
		expect(state).toMatchObject({
			currentNodeId: CAMPAIGN.stages.at(-1)?.id,
			completedNodeIds: CAMPAIGN.stages.map((stage) => stage.id),
			visitedNodeIds: CAMPAIGN.stages.map((stage) => stage.id),
			status: 'complete',
		});
	});
});


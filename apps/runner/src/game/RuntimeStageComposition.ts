import {
	advanceStageGraph,
	createEncounterPlan,
	createStageGraph,
	createStageGraphState,
	getCurrentStageNode,
	inspectStageGraphState,
	type ArcadeEncounterPlan,
	type ArcadeStageGraph,
	type ArcadeStageGraphState,
} from '@arcade/runtime/stages';
import { CAMPAIGN } from './Campaign';
import type { CampaignStage } from './campaign/schema';
import type { StoryProgress } from './GameFlow';

function getCampaignStartStageId(): string {
	const stage = CAMPAIGN.stages[0];
	if (!stage) throw new Error('Badger campaign requires at least one stage');
	return stage.id;
}

function createCampaignEncounterPlan(stage: CampaignStage): ArcadeEncounterPlan {
	const rooms = stage.rooms ?? [];
	return createEncounterPlan({
		id: `${stage.id}:encounters`,
		encounters: [
			...rooms.map((room) => ({
				id: `${stage.id}:room:${room.id}`,
				kind: 'stage-room',
				objectiveIds: [`${stage.id}:room:${room.id}:clear`],
				metadata: {
					label: room.label,
					teaches: room.teaches,
				},
			})),
			{
				id: `${stage.id}:boss:${stage.boss.id}`,
				kind: 'boss',
				actorIds: [stage.boss.id],
				objectiveIds: [`${stage.id}:boss:defeat`],
				metadata: {
					name: stage.boss.name,
					phaseCount: stage.boss.phaseCount,
				},
			},
		],
		metadata: { stageId: stage.id, chapter: stage.chapter },
	});
}

export const BADGER_CAMPAIGN_ENCOUNTER_PLANS: Readonly<Record<string, ArcadeEncounterPlan>> =
	Object.freeze(
		Object.fromEntries(
			CAMPAIGN.stages.map((stage) => [stage.id, createCampaignEncounterPlan(stage)]),
		),
	);

export const BADGER_CAMPAIGN_STAGE_GRAPH: ArcadeStageGraph = createStageGraph({
	id: 'badger-sprawl-story-campaign',
	startNodeId: getCampaignStartStageId(),
	nodes: CAMPAIGN.stages.map((stage, index) => {
		const next = CAMPAIGN.stages[index + 1];
		return {
			id: stage.id,
			kind: 'campaign-stage',
			terminal: next === undefined,
			actorIds: [stage.boss.id],
			encounterPlanIds: [`${stage.id}:encounters`],
			objectiveIds: [`${stage.id}:clear`, stage.choice.id],
			transitions: next
				? [{ id: `${stage.id}:clear:${next.id}`, to: next.id, signal: 'clear' }]
				: [],
			metadata: {
				actId: stage.actId,
				chapter: stage.chapter,
				name: stage.name,
				place: stage.place,
				primaryVerb: stage.primaryVerb,
				rewards: stage.rewards,
			},
		};
	}),
});

export type BadgerCampaignProgressInput = Pick<
	StoryProgress,
	'campaignComplete' | 'completedStageIds' | 'currentStageId'
>;

function orderedCampaignStageIds(stageIds: readonly string[]): string[] {
	const selected = new Set(stageIds);
	return BADGER_CAMPAIGN_STAGE_GRAPH.nodes
		.filter((node) => selected.has(node.id))
		.map((node) => node.id);
}

export function createBadgerCampaignStageState(
	progress: BadgerCampaignProgressInput
): ArcadeStageGraphState {
	const knownStageIds = new Set(BADGER_CAMPAIGN_STAGE_GRAPH.nodes.map((node) => node.id));
	const terminalNodeId =
		BADGER_CAMPAIGN_STAGE_GRAPH.nodes.at(-1)?.id ?? BADGER_CAMPAIGN_STAGE_GRAPH.startNodeId;
	const currentNodeId = progress.campaignComplete
		? terminalNodeId
		: knownStageIds.has(progress.currentStageId)
			? progress.currentStageId
			: BADGER_CAMPAIGN_STAGE_GRAPH.startNodeId;
	const completedNodeIds = progress.campaignComplete
		? BADGER_CAMPAIGN_STAGE_GRAPH.nodes.map((node) => node.id)
		: orderedCampaignStageIds(progress.completedStageIds);
	const visitedNodeIds = progress.campaignComplete
		? [...completedNodeIds]
		: orderedCampaignStageIds([...completedNodeIds, currentNodeId]);

	return createStageGraphState(BADGER_CAMPAIGN_STAGE_GRAPH, {
		currentNodeId,
		completedNodeIds,
		visitedNodeIds,
		status: progress.campaignComplete ? 'complete' : 'active',
		sequence: completedNodeIds.length,
		revision: completedNodeIds.length,
	});
}

export function inspectBadgerCampaignProgress(progress: BadgerCampaignProgressInput) {
	return inspectStageGraphState(
		BADGER_CAMPAIGN_STAGE_GRAPH,
		createBadgerCampaignStageState(progress)
	);
}

export function advanceBadgerCampaignStage(progress: BadgerCampaignProgressInput) {
	const state = createBadgerCampaignStageState(progress);
	const current = getCurrentStageNode(BADGER_CAMPAIGN_STAGE_GRAPH, state);
	const signal = current?.terminal ? 'complete' : 'clear';
	return advanceStageGraph(BADGER_CAMPAIGN_STAGE_GRAPH, state, signal);
}

export const BADGER_HORDE_ENCOUNTER_PLAN: ArcadeEncounterPlan = createEncounterPlan({
	id: 'badger-horde-waves',
	encounters: Array.from({ length: 10 }, (_, index) => {
		const wave = index + 1;
		return {
			id: `horde-wave-${wave}`,
			kind: 'combat-wave',
			spawnTableIds: [`horde:wave-${wave}`],
			objectiveIds: [`horde:wave-${wave}:clear`],
			metadata: { wave },
		};
	}),
});


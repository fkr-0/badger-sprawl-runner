import type { QuestConsequenceDef, QuestDef, QuestStepDef } from './QuestCatalog';
import { getQuestDef, getQuestStep } from './QuestCatalog';
import { calculateQuestCompletionExperience } from './ProgressionCadence';
import type { WorldCommandResult, WorldDirector } from './WorldDirector';

export type QuestProgressFailure =
	| 'unknown-quest'
	| 'quest-not-active'
	| 'unknown-step'
	| 'unknown-objective'
	| 'invalid-amount'
	| 'consequence-required'
	| 'unknown-consequence';

export interface QuestProgressResult {
	ok: boolean;
	changed: boolean;
	questId: string;
	stepId?: string;
	stepCompleted?: boolean;
	questCompleted?: boolean;
	awaitingConsequenceIds?: string[];
	failure?: QuestProgressFailure;
	worldResults: WorldCommandResult[];
}

const STORY_STAGE_OBJECTIVES: Record<
	string,
	{ stepId: string; objectiveId: string }
> = {
	'lower-sprawl': { stepId: 'wake-the-low-line', objectiveId: 'lower-sprawl-resolved' },
	drainmarket: { stepId: 'open-the-floodline', objectiveId: 'drainmarket-resolved' },
	'chrome-arcology': { stepId: 'steal-the-elevator-seed', objectiveId: 'elevator-seed-secured' },
	'mirror-palace': { stepId: 'ride-the-sky-mirror', objectiveId: 'mirror-contract-broken' },
	'dub-colony': { stepId: 'learn-the-colony-chorus', objectiveId: 'colony-charter-decided' },
	'antenna-barrens': { stepId: 'publish-the-weather', objectiveId: 'black-ice-fox-resolved' },
	'orbital-lift': { stepId: 'take-the-long-way-home', objectiveId: 'elevator-angel-resolved' },
	'asteroid-redoubt': { stepId: 'write-the-last-route', objectiveId: 'director-vane-resolved' },
};

/**
 * Application service for quest progress and consequences.
 *
 * The catalog owns authored structure, WorldDirector owns durable truth, and
 * this class owns orchestration. Scene and combat code report semantic facts
 * rather than editing quest records directly.
 */
export class QuestDirector {
	constructor(private readonly world: WorldDirector) {}

	startQuest(questId: string): QuestProgressResult {
		const quest = getQuestDef(questId);
		if (!quest) return failure(questId, 'unknown-quest');
		const current = this.world.getState().questStates[questId];
		if (current?.status === 'active' || current?.status === 'completed') {
			return { ok: true, changed: false, questId, stepId: current.stepId, worldResults: [] };
		}
		const result = this.world.execute({
			type: 'set-quest-state',
			questId,
			status: 'active',
			stepId: quest.entryStepId,
		});
		return {
			ok: result.ok,
			changed: result.ok,
			questId,
			stepId: quest.entryStepId,
			worldResults: [result],
		};
	}

	recordObjective(questId: string, objectiveId: string, amount = 1): QuestProgressResult {
		const quest = getQuestDef(questId);
		if (!quest) return failure(questId, 'unknown-quest');
		if (!Number.isFinite(amount) || amount <= 0) return failure(questId, 'invalid-amount');
		const state = this.world.getState().questStates[questId];
		if (!state || state.status !== 'active') return failure(questId, 'quest-not-active');
		const step = getQuestStep(quest, state.stepId ?? quest.entryStepId);
		if (!step) return failure(questId, 'unknown-step');
		const objective = step.objectives.find((candidate) => candidate.id === objectiveId);
		if (!objective) return failure(questId, 'unknown-objective');

		const progressResult = this.world.execute({
			type: 'progress-quest-objective',
			questId,
			objectiveId,
			amount,
		});
		if (!progressResult.ok) {
			return {
				ok: false,
				changed: false,
				questId,
				failure: 'invalid-amount',
				worldResults: [progressResult],
			};
		}
		const worldResults: WorldCommandResult[] = [progressResult];
		const nextState = this.world.getState().questStates[questId];
		if (!stepComplete(step, nextState?.objectiveProgress ?? {})) {
			return { ok: true, changed: true, questId, stepId: step.id, worldResults };
		}
		for (const flag of step.worldFlagsOnComplete ?? []) {
			worldResults.push(this.world.execute({ type: 'set-world-flag', flag }));
		}
		if (step.nextStepId) {
			worldResults.push(
				this.world.execute({
					type: 'set-quest-state',
					questId,
					status: 'active',
					stepId: step.nextStepId,
				})
			);
			return {
				ok: worldResults.every((result) => result.ok),
				changed: true,
				questId,
				stepId: step.nextStepId,
				stepCompleted: true,
				worldResults,
			};
		}
		if (quest.consequences.length > 1) {
			return {
				ok: false,
				changed: true,
				questId,
				stepId: step.id,
				stepCompleted: true,
				failure: 'consequence-required',
				awaitingConsequenceIds: quest.consequences.map((consequence) => consequence.id),
				worldResults,
			};
		}
		return this.completeQuest(quest, quest.consequences[0], worldResults);
	}

	chooseConsequence(questId: string, consequenceId: string): QuestProgressResult {
		const quest = getQuestDef(questId);
		if (!quest) return failure(questId, 'unknown-quest');
		const consequence = quest.consequences.find((candidate) => candidate.id === consequenceId);
		if (!consequence) return failure(questId, 'unknown-consequence');
		return this.completeQuest(quest, consequence, []);
	}

	/**
	 * Transitional compatibility path for a legacy authored stage that reports
	 * an entire quest as complete in one runtime result. New adventure content
	 * should report semantic objectives incrementally instead.
	 */
	reconcileQuestCompletion(
		questId: string,
		consequenceId?: string
	): QuestProgressResult {
		const quest = getQuestDef(questId);
		if (!quest) return failure(questId, 'unknown-quest');
		const existing = this.world.getState().questStates[questId];
		if (existing?.status === 'completed') {
			return { ok: true, changed: false, questId, questCompleted: true, worldResults: [] };
		}
		this.startQuest(questId);
		let lastResult: QuestProgressResult = {
			ok: true,
			changed: false,
			questId,
			worldResults: [],
		};
		for (const step of quest.steps) {
			const current = this.world.getState().questStates[questId];
			if (current?.status === 'completed') return lastResult;
			if (current?.stepId !== step.id) {
				this.world.execute({ type: 'set-quest-state', questId, status: 'active', stepId: step.id });
			}
			for (const objective of step.objectives) {
				const progress =
					this.world.getState().questStates[questId]?.objectiveProgress?.[objective.id] ?? 0;
				const remaining = objective.target - progress;
				if (remaining <= 0) continue;
				lastResult = this.recordObjective(questId, objective.id, remaining);
				if (lastResult.failure === 'consequence-required') {
					return consequenceId
						? this.chooseConsequence(questId, consequenceId)
						: lastResult;
				}
				if (!lastResult.ok) return lastResult;
			}
		}
		return lastResult;
	}

	recordStoryStageCompletion(stageId: string): QuestProgressResult {
		const mapping = STORY_STAGE_OBJECTIVES[stageId];
		if (!mapping) return failure('main:the-city-moves', 'unknown-objective');
		const questId = 'main:the-city-moves';
		const state = this.world.getState().questStates[questId];
		if (!state || state.status !== 'active') this.startQuest(questId);
		const current = this.world.getState().questStates[questId];
		if (current?.stepId !== mapping.stepId) {
			this.world.execute({ type: 'set-quest-state', questId, status: 'active', stepId: mapping.stepId });
		}
		return this.recordObjective(questId, mapping.objectiveId, 1);
	}

	private completeQuest(
		quest: QuestDef,
		consequence: QuestConsequenceDef | undefined,
		worldResults: WorldCommandResult[]
	): QuestProgressResult {
		if (consequence) this.applyConsequence(consequence, worldResults);
		worldResults.push(
			this.world.execute({ type: 'set-quest-state', questId: quest.id, status: 'completed' })
		);
		const rewardId = `quest:${quest.id}`;
		if (!this.world.getState().advancement.claimedRewardIds.includes(rewardId)) {
			worldResults.push(
				this.world.execute({
					type: 'claim-resolution-reward',
					rewardId,
					experience: calculateQuestCompletionExperience(quest),
					approaches: [],
				})
			);
		}
		return {
			ok: worldResults.every((result) => result.ok),
			changed: true,
			questId: quest.id,
			questCompleted: true,
			worldResults,
		};
	}

	private applyConsequence(
		consequence: QuestConsequenceDef,
		worldResults: WorldCommandResult[]
	): void {
		for (const flag of consequence.worldFlags) {
			worldResults.push(this.world.execute({ type: 'set-world-flag', flag }));
		}
		for (const service of consequence.serviceUpgrades ?? []) {
			worldResults.push(
				this.world.execute({
					type: 'set-service-level',
					locationId: service.locationId,
					serviceId: service.serviceId,
					level: service.level,
				})
			);
		}
		for (const relocation of consequence.npcRelocations ?? []) {
			worldResults.push(
				this.world.execute({
					type: 'relocate-npc',
					npcId: relocation.npcId,
					locationId: relocation.locationId,
				})
			);
		}
	}
}

function stepComplete(step: QuestStepDef, progress: Record<string, number>): boolean {
	return step.objectives.every((objective) => (progress[objective.id] ?? 0) >= objective.target);
}

function failure(questId: string, reason: QuestProgressFailure): QuestProgressResult {
	return { ok: false, changed: false, questId, failure: reason, worldResults: [] };
}


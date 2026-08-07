import type { GameFlow, StageRuntimeResult } from '../GameFlow';
import { applyStageCompletion } from './AdventureProgression';
import type { AdventureSaveV2, DistrictStoryPhase } from './AdventureState';
import { ExpeditionDirector } from './ExpeditionDirector';
import { QuestDirector } from './QuestDirector';
import { ResolutionRewardDirector } from './ResolutionRewardDirector';
import { RuntimeQuestBridge } from './RuntimeQuestBridge';
import type { WorldCommandResult, WorldDirector } from './WorldDirector';

/** Application-level composition root for canonical story mode. */
export class AdventureController {
	private readonly quests: QuestDirector;
	private readonly runtimeQuests: RuntimeQuestBridge;
	private readonly rewards: ResolutionRewardDirector;
	private readonly expeditions: ExpeditionDirector;

	constructor(
		private readonly flow: GameFlow,
		private readonly world: WorldDirector
	) {
		this.quests = new QuestDirector(world);
		this.runtimeQuests = new RuntimeQuestBridge(world);
		this.rewards = new ResolutionRewardDirector(world);
		this.expeditions = new ExpeditionDirector(world);
	}

	completeOptionalExpedition(result: StageRuntimeResult): { salvageCredchips: number } {
		const expedition = this.expeditions.commitStageResult(result);
		if (!expedition.ok) throw new Error('optional expedition commit rejected by persistent world');
		if (expedition.salvageCredchips > 0) {
			this.flow.grantCredchips(expedition.salvageCredchips);
		}
		return { salvageCredchips: expedition.salvageCredchips };
	}

	getFlow(): GameFlow {
		return this.flow;
	}

	getWorld(): WorldDirector {
		return this.world;
	}

	getAdventureState(): AdventureSaveV2 {
		return this.world.getState();
	}

	completeStoryStage(result: StageRuntimeResult): void {
		const expedition = this.expeditions.commitStageResult(result);
		if (!expedition.ok) throw new Error('expedition commit rejected by persistent world');
		if (expedition.salvageCredchips > 0) {
			this.flow.grantCredchips(expedition.salvageCredchips);
		}
		this.flow.recordStageRuntimeResult(result);
		this.flow.completeStage();
		applyStageCompletion(this.world, result.stageId);
		this.runtimeQuests.apply(result);
		this.quests.recordStoryStageCompletion(result.stageId);
		this.rewards.recordResolution({
			resolutionId: 'story-stage-complete',
			stageId: result.stageId,
			threatRank: 5,
			approaches: result.resolutionApproaches,
			nonLethal: result.resolutionConstraints?.nonLethal,
			undetected: result.resolutionConstraints?.undetected,
			majorObjective: true,
		});
	}

	debugTravelTo(locationId: string, spawnId?: string): WorldCommandResult {
		return this.world.debugTravelTo(locationId, spawnId);
	}

	debugSetDistrictPhase(districtId: string, phase: DistrictStoryPhase): WorldCommandResult {
		return this.world.execute({ type: 'set-district-phase', districtId, phase });
	}
}

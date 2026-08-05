import type { Scene } from '../engine/SceneManager';
import {
	type GameFlow,
	type MenuOptionId,
	type StageRuntimeResult,
	createGameFlow,
} from '../game/GameFlow';
import { buildExpeditionLaunchState } from '../game/adventure/ExpeditionLedger';
import { WorldDirector } from '../game/adventure/WorldDirector';
import { buildEndlessSprawlRun } from '../procgen/EndlessSprawlRun';
import {
	type ActiveUndercityExpeditionSaveV2,
	buildUndercityExpedition,
	createActiveUndercityExpeditionSave,
	rebuildUndercityExpedition,
} from '../procgen/UndercityExpedition';
import type { AutosaveFeedback, AutosaveReason } from '../storage/AutosaveFeedback';
import { LocationScene } from './LocationScene';
import { LowerSprawlBuildComparisonScene } from './LowerSprawlBuildComparisonScene';
import { SkillTreeScene } from './SkillTreeScene';
import { StageRunScene } from './StageRunScene';
import { StoryFlowScene } from './StoryFlowScene';
import { SubwayMapScene } from './SubwayMapScene';
import { TrainingScene } from './TrainingScene';
import { VersusScene } from './VersusScene';

export type ModeSceneFactories = Record<MenuOptionId, () => Scene> & {
	storyFlow: () => Scene;
	resumeUndercity: (save: ActiveUndercityExpeditionSaveV2) => Scene;
};

export interface DefaultModeSceneFactoryOptions {
	onStartStoryStage?: (scene: Scene) => void;
	onCompleteStoryStage?: (result: StageRuntimeResult) => void;
	onReturnToTitle?: () => void;
	storyFlow?: GameFlow;
	worldDirector?: WorldDirector;
	onAutosave?: (reason: AutosaveReason) => AutosaveFeedback | undefined;
	onOpenStoryFlow?: (scene: Scene) => void;
	onOpenWorldMap?: (scene: Scene) => void;
	onOpenLocation?: (scene: Scene) => void;
	onOpenSkillTree?: (scene: Scene) => void;
	onOpenTraining?: (scene: Scene) => void;
	onOpenUndercity?: (scene: Scene, save: ActiveUndercityExpeditionSaveV2) => void;
	onCompleteUndercity?: (result: StageRuntimeResult, save: ActiveUndercityExpeditionSaveV2) => void;
}

export function createDefaultModeSceneFactories(
	options: DefaultModeSceneFactoryOptions = {}
): ModeSceneFactories {
	const storyFlow = options.storyFlow ?? createGameFlow();
	const worldDirector = options.worldDirector ?? new WorldDirector();
	const createUndercityScene = (activeSave: ActiveUndercityExpeditionSaveV2): StageRunScene => {
		const built = rebuildUndercityExpedition(activeSave.manifest);
		const adventureState = worldDirector.getState();
		return new StageRunScene({
			...built.options,
			expedition: {
				runId: activeSave.manifest.runId,
				inventory: activeSave.runtime.inventory.map((stack) => ({ ...stack })),
				equippedItemIds: [...activeSave.runtime.equippedItemIds],
				itemStates: Object.fromEntries(
					Object.entries(activeSave.runtime.itemStates).map(([itemId, state]) => [
						itemId,
						{ ...state },
					])
				),
				integrity: activeSave.runtime.integrity,
				maxIntegrity: activeSave.runtime.maxIntegrity,
				injuries: activeSave.runtime.injuries,
			},
			expeditionPressureSeed: {
				bankedSalvage: activeSave.bankedSalvage,
				unbankedSalvage: activeSave.unbankedSalvage,
				collectedSourceIds: activeSave.runtime.collectedSourceIds,
			},
			resumedUndercityRoomIndex: activeSave.currentRoomIndex,
			onStageComplete: (result) => options.onCompleteUndercity?.(result, activeSave),
			onReturnToTitle: options.onReturnToTitle,
		});
	};
	const createStoryFlowScene = (): StoryFlowScene =>
		new StoryFlowScene(storyFlow, {
			onAutosave: options.onAutosave,
			onReturnToWorld: () => options.onOpenWorldMap?.(createWorldMapScene()),
			onReturnToTitle: options.onReturnToTitle,
			onStartStage: (stageOptions) => {
				const adventureState = worldDirector.getState();
				const scene = new StageRunScene({
					...stageOptions,
					expedition: buildExpeditionLaunchState(
						adventureState,
						`run:${stageOptions.stageId ?? 'story'}:${adventureState.transitionSequence}:${adventureState.expedition.completedRuns + 1}`
					),
					onStageComplete: options.onCompleteStoryStage,
					onReturnToTitle: options.onReturnToTitle,
				});
				options.onStartStoryStage?.(scene);
			},
		});
	const createWorldMapScene = (): SubwayMapScene =>
		new SubwayMapScene({
			flow: storyFlow,
			world: worldDirector,
			onAutosaveWorld: () => options.onAutosave?.('world-travel'),
			onReturnToTitle: options.onReturnToTitle,
			onDeployStory: () => options.onOpenStoryFlow?.(createStoryFlowScene()),
			onOpenLocation: (locationId) => options.onOpenLocation?.(createLocationScene(locationId)),
		});
	const createLocationScene = (locationId: string): LocationScene =>
		new LocationScene({
			locationId,
			flow: storyFlow,
			world: worldDirector,
			onAutosaveWorld: () => options.onAutosave?.('world-travel'),
			onReturnToMap: () => options.onOpenWorldMap?.(createWorldMapScene()),
			onOpenSkills: () =>
				options.onOpenSkillTree?.(
					new SkillTreeScene({
						flow: storyFlow,
						onAutosave: options.onAutosave,
						onReturnToTitle: options.onReturnToTitle,
					})
				),
			onOpenUndercity: (entranceId) => {
				const adventureState = worldDirector.getState();
				const built = buildUndercityExpedition({
					seed: `world:${adventureState.transitionSequence}:run:${adventureState.expedition.completedRuns + 1}`,
					entranceId,
					depth: Math.min(20, adventureState.expedition.completedRuns + 1),
				});
				const launchState = buildExpeditionLaunchState(adventureState, built.manifest.runId);
				const activeSave = createActiveUndercityExpeditionSave(built.manifest, launchState);
				const scene = createUndercityScene(activeSave);
				options.onOpenUndercity?.(scene, activeSave);
			},
			onReturnToTitle: options.onReturnToTitle,
		});
	return {
		story: createWorldMapScene,
		versus: () => new VersusScene({ onReturnToTitle: options.onReturnToTitle }),
		training: () => new TrainingScene({ onReturnToTitle: options.onReturnToTitle }),
		skills: () =>
			new SkillTreeScene({
				flow: storyFlow,
				onAutosave: options.onAutosave,
				onReturnToTitle: options.onReturnToTitle,
			}),
		builds: () =>
			new LowerSprawlBuildComparisonScene({
				observedRuns: storyFlow.getBuildTelemetryHistory('lower-sprawl'),
				onLaunchTraining: (build) => {
					const kitId = build.approaches.includes('ballistics')
						? 'railgun'
						: build.approaches.includes('ghoststep')
							? 'rocket'
							: 'base';
					const lessonId = build.approaches.includes('hacking')
						? 'codegate'
						: build.approaches.includes('ballistics')
							? 'railgun'
							: 'melee';
					options.onOpenTraining?.(
						new TrainingScene({
							stageId: 'lower-sprawl',
							seed: `build-lab:${build.id}`,
							buildPresetId: build.id,
							unlockedSkills: Object.keys(build.skillRanks),
							skillRanks: build.skillRanks,
							lessonId,
							kitId,
							dummyPresetId: build.approaches.includes('social') ? 'attacking' : 'armored',
							onReturnToTitle: options.onReturnToTitle,
						})
					);
				},
				onReturnToTitle: options.onReturnToTitle,
			}),
		endless: () =>
			new StageRunScene({
				...buildEndlessSprawlRun().options,
				onReturnToTitle: options.onReturnToTitle,
			}),
		storyFlow: createStoryFlowScene,
		resumeUndercity: createUndercityScene,
	};
}

/**
 * TrainingScene - full dummy dojo hosted inside a randomly selected campaign stage.
 */

import type { Scene, SceneContext } from '../engine/SceneManager';
import {
	type TrainingStageSelection,
	createTrainingStageSeed,
	selectTrainingStage,
} from '../game/TrainingStageSelection';
import type { Renderer } from '../renderer/Renderer';
import { RUNTIME_STAGE_IDS, type RuntimeStageId } from '../world/stageLayoutRegistry';
import { StageRunScene, type TrainingRunSnapshot } from './StageRunScene';

export interface TrainingSceneOptions {
	onReturnToTitle?: () => void;
	seed?: string;
	stageId?: RuntimeStageId;
}

export class TrainingScene implements Scene {
	readonly name = 'TrainingScene';

	private selection: TrainingStageSelection;
	private stageScene: StageRunScene;
	private context: SceneContext | null = null;

	constructor(private readonly options: TrainingSceneOptions = {}) {
		const seed = options.seed ?? createTrainingStageSeed();
		const selected = selectTrainingStage(seed);
		this.selection = options.stageId
			? {
					seed,
					stageId: options.stageId,
					stageIndex: RUNTIME_STAGE_IDS.indexOf(options.stageId),
				}
			: selected;
		this.stageScene = this.createStageScene();
	}

	getTrainingState(): TrainingRunSnapshot | null {
		return this.stageScene.getTrainingSnapshot();
	}

	getStageRunScene(): StageRunScene {
		return this.stageScene;
	}

	getGameplayHudLayoutSnapshot(): ReturnType<StageRunScene['getGameplayHudLayoutSnapshot']> {
		return this.stageScene.getGameplayHudLayoutSnapshot();
	}

	getSelectedStage(): TrainingStageSelection {
		return { ...this.selection };
	}

	debugTeleportPlayer(x: number, y: number): void {
		this.stageScene.debugTeleportPlayer(x, y);
	}

	onEnter(ctx: SceneContext): void {
		console.log(`TrainingScene entered // ${this.selection.stageId}`);
		this.context = ctx;
		this.stageScene.onEnter(ctx);
		window.dispatchEvent(
			new CustomEvent('badger:training-stage-selected', { detail: this.getSelectedStage() })
		);
	}

	onExit(): void {
		this.stageScene.onExit();
		this.context = null;
		console.log('TrainingScene exited');
	}

	update(dt: number): void {
		this.stageScene.update(dt);
	}

	render(renderer: Renderer, alpha: number): void {
		this.stageScene.render(renderer, alpha);
	}

	private createStageScene(previous?: TrainingRunSnapshot | null): StageRunScene {
		return new StageRunScene({
			stageId: this.selection.stageId,
			procgenSeed: this.selection.seed,
			generatedEnemyPacks: [],
			generatedSideRooms: [],
			training: {
				enabled: true,
				seed: this.selection.seed,
				lessonId: previous?.lessonId,
				dummyPresetId: previous?.dummyPresetId,
				kitId: previous?.kitId,
				onRerollStage: () => this.rerollStage(),
			},
			onReturnToTitle: this.options.onReturnToTitle,
		});
	}

	private rerollStage(): void {
		const previous = this.stageScene.getTrainingSnapshot();
		this.stageScene.onExit();
		this.selection = selectTrainingStage(createTrainingStageSeed(), this.selection.stageId);
		this.stageScene = this.createStageScene(previous);
		if (this.context) this.stageScene.onEnter(this.context);
		window.dispatchEvent(
			new CustomEvent('badger:training-stage-selected', { detail: this.getSelectedStage() })
		);
	}
}

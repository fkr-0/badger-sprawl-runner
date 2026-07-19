import type { ArcadePerformanceSummary } from '../../../vendor/arcade-runtime.mjs';
import { type RunnerApp, createRunnerApp } from './RunnerApp';
import type { MenuOptionId } from './game/GameFlow';
import { createBadgerPixiBridge, isBadgerPixiBridgeRequested } from './renderer/BadgerPixiBridge';
import { runtimeToolsEnabled } from './runtime/RuntimeEnvironment';
import type { SkillTreeScene } from './scenes/SkillTreeScene';
import type { StageRunScene } from './scenes/StageRunScene';
import type { StoryFlowScene } from './scenes/StoryFlowScene';
import type { TrainingScene } from './scenes/TrainingScene';

export interface RunnerBootstrapResult {
	app: RunnerApp;
	canvas: HTMLCanvasElement;
}

export interface BadgerTestHarness {
	getSceneName: () => string;
	getPlayer: () => ReturnType<StageRunScene['getPlayerSnapshot']> | null;
	getEnemies: () => ReturnType<StageRunScene['getEnemySnapshots']> | null;
	getPickups: () => ReturnType<StageRunScene['getPickupSnapshots']> | null;
	getAnimation: () => ReturnType<StageRunScene['getAnimationSnapshot']> | null;
	getLowerSprawlObjectives: () => ReturnType<
		StageRunScene['getLowerSprawlObjectiveSnapshot']
	> | null;
	getDrainmarketObjectives: () => ReturnType<
		StageRunScene['getDrainmarketObjectiveSnapshot']
	> | null;
	getChromeArcologyObjectives: () => ReturnType<
		StageRunScene['getChromeArcologyObjectiveSnapshot']
	> | null;
	getMirrorPalaceObjectives: () => ReturnType<
		StageRunScene['getMirrorPalaceObjectiveSnapshot']
	> | null;
	getDubColonyObjectives: () => ReturnType<StageRunScene['getDubColonyObjectiveSnapshot']> | null;
	getBossPhase: () => ReturnType<StageRunScene['getBossPhaseSnapshot']> | null;
	getCaptainGrin: () => ReturnType<StageRunScene['getCaptainGrinSnapshot']> | null;
	getKnifeDroneNest: () => ReturnType<StageRunScene['getKnifeDroneNestSnapshot']> | null;
	getMadameVitrine: () => ReturnType<StageRunScene['getMadameVitrineSnapshot']> | null;
	getReflectionJudge: () => ReturnType<StageRunScene['getReflectionJudgeSnapshot']> | null;
	getKingFeedback: () => ReturnType<StageRunScene['getKingFeedbackSnapshot']> | null;
	getCompanions: () => ReturnType<StageRunScene['getCompanionSnapshot']> | null;
	getLowerSprawlHazards: () => ReturnType<StageRunScene['getLowerSprawlHazardSnapshot']> | null;
	getCheckpoint: () => ReturnType<StageRunScene['getCheckpointSnapshot']> | null;
	getLoadout: () => ReturnType<StageRunScene['getLoadoutSnapshot']> | null;
	getStoryState: () => ReturnType<RunnerApp['getFlow']>['getState'] extends () => infer T
		? T
		: never;
	getMeta: () => ReturnType<RunnerApp['getFlow']>['getMeta'] extends () => infer T ? T : never;
	getStoryProgress: () => ReturnType<RunnerApp['getFlow']>['getStoryProgress'] extends () => infer T
		? T
		: never;
	getStoryPanelLayout: () => ReturnType<StoryFlowScene['getPanelLayoutSnapshot']> | null;
	getStoryPresentation: () => ReturnType<StoryFlowScene['getPresentationSnapshot']> | null;
	getSkillTree: () => ReturnType<SkillTreeScene['getSnapshot']> | null;
	getTraining: () => ReturnType<TrainingScene['getTrainingState']> | null;
	getGameplayHudLayout: () => ReturnType<StageRunScene['getGameplayHudLayoutSnapshot']> | null;
	getActorRenderContract: () => ReturnType<
		RunnerApp['getRenderer']
	>['getActorRenderContract'] extends () => infer T
		? T
		: never;
	teleportPlayer: (x: number, y: number) => void;
	setBossHp: (hp: number) => void;
	setEnemyHp: (enemyId: string, hp: number) => void;
	setPlayerHp: (hp: number) => void;
	routeMode: (modeId: MenuOptionId) => void;
	getLoadedSheetIds: () => string[];
	hasSheet: (sheetId: string) => boolean;
	getRendererMode: () => 'canvas' | 'bridge';
	getRendererPerformance: () => ArcadePerformanceSummary;
	getBridgePerformance: () => ArcadePerformanceSummary | null;
}

interface RunnerWindow extends Window {
	__app?: RunnerApp;
	__badger?: BadgerTestHarness;
}

interface SpriteRendererWithSheetMap {
	sheets?: Map<string, unknown>;
}

function installTestHarness(app: RunnerApp): void {
	const runnerWindow = window as RunnerWindow;
	// Expose app for advanced test access
	runnerWindow.__app = app;
	const getStageScene = (): StageRunScene | null => {
		const scene = app.getCurrentScene();
		if (scene && 'getStageRunScene' in scene) {
			return (scene as TrainingScene).getStageRunScene();
		}
		return scene && 'getPlayerSnapshot' in scene ? (scene as StageRunScene) : null;
	};

	const h: BadgerTestHarness = {
		getSceneName: () => app.getCurrentScene()?.name ?? 'none',
		getPlayer: () => {
			return getStageScene()?.getPlayerSnapshot() ?? null;
		},
		setEnemyHp: (enemyId, hp) => {
			getStageScene()?.debugSetEnemyHp(enemyId, hp);
		},
		getKingFeedback: () => {
			const s = app.getCurrentScene();
			return s && 'getKingFeedbackSnapshot' in s
				? (s as StageRunScene).getKingFeedbackSnapshot()
				: null;
		},
		getCompanions: () => {
			const s = app.getCurrentScene();
			return s && 'getCompanionSnapshot' in s ? (s as StageRunScene).getCompanionSnapshot() : null;
		},
		getDubColonyObjectives: () => {
			const s = app.getCurrentScene();
			return s && 'getDubColonyObjectiveSnapshot' in s
				? (s as StageRunScene).getDubColonyObjectiveSnapshot()
				: null;
		},
		getStoryPresentation: () => {
			const s = app.getCurrentScene();
			return s && 'getPresentationSnapshot' in s
				? (s as StoryFlowScene).getPresentationSnapshot()
				: null;
		},
		getReflectionJudge: () => {
			const s = app.getCurrentScene();
			return s && 'getReflectionJudgeSnapshot' in s
				? (s as StageRunScene).getReflectionJudgeSnapshot()
				: null;
		},
		getMirrorPalaceObjectives: () => {
			const s = app.getCurrentScene();
			return s && 'getMirrorPalaceObjectiveSnapshot' in s
				? (s as StageRunScene).getMirrorPalaceObjectiveSnapshot()
				: null;
		},
		getMadameVitrine: () => {
			const s = app.getCurrentScene();
			return s && 'getMadameVitrineSnapshot' in s
				? (s as StageRunScene).getMadameVitrineSnapshot()
				: null;
		},
		getChromeArcologyObjectives: () => {
			const s = app.getCurrentScene();
			return s && 'getChromeArcologyObjectiveSnapshot' in s
				? (s as StageRunScene).getChromeArcologyObjectiveSnapshot()
				: null;
		},
		getDrainmarketObjectives: () => {
			const s = app.getCurrentScene();
			return s && 'getDrainmarketObjectiveSnapshot' in s
				? (s as StageRunScene).getDrainmarketObjectiveSnapshot()
				: null;
		},
		getKnifeDroneNest: () => {
			const s = app.getCurrentScene();
			return s && 'getKnifeDroneNestSnapshot' in s
				? (s as StageRunScene).getKnifeDroneNestSnapshot()
				: null;
		},
		getBossPhase: () => {
			const s = app.getCurrentScene();
			return s && 'getBossPhaseSnapshot' in s ? (s as StageRunScene).getBossPhaseSnapshot() : null;
		},
		getCaptainGrin: () => {
			const s = app.getCurrentScene();
			return s && 'getCaptainGrinSnapshot' in s
				? (s as StageRunScene).getCaptainGrinSnapshot()
				: null;
		},
		getLowerSprawlHazards: () => {
			const s = app.getCurrentScene();
			return s && 'getLowerSprawlHazardSnapshot' in s
				? (s as StageRunScene).getLowerSprawlHazardSnapshot()
				: null;
		},
		getCheckpoint: () => {
			const s = app.getCurrentScene();
			return s && 'getCheckpointSnapshot' in s
				? (s as StageRunScene).getCheckpointSnapshot()
				: null;
		},
		getLoadout: () => {
			const s = app.getCurrentScene();
			return s && 'getLoadoutSnapshot' in s ? (s as StageRunScene).getLoadoutSnapshot() : null;
		},
		getEnemies: () => {
			return getStageScene()?.getEnemySnapshots() ?? null;
		},
		getPickups: () => {
			return getStageScene()?.getPickupSnapshots() ?? null;
		},
		getAnimation: () => {
			return getStageScene()?.getAnimationSnapshot() ?? null;
		},
		getLowerSprawlObjectives: () => {
			const s = app.getCurrentScene();
			return s && 'getLowerSprawlObjectiveSnapshot' in s
				? (s as StageRunScene).getLowerSprawlObjectiveSnapshot()
				: null;
		},
		getStoryState: () => app.getFlow().getState(),
		getMeta: () => app.getFlow().getMeta(),
		getStoryProgress: () => app.getFlow().getStoryProgress(),
		getStoryPanelLayout: () => {
			const s = app.getCurrentScene();
			return s && 'getPanelLayoutSnapshot' in s
				? (s as StoryFlowScene).getPanelLayoutSnapshot()
				: null;
		},
		getSkillTree: () => {
			const s = app.getCurrentScene();
			return s && 'getSnapshot' in s ? (s as SkillTreeScene).getSnapshot() : null;
		},
		getTraining: () => {
			const scene = app.getCurrentScene();
			return scene && 'getTrainingState' in scene
				? (scene as TrainingScene).getTrainingState()
				: null;
		},
		getGameplayHudLayout: () => {
			const scene = app.getCurrentScene();
			if (scene && 'getGameplayHudLayoutSnapshot' in scene) {
				return (scene as TrainingScene).getGameplayHudLayoutSnapshot();
			}
			return getStageScene()?.getGameplayHudLayoutSnapshot() ?? null;
		},
		getActorRenderContract: () => app.getRenderer().getActorRenderContract(),
		teleportPlayer: (x, y) => {
			getStageScene()?.debugTeleportPlayer(x, y);
		},
		setBossHp: (hp) => {
			getStageScene()?.debugSetBossHp(hp);
		},
		setPlayerHp: (hp) => {
			getStageScene()?.debugSetPlayerHp(hp);
		},
		routeMode: (modeId) => app.routeMode(modeId),
		getLoadedSheetIds: () => {
			const renderer = app.getRenderer?.();
			const spriteRenderer = renderer?.getSpriteRenderer?.();
			if (!spriteRenderer) return [];
			// Access internal sheets map via reflection
			const sheets = (spriteRenderer as unknown as SpriteRendererWithSheetMap).sheets;
			return sheets ? Array.from(sheets.keys()) : [];
		},
		hasSheet: (sheetId: string) => {
			const renderer = app.getRenderer?.();
			const spriteRenderer = renderer?.getSpriteRenderer?.();
			return spriteRenderer?.hasSheet(sheetId) ?? false;
		},
		getRendererMode: () => app.getRendererMode(),
		getRendererPerformance: () => app.getRendererPerformance(),
		getBridgePerformance: () => app.getBridgePerformance(),
	};
	runnerWindow.__badger = h;
}

export function bootstrapRunnerApp(doc: Document = document): RunnerBootstrapResult | null {
	const canvas = doc.querySelector<HTMLCanvasElement>('#game');
	if (!canvas) return null;

	const app = createRunnerApp(canvas);
	app.start();
	if (isBadgerPixiBridgeRequested()) {
		const mount = canvas.parentElement;
		if (mount) {
			void createBadgerPixiBridge({
				mount,
				sourceCanvas: canvas,
				width: canvas.width,
				height: canvas.height,
			}).then((controller) => app.setPixiBridge(controller));
		}
	}
	if (runtimeToolsEnabled()) installTestHarness(app);

	return { app, canvas };
}

if (typeof document !== 'undefined') {
	bootstrapRunnerApp(document);
}

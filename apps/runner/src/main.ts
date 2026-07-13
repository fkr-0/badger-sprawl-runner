import { type RunnerApp, createRunnerApp } from './RunnerApp';
import type { MenuOptionId } from './game/GameFlow';
import type { SkillTreeScene } from './scenes/SkillTreeScene';
import type { StageRunScene } from './scenes/StageRunScene';

export interface RunnerBootstrapResult {
	app: RunnerApp;
	canvas: HTMLCanvasElement;
	statusEl: HTMLElement | null;
	miniEl: HTMLElement | null;
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
	getBossPhase: () => ReturnType<StageRunScene['getBossPhaseSnapshot']> | null;
	getCaptainGrin: () => ReturnType<StageRunScene['getCaptainGrinSnapshot']> | null;
	getLowerSprawlHazards: () => ReturnType<StageRunScene['getLowerSprawlHazardSnapshot']> | null;
	getLoadout: () => ReturnType<StageRunScene['getLoadoutSnapshot']> | null;
	getStoryState: () => ReturnType<RunnerApp['getFlow']>['getState'] extends () => infer T
		? T
		: never;
	getMeta: () => ReturnType<RunnerApp['getFlow']>['getMeta'] extends () => infer T ? T : never;
	getStoryProgress: () => ReturnType<RunnerApp['getFlow']>['getStoryProgress'] extends () => infer T
		? T
		: never;
	getSkillTree: () => ReturnType<SkillTreeScene['getSnapshot']> | null;
	teleportPlayer: (x: number, y: number) => void;
	setBossHp: (hp: number) => void;
	routeMode: (modeId: MenuOptionId) => void;
	getLoadedSheetIds: () => string[];
	hasSheet: (sheetId: string) => boolean;
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

	const h: BadgerTestHarness = {
		getSceneName: () => app.getCurrentScene()?.name ?? 'none',
		getPlayer: () => {
			const s = app.getCurrentScene();
			return s && 'getPlayerSnapshot' in s ? (s as StageRunScene).getPlayerSnapshot() : null;
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
		getLoadout: () => {
			const s = app.getCurrentScene();
			return s && 'getLoadoutSnapshot' in s ? (s as StageRunScene).getLoadoutSnapshot() : null;
		},
		getEnemies: () => {
			const s = app.getCurrentScene();
			return s && 'getEnemySnapshots' in s ? (s as StageRunScene).getEnemySnapshots() : null;
		},
		getPickups: () => {
			const s = app.getCurrentScene();
			return s && 'getPickupSnapshots' in s ? (s as StageRunScene).getPickupSnapshots() : null;
		},
		getAnimation: () => {
			const s = app.getCurrentScene();
			return s && 'getAnimationSnapshot' in s ? (s as StageRunScene).getAnimationSnapshot() : null;
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
		getSkillTree: () => {
			const s = app.getCurrentScene();
			return s && 'getSnapshot' in s ? (s as SkillTreeScene).getSnapshot() : null;
		},
		teleportPlayer: (x, y) => {
			const s = app.getCurrentScene();
			if (s && 'debugTeleportPlayer' in s) (s as StageRunScene).debugTeleportPlayer(x, y);
		},
		setBossHp: (hp) => {
			const s = app.getCurrentScene();
			if (s && 'debugSetBossHp' in s) (s as StageRunScene).debugSetBossHp(hp);
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
	};
	runnerWindow.__badger = h;
}

export function bootstrapRunnerApp(doc: Document = document): RunnerBootstrapResult | null {
	const canvas = doc.querySelector<HTMLCanvasElement>('#game');
	if (!canvas) return null;

	const statusEl = doc.querySelector<HTMLElement>('#status');
	const miniEl = doc.querySelector<HTMLElement>('#minigame');
	const app = createRunnerApp(canvas);
	app.start();
	installTestHarness(app);

	if (statusEl) {
		statusEl.innerHTML = '<strong>Mode:</strong> SceneManager shell';
	}
	if (miniEl) {
		miniEl.innerHTML =
			'<strong>Controls:</strong> Arrow keys navigate. Enter/Space confirms. Escape/back behavior is scene-specific.<br/><strong>Implemented slice:</strong> SceneManager routes Story, VS, Training, and Skills through concrete scenes.';
	}

	return { app, canvas, statusEl, miniEl };
}

if (typeof document !== 'undefined') {
	bootstrapRunnerApp(document);
}

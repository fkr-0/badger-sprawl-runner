import { createRunnerApp, type RunnerApp } from './RunnerApp';
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
	routeMode: (modeId: string) => void;
	getLoadedSheetIds: () => string[];
	hasSheet: (sheetId: string) => boolean;
}

function installTestHarness(app: RunnerApp): void {
	// Expose app for advanced test access
	(window as any).__app = app;

	const h: BadgerTestHarness = {
		getSceneName: () => app.getCurrentScene()?.name ?? 'none',
		getPlayer: () => {
			const s = app.getCurrentScene();
			return s && 'getPlayerSnapshot' in s ? (s as StageRunScene).getPlayerSnapshot() : null;
		},
		getEnemies: () => {
			const s = app.getCurrentScene();
			return s && 'getEnemySnapshots' in s ? (s as StageRunScene).getEnemySnapshots() : null;
		},
		getPickups: () => {
			const s = app.getCurrentScene();
			return s && 'getPickupSnapshots' in s ? (s as StageRunScene).getPickupSnapshots() : null;
		},
		routeMode: (modeId: string) => app.routeMode(modeId as any),
		getLoadedSheetIds: () => {
			const renderer = app.getRenderer?.();
			const spriteRenderer = renderer?.getSpriteRenderer?.();
			if (!spriteRenderer) return [];
			// Access internal sheets map via reflection
			const sheets = (spriteRenderer as any).sheets;
			return sheets ? Array.from(sheets.keys()) : [];
		},
		hasSheet: (sheetId: string) => {
			const renderer = app.getRenderer?.();
			const spriteRenderer = renderer?.getSpriteRenderer?.();
			return spriteRenderer?.hasSheet(sheetId) ?? false;
		},
	};
	(window as any).__badger = h;
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

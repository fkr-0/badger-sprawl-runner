import type { Scene } from '../engine/SceneManager';
import type { MenuOptionId } from './GameFlow';

export type ModeSceneFactories = Record<MenuOptionId, () => Scene>;

export interface SceneManagerLike {
	replace(scene: Scene): void;
}

export function createModeScene(modeId: MenuOptionId, factories: ModeSceneFactories): Scene {
	return factories[modeId]();
}

export function routeModeSelection(
	sceneManager: SceneManagerLike,
	modeId: MenuOptionId,
	factories: ModeSceneFactories
): void {
	sceneManager.replace(createModeScene(modeId, factories));
}

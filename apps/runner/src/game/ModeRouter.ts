import type { Scene } from '../engine/SceneManager';
import type { MenuOptionId } from './GameFlow';
import { MODE_SCENE_ROUTES } from './ModeMenu';

export interface SceneManagerLike {
	replace(scene: Scene): void;
}

class RoutedModeScene implements Scene {
	readonly name: string;

	constructor(name: string) {
		this.name = name;
	}

	onEnter(): void {}
	onExit(): void {}
	update(): void {}
	render(): void {}
}

export function createModeScene(modeId: MenuOptionId): Scene {
	return new RoutedModeScene(MODE_SCENE_ROUTES[modeId].sceneName);
}

export function routeModeSelection(sceneManager: SceneManagerLike, modeId: MenuOptionId): void {
	sceneManager.replace(createModeScene(modeId));
}

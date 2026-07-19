/** Shared arcade-core scene stack adapted to Badger's renderer context. */

import { createSceneStack } from '../../../../vendor/arcade-runtime.mjs';
import type { Renderer } from '../renderer/Renderer';
import type { EventBus } from './EventBus';

export interface Scene {
	readonly name: string;
	onEnter(ctx: SceneContext): void;
	onExit(): void;
	update(dt: number): void;
	render(renderer: Renderer, alpha: number): void;
}

export interface SceneContext {
	eventBus: EventBus;
	canvas: HTMLCanvasElement;
	renderer: Renderer;
}

export class SceneManager {
	private readonly stack;

	constructor(context: SceneContext) {
		this.stack = createSceneStack<SceneContext, Scene>({ context });
	}

	push(scene: Scene): void {
		this.stack.push(scene);
	}

	clear(): void {
		this.stack.clear();
	}

	pop(): Scene | undefined {
		return this.stack.pop();
	}

	replace(scene: Scene): void {
		this.stack.replace(scene);
	}

	getCurrent(): Scene | undefined {
		return this.stack.current();
	}

	update(dt: number): void {
		this.stack.update(dt);
	}

	render(renderer: Renderer, alpha: number): void {
		this.stack.render(renderer, alpha);
	}
}

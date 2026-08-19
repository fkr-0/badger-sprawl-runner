/** Shared arcade-runtime scene stack adapted to Badger's renderer context. */

import { createSceneStack } from '@arcade/runtime/core';
import type { Renderer } from '../renderer/Renderer';
import type { EventBus } from './EventBus';

export interface Scene {
	readonly name: string;
	onEnter(ctx: SceneContext): void;
	onExit(): void;
	update(dt: number): void;
	render(renderer: Renderer, alpha: number): void;
}

export interface SceneChangeDetail {
	operation: 'push' | 'pop' | 'replace' | 'clear';
	previousSceneName: string | null;
	sceneName: string | null;
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
		const previousSceneName = this.stack.current()?.name ?? null;
		this.stack.push(scene);
		this.emitSceneChange('push', previousSceneName);
	}

	clear(): void {
		const previousSceneName = this.stack.current()?.name ?? null;
		this.stack.clear();
		this.emitSceneChange('clear', previousSceneName);
	}

	pop(): Scene | undefined {
		const previousSceneName = this.stack.current()?.name ?? null;
		const popped = this.stack.pop();
		this.emitSceneChange('pop', previousSceneName);
		return popped;
	}

	replace(scene: Scene): void {
		const previousSceneName = this.stack.current()?.name ?? null;
		this.stack.replace(scene);
		this.emitSceneChange('replace', previousSceneName);
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

	private emitSceneChange(
		operation: SceneChangeDetail['operation'],
		previousSceneName: string | null
	): void {
		if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
		window.dispatchEvent(
			new CustomEvent<SceneChangeDetail>('badger:scene-change', {
				detail: {
					operation,
					previousSceneName,
					sceneName: this.stack.current()?.name ?? null,
				},
			})
		);
	}
}

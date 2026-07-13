/**
 * Scene management with push/pop/replace transitions
 */

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
	private stack: Scene[] = [];

	constructor(private context: SceneContext) {}

	push(scene: Scene): void {
		this.stack.push(scene);
		scene.onEnter(this.context);
	}

	clear(): void {
		while (this.stack.length > 0) {
			this.stack.pop()?.onExit();
		}
	}

	pop(): Scene | undefined {
		const current = this.stack.pop();
		if (current) {
			current.onExit();
		}
		return current;
	}

	replace(scene: Scene): void {
		const current = this.stack.pop();
		if (current) {
			current.onExit();
		}
		this.stack.push(scene);
		scene.onEnter(this.context);
	}

	getCurrent(): Scene | undefined {
		return this.stack[this.stack.length - 1];
	}

	update(dt: number): void {
		const current = this.getCurrent();
		if (current) {
			current.update(dt);
		}
	}

	render(renderer: Renderer, alpha: number): void {
		const current = this.getCurrent();
		if (current) {
			current.render(renderer, alpha);
		}
	}
}

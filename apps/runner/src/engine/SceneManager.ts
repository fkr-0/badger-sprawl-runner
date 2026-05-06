/**
 * Scene management with push/pop/replace transitions
 */

import type { EventBus } from './EventBus';

export interface Scene {
  readonly name: string;
  onEnter(ctx: SceneContext): void;
  onExit(): void;
  update(dt: number): void;
  render(renderer: unknown, alpha: number): void;
}

export interface SceneContext {
  eventBus: EventBus;
  canvas: HTMLCanvasElement;
}

export class SceneManager {
  private stack: Scene[] = [];

  constructor(private context: SceneContext) {}

  push(scene: Scene): void {
    this.stack.push(scene);
    scene.onEnter(this.context);
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

  render(renderer: unknown, alpha: number): void {
    const current = this.getCurrent();
    if (current) {
      current.render(renderer, alpha);
    }
  }
}

import type { Scene, SceneContext } from '../engine/SceneManager';
import { type GameFlow, createGameFlow } from '../game/GameFlow';

export class StoryFlowScene implements Scene {
	readonly name = 'StoryFlowScene';

	constructor(private readonly flow: GameFlow = createGameFlow()) {}

	getFlow(): GameFlow {
		return this.flow;
	}

	onEnter(_ctx: SceneContext): void {
		if (this.flow.getState().mode === 'menu') {
			this.flow.selectMenu('story');
		}
	}

	onExit(): void {}
	update(_dt: number): void {}

	render(renderer: unknown, _alpha: number): void {
		const maybeRenderer = renderer as { getContext?: () => CanvasRenderingContext2D };
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;

		const state = this.flow.getState();
		ctx.save();
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 20px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(`Story Flow: ${state.mode}`, ctx.canvas.width / 2, 80);
		ctx.restore();
	}
}

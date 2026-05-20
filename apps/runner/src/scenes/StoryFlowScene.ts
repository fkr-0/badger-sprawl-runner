import type { Scene, SceneContext } from '../engine/SceneManager';
import { type GameFlow, createGameFlow } from '../game/GameFlow';
import type { Renderer } from '../renderer/Renderer';

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
		const maybeRenderer = renderer as Renderer;
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;

		const state = this.flow.getState();
		ctx.save();
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 20px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText(`Story Flow: ${state.mode}`, ctx.canvas.width / 2, 80);

		if (state.mode === 'dialogue') {
			const dialogue = this.flow.getCurrentDialogue();
			if (dialogue) {
				this.renderDialoguePanel(ctx, maybeRenderer, dialogue.speaker, dialogue.lines[state.lineIndex] ?? '');
			}
		} else if (state.mode === 'debrief') {
			const debrief = this.flow.getCurrentDebrief();
			if (debrief) {
				this.renderDialoguePanel(ctx, maybeRenderer, debrief.speaker, debrief.lines[state.lineIndex] ?? '');
			}
		}

		ctx.restore();
	}

	private renderDialoguePanel(
		ctx: CanvasRenderingContext2D,
		renderer: Renderer,
		speaker: string,
		line: string
	): void {
		const panelX = 54;
		const panelY = ctx.canvas.height - 172;
		const panelW = ctx.canvas.width - 108;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.88)';
		ctx.fillRect(panelX, panelY, panelW, 124);
		ctx.strokeStyle = '#67f3c4';
		ctx.strokeRect(panelX, panelY, panelW, 124);

		renderer.renderDialoguePortrait(speaker, panelX + 18, panelY + 24, 72);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#67f3c4';
		ctx.font = '700 16px ui-monospace, monospace';
		ctx.fillText(speaker, panelX + 108, panelY + 36);
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '14px ui-monospace, monospace';
		ctx.fillText(line.slice(0, 96), panelX + 108, panelY + 68);
	}
}

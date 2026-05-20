import type { Scene, SceneContext } from '../engine/SceneManager';
import { type GameFlow, createGameFlow } from '../game/GameFlow';
import type { Renderer } from '../renderer/Renderer';

export class StoryFlowScene implements Scene {
	readonly name = 'StoryFlowScene';

	private selectedChoiceIndex = 0;
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private lastChoiceResult = '';

	constructor(private readonly flow: GameFlow = createGameFlow()) {}

	getFlow(): GameFlow {
		return this.flow;
	}

	onEnter(_ctx: SceneContext): void {
		if (this.flow.getState().mode === 'menu') {
			this.flow.selectMenu('story');
		}
		this.keyHandler = (event) => this.handleKeyDown(event);
		window.addEventListener('keydown', this.keyHandler);
	}

	onExit(): void {
		if (this.keyHandler) {
			window.removeEventListener('keydown', this.keyHandler);
		}
	}

	private handleKeyDown(event: KeyboardEvent): void {
		const state = this.flow.getState();
		if (state.mode === 'dialogue') {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.flow.advanceDialogue();
			}
			return;
		}
		if (state.mode === 'debrief') {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.flow.advanceDebrief();
			}
			return;
		}
		if (state.mode !== 'stage') return;
		const stage = this.flow.getCurrentStage();
		const choices = stage?.choiceOutcomes ?? [];
		if (choices.length === 0) return;
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			this.selectedChoiceIndex = (this.selectedChoiceIndex + choices.length - 1) % choices.length;
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % choices.length;
		} else if (/^[1-9]$/.test(event.key)) {
			const index = Number(event.key) - 1;
			if (index < choices.length) this.chooseStageChoice(index);
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			this.chooseStageChoice(this.selectedChoiceIndex);
		}
	}

	private chooseStageChoice(choiceIndex: number): void {
		const result = this.flow.chooseStageChoice(choiceIndex);
		if (result.ok) {
			this.lastChoiceResult = `${result.branch} / ${result.resultFlag}`;
			return;
		}
		this.lastChoiceResult = result.reason;
	}
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
		} else if (state.mode === 'stage') {
			this.renderStageChoicePanel(ctx);
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

	private renderStageChoicePanel(ctx: CanvasRenderingContext2D): void {
		const stage = this.flow.getCurrentStage();
		if (!stage?.choiceOutcomes?.length) return;
		const panelX = 54;
		const panelY = ctx.canvas.height - 220;
		const panelW = ctx.canvas.width - 108;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(panelX, panelY, panelW, 190);
		ctx.strokeStyle = '#ffb35e';
		ctx.strokeRect(panelX, panelY, panelW, 190);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#ffb35e';
		ctx.font = '700 15px ui-monospace, monospace';
		ctx.fillText(stage.dramaticQuestion, panelX + 22, panelY + 30);
		ctx.font = '14px ui-monospace, monospace';
		for (const [index, outcome] of stage.choiceOutcomes.entries()) {
			const y = panelY + 62 + index * 32;
			const selected = index === this.selectedChoiceIndex;
			ctx.fillStyle = selected ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(`${selected ? '>' : ' '} ${index + 1}. ${outcome.prompt}`, panelX + 28, y);
			ctx.fillStyle = selected ? '#cfeee4' : '#8d94a7';
			ctx.fillText(outcome.consequence.slice(0, 92), panelX + 62, y + 17);
		}
		const sideQuest = stage.sideQuests?.[0];
		if (sideQuest) {
			ctx.fillStyle = '#92a4be';
			ctx.fillText(`Side job: ${sideQuest.title} — ${sideQuest.objective.slice(0, 64)}`, panelX + 22, panelY + 132);
		}
		const minigame = stage.minigames?.[0];
		if (minigame) {
			ctx.fillStyle = '#cfeee4';
			ctx.fillText(`Minigame: ${minigame.title} (${minigame.kind})`, panelX + 22, panelY + 146);
		}
		const bossPhase = stage.boss?.phases?.[0];
		if (bossPhase) {
			ctx.fillStyle = '#ff5e7a';
			ctx.fillText(
				`Boss phase: ${stage.boss?.name} — ${bossPhase.label}: ${bossPhase.mechanic.slice(0, 48)}`,
				panelX + 22,
				panelY + 160
			);
		}

		ctx.fillStyle = '#8d94a7';
		ctx.fillText('Arrow keys: select • 1-3/Enter: commit branch • Space: commit selected', panelX + 22, panelY + 174);
		if (this.lastChoiceResult) {
			ctx.fillStyle = '#67f3c4';
			ctx.fillText(`Committed: ${this.lastChoiceResult}`, panelX + 420, panelY + 174);
		}
	}

}

import type { Scene, SceneContext } from '../engine/SceneManager';
import { type ChoiceOutcome, type GameFlow, createGameFlow } from '../game/GameFlow';
import { buildStageRunSceneOptions } from '../game/StageRunOptions';
import type { Renderer } from '../renderer/Renderer';
import type { StageRunSceneOptions } from './StageRunScene';

function formatSigned(value: number): string {
	return value > 0 ? `+${value}` : `${value}`;
}

export interface StoryFlowSceneOptions {
	onStartStage?: (options: StageRunSceneOptions) => void;
}

export interface BranchChoiceRecap {
	stageId: string;
	selectedPrompt: string;
	branch: string;
	resultFlag: string;
	consequence: string;
	dubFavorDelta: number;
	orbitHeatDelta: number;
}

export interface StageDebugDetail {
	stageId: string;
	stageName: string;
	payloadId: string;
	bossId: string;
	bossName: string;
	tutorialBeats: string[];
	modifiers: string[];
	branchOutcomes: string[];
	resultFlags: string[];
}

export class StoryFlowScene implements Scene {
	readonly name = 'StoryFlowScene';

	private selectedChoiceIndex = 0;
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private lastChoiceResult = '';
	private lastChoiceRecap: BranchChoiceRecap | null = null;
	private debugPanelVisible = false;
	private lastDebugDetail: StageDebugDetail | null = null;

	constructor(
		private readonly flow: GameFlow = createGameFlow(),
		private readonly options: StoryFlowSceneOptions = {}
	) {}

	getFlow(): GameFlow {
		return this.flow;
	}

	getLastChoiceRecap(): BranchChoiceRecap | null {
		return this.lastChoiceRecap ? { ...this.lastChoiceRecap } : null;
	}

	getLastDebugDetail(): StageDebugDetail | null {
		return this.lastDebugDetail
			? {
					...this.lastDebugDetail,
					tutorialBeats: [...this.lastDebugDetail.tutorialBeats],
					modifiers: [...this.lastDebugDetail.modifiers],
					branchOutcomes: [...this.lastDebugDetail.branchOutcomes],
					resultFlags: [...this.lastDebugDetail.resultFlags],
				}
			: null;
	}

	onEnter(_ctx: SceneContext): void {
		console.log('StoryFlowScene entered');
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
		if (state.mode === 'title-card') {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.flow.advanceTitleCard();
			}
			return;
		}
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
		if (event.key.toLowerCase() === 'd') {
			event.preventDefault();
			this.toggleStageDebugPanel();
			return;
		}
		if (event.key.toLowerCase() === 'r') {
			event.preventDefault();
			this.startCurrentStage();
			return;
		}
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

	private toggleStageDebugPanel(): void {
		this.debugPanelVisible = !this.debugPanelVisible;
		this.lastDebugDetail = this.debugPanelVisible ? this.buildStageDebugDetail() : null;
		if (this.lastDebugDetail) {
			window.dispatchEvent(new CustomEvent('badger:stage-debug-detail', { detail: this.lastDebugDetail }));
		}
	}

	private buildStageDebugDetail(): StageDebugDetail | null {
		const stage = this.flow.getCurrentStage();
		if (!stage) return null;
		return {
			stageId: stage.id,
			stageName: stage.name,
			payloadId: stage.heistPayloadId ?? 'none',
			bossId: stage.boss?.id ?? 'none',
			bossName: stage.boss?.name ?? 'none',
			tutorialBeats: stage.tutorialBeats?.map((beat) => beat.id) ?? [],
			modifiers: stage.stageModifiers?.map((modifier) => modifier.id) ?? [],
			branchOutcomes: stage.choiceOutcomes?.map((outcome) => outcome.resultFlag) ?? [],
			resultFlags: this.flow.getStoryProgress().resultFlags,
		};
	}

	private startCurrentStage(): void {
		this.options.onStartStage?.(buildStageRunSceneOptions(this.flow));
	}

	private chooseStageChoice(choiceIndex: number): void {
		const stage = this.flow.getCurrentStage();
		const outcome = stage?.choiceOutcomes?.[choiceIndex];
		const result = this.flow.chooseStageChoice(choiceIndex);
		if (!result.ok) {
			this.lastChoiceResult = result.reason;
			this.lastChoiceRecap = null;
			return;
		}
		if (stage && outcome) {
			this.lastChoiceResult = `${result.branch} / ${result.resultFlag}`;
			this.lastChoiceRecap = this.buildChoiceRecap(stage.id, outcome);
			window.dispatchEvent(new CustomEvent('badger:story-choice-recap', { detail: this.lastChoiceRecap }));
		}
	}

	private buildChoiceRecap(stageId: string, outcome: ChoiceOutcome): BranchChoiceRecap {
		return {
			stageId,
			selectedPrompt: outcome.prompt,
			branch: outcome.branch,
			resultFlag: outcome.resultFlag,
			consequence: outcome.consequence,
			dubFavorDelta: outcome.metaDelta?.dubFavor ?? 0,
			orbitHeatDelta: outcome.metaDelta?.orbitHeat ?? 0,
		};
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
			this.renderStageDebugPanel(ctx);
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
		const panelY = ctx.canvas.height - 260;
		const panelW = ctx.canvas.width - 108;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(panelX, panelY, panelW, 244);
		ctx.strokeStyle = '#ffb35e';
		ctx.strokeRect(panelX, panelY, panelW, 244);
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
		const branchConsequence = this.flow.getActiveBranchConsequences(stage.id)[0];
		if (branchConsequence) {
			ctx.fillStyle = '#67f3c4';
			ctx.fillText(
				`Branch effect: ${branchConsequence.label} — ${branchConsequence.uiHint.slice(0, 48)}`,
				panelX + 22,
				panelY + 174
			);
		}

		ctx.fillStyle = '#8d94a7';
		ctx.fillText('Arrow keys: select • 1-3/Enter: commit branch • D: debug • R: run stage', panelX + 22, panelY + 188);
		this.renderChoiceRecap(ctx, panelX + 22, panelY + 204, panelW - 44);
	}


	private renderStageDebugPanel(ctx: CanvasRenderingContext2D): void {
		if (!this.debugPanelVisible) return;
		const detail = this.lastDebugDetail ?? this.buildStageDebugDetail();
		if (!detail) return;
		const x = ctx.canvas.width - 378;
		const y = 104;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.88)';
		ctx.fillRect(x, y, 324, 184);
		ctx.strokeStyle = '#67f3c4';
		ctx.strokeRect(x, y, 324, 184);
		ctx.textAlign = 'left';
		ctx.font = '700 13px ui-monospace, monospace';
		ctx.fillStyle = '#67f3c4';
		ctx.fillText('Stage debug detail', x + 14, y + 22);
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		const lines = [
			`stage: ${detail.stageId}`,
			`payload: ${detail.payloadId}`,
			`boss: ${detail.bossId} (${detail.bossName})`,
			`tutorial: ${detail.tutorialBeats.join(', ') || 'none'}`,
			`modifiers: ${detail.modifiers.join(', ') || 'none'}`,
			`branches: ${detail.branchOutcomes.join(', ') || 'none'}`,
			`flags: ${detail.resultFlags.join(', ') || 'none'}`,
		];
		for (const [index, line] of lines.entries()) {
			ctx.fillText(line.slice(0, 45), x + 14, y + 44 + index * 18);
		}
	}

	private renderChoiceRecap(ctx: CanvasRenderingContext2D, x: number, y: number, maxWidth: number): void {
		const recap = this.lastChoiceRecap;
		if (!recap) {
			if (!this.lastChoiceResult) return;
			ctx.fillStyle = '#ff5e7a';
			ctx.fillText(`Choice failed: ${this.lastChoiceResult}`, x, y);
			return;
		}
		ctx.fillStyle = '#67f3c4';
		ctx.fillText(`Branch recap: ${recap.selectedPrompt.slice(0, 42)} -> ${recap.resultFlag}`, x, y);
		ctx.fillStyle = '#cfeee4';
		ctx.fillText(recap.consequence.slice(0, Math.max(24, Math.floor(maxWidth / 8))), x, y + 16);
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(`Heat ${formatSigned(recap.orbitHeatDelta)} / Favor ${formatSigned(recap.dubFavorDelta)}`, x, y + 32);
	}
}

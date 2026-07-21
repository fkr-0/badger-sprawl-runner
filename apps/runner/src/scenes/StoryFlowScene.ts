import { sampleSpriteAnimationFrame } from '@badger/sprite-contracts';
import type { Scene, SceneContext } from '../engine/SceneManager';
import { CAMPAIGN } from '../game/Campaign';
import { type ChoiceOutcome, type GameFlow, createGameFlow } from '../game/GameFlow';
import { getStoryChoiceFigureSheet } from '../game/LateStageSpriteBindings';
import { buildStageRunSceneOptions } from '../game/StageRunOptions';
import { getDialoguePortrait } from '../renderer/DialoguePortraitRenderer';
import type { Renderer } from '../renderer/Renderer';
import type { AutosaveFeedback, AutosaveReason } from '../storage/AutosaveFeedback';
import type { StageRunSceneOptions } from './StageRunScene';

function formatSigned(value: number): string {
	return value > 0 ? `+${value}` : `${value}`;
}

export interface StoryPresentationSnapshot {
	mode: ReturnType<GameFlow['getState']>['mode'];
	stageId: string | null;
	chapter: number | null;
	stageName: string | null;
	placard: string | null;
	speaker: string | null;
	lineIndex: number;
	lineCount: number;
	selectedChoiceIndex: number;
	selectedResultFlag: string | null;
	choiceCommitted: boolean;
}

export interface StoryPanelLayoutSnapshot {
	panelTop: number;
	panelBottom: number;
	choiceRows: Array<{ top: number; bottom: number }>;
	detailsTop: number;
	detailsBottom: number;
	controlsTop: number;
	controlsBottom: number;
	recapTop: number;
	recapBottom: number;
	recapRight: number;
	autosaveLeft: number;
}

export interface StoryFlowSceneOptions {
	onStartStage?: (options: StageRunSceneOptions) => void;
	onAutosave?: (reason: AutosaveReason) => AutosaveFeedback | undefined;
	onReturnToTitle?: () => void;
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
	private selectedStageId: string | null = null;
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private lastChoiceResult = '';
	private lastChoiceRecap: BranchChoiceRecap | null = null;
	private debugPanelVisible = false;
	private lastDebugDetail: StageDebugDetail | null = null;
	private lastAutosaveFeedback: AutosaveFeedback | null = null;
	private lastPanelLayout: StoryPanelLayoutSnapshot | null = null;
	private storyTime = 0;

	constructor(
		private readonly flow: GameFlow = createGameFlow(),
		private readonly options: StoryFlowSceneOptions = {}
	) {}

	getFlow(): GameFlow {
		return this.flow;
	}

	getPresentationSnapshot(): StoryPresentationSnapshot {
		const state = this.flow.getState();
		const stageId =
			state.mode === 'title-card' || state.mode === 'stage' || state.mode === 'debrief'
				? state.stageId
				: state.mode === 'dialogue'
					? state.dialogueId.replace(/-briefing$/, '')
					: null;
		const stage = stageId
			? CAMPAIGN.stages.find((candidate) => candidate.id === stageId)
			: undefined;
		const dialogue = state.mode === 'dialogue' ? this.flow.getCurrentDialogue() : undefined;
		const debrief = state.mode === 'debrief' ? this.flow.getCurrentDebrief() : undefined;
		const currentStage = state.mode === 'stage' ? this.flow.getCurrentStage() : undefined;
		const selectedOutcome = currentStage?.choiceOutcomes?.[this.selectedChoiceIndex];
		return {
			mode: state.mode,
			stageId,
			chapter: stage?.chapter ?? null,
			stageName: stage?.name ?? null,
			placard: stage?.placard ?? null,
			speaker: dialogue?.speaker ?? debrief?.speaker ?? null,
			lineIndex: state.mode === 'dialogue' || state.mode === 'debrief' ? state.lineIndex : 0,
			lineCount: dialogue?.lines.length ?? debrief?.lines.length ?? 0,
			selectedChoiceIndex: this.selectedChoiceIndex,
			selectedResultFlag: selectedOutcome?.resultFlag ?? null,
			choiceCommitted: Boolean(
				selectedOutcome && this.lastChoiceRecap?.resultFlag === selectedOutcome.resultFlag
			),
		};
	}

	getPanelLayoutSnapshot(): StoryPanelLayoutSnapshot | null {
		return this.lastPanelLayout
			? {
					...this.lastPanelLayout,
					choiceRows: this.lastPanelLayout.choiceRows.map((row) => ({ ...row })),
				}
			: null;
	}

	getLastChoiceRecap(): BranchChoiceRecap | null {
		return this.lastChoiceRecap ? { ...this.lastChoiceRecap } : null;
	}

	getLastAutosaveFeedback(): AutosaveFeedback | null {
		return this.lastAutosaveFeedback ? { ...this.lastAutosaveFeedback } : null;
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
		if (event.code === 'Escape') {
			event.preventDefault();
			this.options.onReturnToTitle?.();
			return;
		}
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
				const nextState = this.flow.getState();
				if (nextState.mode !== 'debrief') {
					this.options.onAutosave?.('stage-complete');
				}
				if (nextState.mode === 'menu' && this.flow.getStoryProgress().campaignComplete) {
					this.options.onReturnToTitle?.();
				}
			}
			return;
		}
		if (state.mode !== 'stage') return;
		const stage = this.flow.getCurrentStage();
		if (!stage) return;
		this.syncStageSelection(stage);
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
		const choices = stage.choiceOutcomes ?? [];
		if (choices.length === 0) return;
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			this.selectedChoiceIndex = (this.selectedChoiceIndex + choices.length - 1) % choices.length;
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			this.selectedChoiceIndex = (this.selectedChoiceIndex + 1) % choices.length;
		} else if (/^[1-9]$/.test(event.key)) {
			event.preventDefault();
			const index = Number(event.key) - 1;
			if (index < choices.length) {
				this.selectedChoiceIndex = index;
				const outcome = choices[index];
				if (this.lastChoiceRecap?.resultFlag !== outcome?.resultFlag) this.chooseStageChoice(index);
			}
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			const selectedOutcome = choices[this.selectedChoiceIndex];
			if (selectedOutcome && this.lastChoiceRecap?.resultFlag === selectedOutcome.resultFlag) {
				this.startCurrentStage();
			} else {
				this.chooseStageChoice(this.selectedChoiceIndex);
			}
		}
	}

	private syncStageSelection(stage: NonNullable<ReturnType<GameFlow['getCurrentStage']>>): void {
		if (this.selectedStageId === stage.id) return;
		this.selectedStageId = stage.id;
		this.selectedChoiceIndex = 0;
		this.lastChoiceResult = '';
		this.lastChoiceRecap = null;
		this.lastAutosaveFeedback = null;
		this.lastPanelLayout = null;

		const resultFlags = new Set(this.flow.getStoryProgress().resultFlags);
		const restoredIndex = stage.choiceOutcomes?.findIndex((outcome) =>
			resultFlags.has(outcome.resultFlag)
		);
		if (restoredIndex === undefined || restoredIndex < 0) return;
		const restoredOutcome = stage.choiceOutcomes?.[restoredIndex];
		if (!restoredOutcome) return;
		this.selectedChoiceIndex = restoredIndex;
		this.lastChoiceResult = `${restoredOutcome.branch} / ${restoredOutcome.resultFlag}`;
		this.lastChoiceRecap = this.buildChoiceRecap(stage.id, restoredOutcome);
	}

	private toggleStageDebugPanel(): void {
		this.debugPanelVisible = !this.debugPanelVisible;
		this.lastDebugDetail = this.debugPanelVisible ? this.buildStageDebugDetail() : null;
		if (this.lastDebugDetail) {
			window.dispatchEvent(
				new CustomEvent('badger:stage-debug-detail', { detail: this.lastDebugDetail })
			);
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
		const stage = this.flow.getCurrentStage();
		if (!stage) return;
		this.syncStageSelection(stage);
		this.options.onStartStage?.(buildStageRunSceneOptions(this.flow));
	}

	private chooseStageChoice(choiceIndex: number): boolean {
		const stage = this.flow.getCurrentStage();
		const outcome = stage?.choiceOutcomes?.[choiceIndex];
		const result = this.flow.chooseStageChoice(choiceIndex);
		if (!result.ok) {
			this.lastChoiceResult = result.reason;
			this.lastChoiceRecap = null;
			return false;
		}
		if (stage && outcome) {
			this.lastChoiceResult = `${result.branch} / ${result.resultFlag}`;
			this.lastChoiceRecap = this.buildChoiceRecap(stage.id, outcome);
			const autosaveFeedback = this.options.onAutosave?.('branch-choice');
			this.lastAutosaveFeedback = autosaveFeedback ? { ...autosaveFeedback } : null;
			window.dispatchEvent(
				new CustomEvent('badger:story-choice-recap', { detail: this.lastChoiceRecap })
			);
		}
		return true;
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

	update(dt: number): void {
		this.storyTime += Math.max(0, dt);
	}

	render(renderer: Renderer, _alpha: number): void {
		const maybeRenderer = renderer;
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;

		const state = this.flow.getState();
		renderer.clear();
		renderer.drawBackground();
		if (state.mode === 'title-card') {
			this.renderTitlePlacard(renderer, state.stageId, state.placard);
			return;
		}
		ctx.save();
		this.renderStoryRibbon(ctx);

		if (state.mode === 'dialogue') {
			const dialogue = this.flow.getCurrentDialogue();
			if (dialogue) {
				this.renderDialoguePanel(
					ctx,
					maybeRenderer,
					dialogue.speaker,
					dialogue.lines[state.lineIndex] ?? ''
				);
			}
		} else if (state.mode === 'debrief') {
			const debrief = this.flow.getCurrentDebrief();
			if (debrief) {
				this.renderDialoguePanel(
					ctx,
					maybeRenderer,
					debrief.speaker,
					debrief.lines[state.lineIndex] ?? ''
				);
			}
		} else if (state.mode === 'stage') {
			this.renderStageChoicePanel(ctx, renderer);
			this.renderStageDebugPanel(ctx);
		}

		ctx.restore();
	}

	private renderTitlePlacard(renderer: Renderer, stageId: string, placard: string): void {
		const stage = CAMPAIGN.stages.find((candidate) => candidate.id === stageId);
		const chapter = stage?.chapter ?? 1;
		const subtitle = stage
			? `${stage.place} // Chapter ${chapter} // ${stage.primaryVerb}`
			: `Chapter ${chapter}`;
		renderer.renderTitleCard(placard, subtitle, Math.max(0, chapter - 1) / CAMPAIGN.stages.length);
		const ctx = renderer.getContext();
		ctx.save();
		ctx.textAlign = 'center';
		ctx.fillStyle = '#67f3c4';
		ctx.font = '700 16px ui-monospace, monospace';
		ctx.fillText(stage?.name.toUpperCase() ?? stageId.toUpperCase(), ctx.canvas.width / 2, 98);
		ctx.fillStyle = '#92a4be';
		ctx.font = '11px ui-monospace, monospace';
		ctx.fillText(
			(stage?.machinery ?? []).slice(0, 3).join('  •  ').toUpperCase(),
			ctx.canvas.width / 2,
			ctx.canvas.height - 54
		);
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText('ENTER // REVEAL THE MACHINERY', ctx.canvas.width / 2, ctx.canvas.height - 30);
		ctx.restore();
	}

	private renderStoryRibbon(ctx: CanvasRenderingContext2D): void {
		const snapshot = this.getPresentationSnapshot();
		ctx.save();
		ctx.fillStyle = 'rgba(4, 6, 12, 0.84)';
		ctx.fillRect(24, 18, ctx.canvas.width - 48, 64);
		ctx.fillStyle = '#67f3c4';
		ctx.fillRect(24, 18, 5, 64);
		ctx.textAlign = 'left';
		ctx.font = '700 11px ui-monospace, monospace';
		ctx.fillStyle = '#92a4be';
		ctx.fillText(
			`STORY MODE // ${snapshot.mode.toUpperCase()} // CHAPTER ${snapshot.chapter ?? '-'}`,
			42,
			39
		);
		ctx.font = '900 18px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText((snapshot.stageName ?? 'BADGER SPRAWL RUNNER').toUpperCase(), 42, 64);
		ctx.textAlign = 'right';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(
			`${this.flow.getStoryProgress().completedStageIds.length}/${CAMPAIGN.stages.length} STAGES COMPLETE`,
			ctx.canvas.width - 42,
			50
		);
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
		this.renderDialogueFigure(ctx, renderer, speaker);

		renderer.renderDialoguePortrait(speaker, panelX + 18, panelY + 24, 72);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#67f3c4';
		ctx.font = '700 16px ui-monospace, monospace';
		ctx.fillText(speaker, panelX + 108, panelY + 36);
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '14px ui-monospace, monospace';
		const lines = this.wrapText(ctx, line, panelW - 152);
		for (const [index, text] of lines.slice(0, 3).entries()) {
			ctx.fillText(text, panelX + 108, panelY + 68 + index * 20);
		}
		ctx.fillStyle = '#92a4be';
		ctx.font = '10px ui-monospace, monospace';
		ctx.fillText('ENTER // CONTINUE', panelX + panelW - 150, panelY + 108);
	}

	private renderDialogueFigure(
		ctx: CanvasRenderingContext2D,
		renderer: Renderer,
		speaker: string
	): void {
		const portrait = getDialoguePortrait(speaker);
		const sprites = renderer.getSpriteRenderer();
		if (!portrait.sheetId || !sprites.hasSheet(portrait.sheetId)) return;
		const loadedSheet = sprites.getSheet(portrait.sheetId);
		const frame = loadedSheet?.sheet.animations[portrait.animation]
			? sampleSpriteAnimationFrame(loadedSheet.sheet, portrait.animation, this.storyTime, {
					mode: 'loop',
				})
			: 0;
		ctx.save();
		ctx.globalAlpha = 0.2;
		sprites.drawFrame(
			portrait.sheetId,
			portrait.animation,
			frame,
			ctx.canvas.width - 280,
			116,
			false,
			3.2,
			3.2
		);
		ctx.restore();
	}

	private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
		const words = text.split(/\s+/);
		const lines: string[] = [];
		let current = '';
		for (const word of words) {
			const candidate = current ? `${current} ${word}` : word;
			if (current && ctx.measureText(candidate).width > maxWidth) {
				lines.push(current);
				current = word;
			} else {
				current = candidate;
			}
		}
		if (current) lines.push(current);
		return lines;
	}

	private renderStageChoicePanel(ctx: CanvasRenderingContext2D, renderer: Renderer): void {
		const stage = this.flow.getCurrentStage();
		if (!stage?.choiceOutcomes?.length) return;
		this.syncStageSelection(stage);
		const panelX = 54;
		const panelH = Math.min(380, Math.max(330, ctx.canvas.height - 112));
		const panelY = ctx.canvas.height - panelH - 16;
		const panelW = ctx.canvas.width - 108;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(panelX, panelY, panelW, panelH);
		ctx.strokeStyle = '#ffb35e';
		ctx.strokeRect(panelX, panelY, panelW, panelH);
		const choiceFigureSheet = getStoryChoiceFigureSheet(stage.id);
		const sprites = renderer.getSpriteRenderer();
		if (choiceFigureSheet && sprites.hasSheet(choiceFigureSheet)) {
			const loadedSheet = sprites.getSheet(choiceFigureSheet);
			const frame = loadedSheet?.sheet.animations.idle
				? sampleSpriteAnimationFrame(loadedSheet.sheet, 'idle', this.storyTime, { mode: 'loop' })
				: 0;
			ctx.save();
			ctx.globalAlpha = 0.18;
			sprites.drawFrame(
				choiceFigureSheet,
				'idle',
				frame,
				panelX + panelW - 160,
				panelY + 46,
				false,
				2.4,
				2.4
			);
			ctx.restore();
		}
		ctx.textAlign = 'left';
		ctx.fillStyle = '#ffb35e';
		ctx.font = '700 15px ui-monospace, monospace';
		ctx.fillText(this.fitText(ctx, stage.dramaticQuestion, panelW - 44), panelX + 22, panelY + 30);
		ctx.font = '14px ui-monospace, monospace';
		const choiceRows: Array<{ top: number; bottom: number }> = [];
		for (const [index, outcome] of stage.choiceOutcomes.entries()) {
			const rowTop = panelY + 46 + index * 54;
			const y = rowTop + 17;
			const selected = index === this.selectedChoiceIndex;
			ctx.fillStyle = selected ? '#67f3c4' : '#eaf2ff';
			ctx.fillText(
				this.fitText(ctx, `${selected ? '>' : ' '} ${index + 1}. ${outcome.prompt}`, panelW - 56),
				panelX + 28,
				y
			);
			ctx.fillStyle = selected ? '#cfeee4' : '#8d94a7';
			ctx.font = '12px ui-monospace, monospace';
			ctx.fillText(this.fitText(ctx, outcome.consequence, panelW - 90), panelX + 62, y + 19);
			ctx.font = '14px ui-monospace, monospace';
			choiceRows.push({ top: rowTop, bottom: rowTop + 46 });
		}

		const detailsTop = panelY + 214;
		let detailY = detailsTop + 14;
		const sideQuest = stage.sideQuests?.[0];
		if (sideQuest) {
			ctx.fillStyle = '#92a4be';
			ctx.fillText(
				this.fitText(ctx, `Side job: ${sideQuest.title} — ${sideQuest.objective}`, panelW - 44),
				panelX + 22,
				detailY
			);
			detailY += 17;
		}
		const minigame = stage.minigames?.[0];
		if (minigame) {
			ctx.fillStyle = '#cfeee4';
			ctx.fillText(
				this.fitText(ctx, `Minigame: ${minigame.title} (${minigame.kind})`, panelW - 44),
				panelX + 22,
				detailY
			);
			detailY += 17;
		}
		const bossPhase = stage.boss?.phases?.[0];
		if (bossPhase) {
			ctx.fillStyle = '#ff5e7a';
			ctx.fillText(
				this.fitText(
					ctx,
					`Boss phase: ${stage.boss?.name} — ${bossPhase.label}: ${bossPhase.mechanic}`,
					panelW - 44
				),
				panelX + 22,
				detailY
			);
			detailY += 17;
		}
		const branchConsequence = this.flow.getActiveBranchConsequences(stage.id)[0];
		if (branchConsequence) {
			ctx.fillStyle = '#67f3c4';
			ctx.fillText(
				this.fitText(
					ctx,
					`Branch effect: ${branchConsequence.label} — ${branchConsequence.uiHint}`,
					panelW - 44
				),
				panelX + 22,
				detailY
			);
		}

		const selectedOutcome = stage.choiceOutcomes[this.selectedChoiceIndex];
		const selectionCommitted =
			selectedOutcome && this.lastChoiceRecap?.resultFlag === selectedOutcome.resultFlag;
		const controlsTop = panelY + 286;
		ctx.fillStyle = '#8d94a7';
		ctx.fillText(
			selectionCommitted
				? 'Enter/R: run selected branch • Arrow keys: inspect • 1-3: replace branch • D: debug'
				: 'Arrow keys: select • 1-3/Enter: commit branch • R: run stage • D: debug',
			panelX + 22,
			controlsTop + 14
		);
		const recapTop = panelY + 312;
		const autosaveLeft = panelX + panelW - 272;
		const recapRight = autosaveLeft - 16;
		this.renderChoiceRecap(ctx, panelX + 22, recapTop + 14, recapRight - (panelX + 22));
		this.renderAutosaveFeedback(ctx, autosaveLeft, recapTop + 14);
		this.lastPanelLayout = {
			panelTop: panelY,
			panelBottom: panelY + panelH,
			choiceRows,
			detailsTop,
			detailsBottom: controlsTop - 6,
			controlsTop,
			controlsBottom: recapTop - 4,
			recapTop,
			recapBottom: panelY + panelH - 8,
			recapRight,
			autosaveLeft,
		};
	}

	private fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
		if (ctx.measureText(text).width <= maxWidth) return text;
		const ellipsis = '…';
		let low = 0;
		let high = text.length;
		while (low < high) {
			const middle = Math.ceil((low + high) / 2);
			if (ctx.measureText(`${text.slice(0, middle)}${ellipsis}`).width <= maxWidth) low = middle;
			else high = middle - 1;
		}
		return `${text.slice(0, low).trimEnd()}${ellipsis}`;
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

	private renderAutosaveFeedback(ctx: CanvasRenderingContext2D, x: number, y: number): void {
		const feedback = this.lastAutosaveFeedback;
		if (!feedback) return;
		ctx.fillStyle = '#67f3c4';
		ctx.font = '700 11px ui-monospace, monospace';
		ctx.fillText(`✓ ${feedback.label}`, x, y);
	}

	private renderChoiceRecap(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		maxWidth: number
	): void {
		const recap = this.lastChoiceRecap;
		if (!recap) {
			if (!this.lastChoiceResult) return;
			ctx.fillStyle = '#ff5e7a';
			ctx.fillText(`Choice failed: ${this.lastChoiceResult}`, x, y);
			return;
		}
		ctx.fillStyle = '#67f3c4';
		ctx.fillText(
			this.fitText(ctx, `Branch recap: ${recap.selectedPrompt} -> ${recap.resultFlag}`, maxWidth),
			x,
			y
		);
		ctx.fillStyle = '#cfeee4';
		ctx.fillText(this.fitText(ctx, recap.consequence, maxWidth), x, y + 16);
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(
			`Heat ${formatSigned(recap.orbitHeatDelta)} / Favor ${formatSigned(recap.dubFavorDelta)}`,
			x,
			y + 32
		);
	}
}

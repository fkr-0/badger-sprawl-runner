import type { Scene, SceneContext } from '../engine/SceneManager';
import {
	buildLowerSprawlBuildComparison,
	type LowerSprawlBuildComparisonSnapshot,
} from '../game/LowerSprawlBuildComparison';
import type { Renderer } from '../renderer/Renderer';
import type { BuildTelemetrySnapshot } from '../systems/BuildComparisonTelemetrySystem';

export interface LowerSprawlBuildComparisonSceneOptions {
	observedRuns?: readonly BuildTelemetrySnapshot[];
	onReturnToTitle?: () => void;
	onLaunchTraining?: (build: LowerSprawlBuildComparisonSnapshot['cards'][number]) => void;
}

export class LowerSprawlBuildComparisonScene implements Scene {
	readonly name = 'LowerSprawlBuildComparisonScene';

	private selectedIndex = 0;
	private detailPage: 'routes' | 'evidence' = 'routes';
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private readonly comparison: LowerSprawlBuildComparisonSnapshot;

	constructor(private readonly options: LowerSprawlBuildComparisonSceneOptions = {}) {
		this.comparison = buildLowerSprawlBuildComparison(options.observedRuns ?? []);
	}

	launchSelectedTraining(): boolean {
		const selected = this.comparison.cards[this.selectedIndex];
		if (!selected) return false;
		this.options.onLaunchTraining?.({
			...selected,
			loadoutItemIds: [...selected.loadoutItemIds],
			skillRanks: { ...selected.skillRanks },
			approaches: [...selected.approaches],
			preferredPlanIds: [...selected.preferredPlanIds],
			preferredPlans: selected.preferredPlans.map((plan) => ({ ...plan })),
			evidenceLines: [...selected.evidenceLines],
		});
		return true;
	}

	onEnter(_context: SceneContext): void {
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.code === 'Escape') {
				this.options.onReturnToTitle?.();
				event.preventDefault();
				return;
			}
			if (event.code === 'KeyT') {
				this.launchSelectedTraining();
				event.preventDefault();
				return;
			}
			if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
				this.moveSelection(-1);
				event.preventDefault();
			}
			if (event.code === 'ArrowRight' || event.code === 'KeyD') {
				this.moveSelection(1);
				event.preventDefault();
			}
			if (
				event.code === 'ArrowUp' ||
				event.code === 'ArrowDown' ||
				event.code === 'Tab' ||
				event.code === 'Enter' ||
				event.code === 'Space'
			) {
				this.toggleDetailPage();
				event.preventDefault();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
	}

	onExit(): void {
		if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
		this.keyHandler = null;
	}

	update(_dt: number): void {}

	moveSelection(delta: number): void {
		const count = this.comparison.cards.length;
		if (count === 0) return;
		this.selectedIndex = (this.selectedIndex + delta + count) % count;
	}

	toggleDetailPage(): void {
		this.detailPage = this.detailPage === 'routes' ? 'evidence' : 'routes';
	}

	getSnapshot(): LowerSprawlBuildComparisonSnapshot & {
		selectedIndex: number;
		selectedBuildId: string;
		detailPage: 'routes' | 'evidence';
	} {
		return {
			...this.comparison,
			cards: this.comparison.cards.map((card) => ({
				...card,
				loadoutItemIds: [...card.loadoutItemIds],
				skillRanks: { ...card.skillRanks },
				approaches: [...card.approaches],
				preferredPlanIds: [...card.preferredPlanIds],
				preferredPlans: card.preferredPlans.map((plan) => ({ ...plan })),
				evidenceLines: [...card.evidenceLines],
			})),
			observedComparisons: this.comparison.observedComparisons.map((entry) => ({
				...entry,
				deltas: { ...entry.deltas },
				interpretation: [...entry.interpretation],
			})),
			legend: [...this.comparison.legend],
			selectedIndex: this.selectedIndex,
			selectedBuildId: this.comparison.cards[this.selectedIndex]?.id ?? '',
			detailPage: this.detailPage,
		};
	}

	render(renderer: Renderer, _alpha: number): void {
		const ctx = renderer.getContext();
		const selected = this.comparison.cards[this.selectedIndex];
		ctx.save();
		ctx.fillStyle = '#070b14';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		drawGrid(ctx);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '900 23px ui-monospace, monospace';
		ctx.fillText('LOWER SPRAWL // BUILD LAB', 28, 34);
		ctx.fillStyle = '#92a4be';
		ctx.font = '10px ui-monospace, monospace';
		ctx.fillText(this.comparison.subtitle.toUpperCase(), 28, 54);
		ctx.textAlign = 'right';
		ctx.fillStyle = '#67f3c4';
		ctx.font = '800 10px ui-monospace, monospace';
		ctx.fillText('← → SELECT // TAB LENS // T TRAIN // ESC BACK', ctx.canvas.width - 28, 34);

		const gap = 12;
		const cardWidth = (ctx.canvas.width - 56 - gap * 2) / 3;
		for (const [index, card] of this.comparison.cards.entries()) {
			const x = 28 + index * (cardWidth + gap);
			drawBuildCard(ctx, x, 76, cardWidth, 176, card, index === this.selectedIndex);
		}

		if (selected) this.renderDetail(ctx, selected, 28, 270, ctx.canvas.width - 56, 222);
		ctx.fillStyle = '#92a4be';
		ctx.font = '9px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText(
			this.comparison.legend[0] ?? '',
			28,
			ctx.canvas.height - 19
		);
		ctx.restore();
	}

	private renderDetail(
		ctx: CanvasRenderingContext2D,
		card: LowerSprawlBuildComparisonSnapshot['cards'][number],
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		ctx.fillStyle = 'rgba(4, 7, 14, 0.92)';
		ctx.fillRect(x, y, width, height);
		ctx.strokeStyle = this.detailPage === 'routes' ? '#67f3c4' : '#ffb35e';
		ctx.lineWidth = 2;
		ctx.strokeRect(x, y, width, height);
		ctx.textAlign = 'left';
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '900 14px ui-monospace, monospace';
		ctx.fillText(
			`${card.mark} ${card.label.toUpperCase()} // ${this.detailPage.toUpperCase()}`,
			x + 16,
			y + 25
		);
		ctx.fillStyle = '#92a4be';
		ctx.font = '10px ui-monospace, monospace';
		ctx.fillText(card.tagline, x + 16, y + 43);

		if (this.detailPage === 'routes') {
			let lineY = y + 70;
			for (const [index, plan] of card.preferredPlans.entries()) {
				ctx.fillStyle = index === 0 ? '#67f3c4' : '#8aa8ff';
				ctx.font = '800 10px ui-monospace, monospace';
				ctx.fillText(
					`${index === 0 ? 'A' : 'B'} // ${plan.label.toUpperCase()} // ${plan.risk.toUpperCase()}`,
					x + 16,
					lineY
				);
				ctx.fillStyle = '#c1cad8';
				ctx.font = '9px ui-monospace, monospace';
				lineY = drawWrapped(ctx, plan.playerCue, x + 16, lineY + 14, width * 0.52 - 24, 12);
				lineY = drawWrapped(
					ctx,
					`WORLD // ${plan.worldConsequenceHint}`,
					x + 16,
					lineY + 3,
					width * 0.52 - 24,
					12
				);
				lineY += 10;
			}
			drawLabelBlock(ctx, x + width * 0.55, y + 66, width * 0.42, 'PRESSURE', card.pressureProfile);
			drawLabelBlock(ctx, x + width * 0.55, y + 128, width * 0.42, 'PUBLIC CONSEQUENCE', card.civicConsequence);
		} else {
			ctx.fillStyle = card.evidenceKind === 'observed-run' ? '#67f3c4' : '#ffb35e';
			ctx.font = '800 10px ui-monospace, monospace';
			ctx.fillText(card.evidenceKind.replace('-', ' ').toUpperCase(), x + 16, y + 69);
			let lineY = y + 88;
			for (const line of card.evidenceLines) {
				ctx.fillStyle = '#c1cad8';
				ctx.font = '9px ui-monospace, monospace';
				lineY = drawWrapped(ctx, line, x + 16, lineY, width * 0.6, 13) + 8;
			}
			drawLabelBlock(ctx, x + width * 0.64, y + 66, width * 0.33, 'FAILURE MODE', card.failureMode);
			drawLabelBlock(ctx, x + width * 0.64, y + 138, width * 0.33, 'PRACTICE NEXT', card.practiceCue);
		}
	}
}

function drawBuildCard(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	card: LowerSprawlBuildComparisonSnapshot['cards'][number],
	selected: boolean
): void {
	ctx.fillStyle = selected ? 'rgba(103, 243, 196, 0.1)' : 'rgba(5, 9, 18, 0.88)';
	ctx.fillRect(x, y, width, height);
	ctx.strokeStyle = selected ? '#67f3c4' : '#293348';
	ctx.lineWidth = selected ? 3 : 1;
	ctx.strokeRect(x, y, width, height);
	ctx.textAlign = 'left';
	ctx.fillStyle = selected ? '#67f3c4' : '#eaf2ff';
	ctx.font = '900 13px ui-monospace, monospace';
	ctx.fillText(`${card.mark} ${card.label.toUpperCase()}`, x + 12, y + 22);
	ctx.fillStyle = '#92a4be';
	ctx.font = '9px ui-monospace, monospace';
	drawWrapped(ctx, card.tagline, x + 12, y + 42, width - 24, 12);
	ctx.fillStyle = '#ffb35e';
	ctx.font = '800 9px ui-monospace, monospace';
	ctx.fillText(`LOADOUT // ${card.loadoutItemIds.join(' · ').toUpperCase()}`, x + 12, y + 84);
	ctx.fillStyle = '#8aa8ff';
	ctx.fillText(`SKILLS // ${formatRanks(card.skillRanks)}`, x + 12, y + 104);
	ctx.fillStyle = '#c1cad8';
	ctx.fillText(`APPROACH // ${card.approaches.join(' + ').toUpperCase()}`, x + 12, y + 124);
	ctx.fillStyle = card.evidenceKind === 'observed-run' ? '#67f3c4' : '#ffb35e';
	ctx.fillText(card.evidenceKind.replace('-', ' ').toUpperCase(), x + 12, y + 151);
	ctx.fillStyle = '#eaf2ff';
	ctx.fillText(selected ? '▶ INSPECTING' : '  SELECT', x + 12, y + 168);
}

function drawLabelBlock(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	label: string,
	text: string
): void {
	ctx.fillStyle = '#ffb35e';
	ctx.font = '800 9px ui-monospace, monospace';
	ctx.fillText(label, x, y);
	ctx.fillStyle = '#c1cad8';
	ctx.font = '9px ui-monospace, monospace';
	drawWrapped(ctx, text, x, y + 14, width, 12);
}

function drawWrapped(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number
): number {
	const words = text.split(/\s+/);
	let line = '';
	let lineY = y;
	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word;
		if (line && ctx.measureText(candidate).width > maxWidth) {
			ctx.fillText(line, x, lineY);
			line = word;
			lineY += lineHeight;
		} else {
			line = candidate;
		}
	}
	if (line) ctx.fillText(line, x, lineY);
	return lineY;
}

function formatRanks(ranks: Readonly<Record<string, number>>): string {
	return Object.entries(ranks)
		.map(([track, rank]) => `${track.toUpperCase()} ${rank}`)
		.join(' · ');
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
	ctx.save();
	ctx.strokeStyle = 'rgba(103, 243, 196, 0.045)';
	ctx.lineWidth = 1;
	for (let x = 0; x < ctx.canvas.width; x += 24) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, ctx.canvas.height);
		ctx.stroke();
	}
	for (let y = 0; y < ctx.canvas.height; y += 24) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(ctx.canvas.width, y);
		ctx.stroke();
	}
	ctx.restore();
}

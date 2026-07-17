/**
 * TitleScene - main menu scene
 */

import type { Scene } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';
import type { SceneContext } from '../engine/SceneManager';
import { buildEndingCard, type EndingCard } from '../game/EndingCards';
import type { MenuOption, MenuOptionId, StoryProgress } from '../game/GameFlow';
import { MODE_OPTIONS } from '../game/ModeMenu';
import {
	buildStoryProgressSummary,
	formatStoryProgressSummary,
	type StoryProgressSummary,
} from '../game/StoryProgressSummary';
import {
	ARCADE_UI_FONT,
	BADGER_UI,
	drawArcadeBackdrop,
	drawArcadeFooter,
	drawArcadeMenuRow,
	drawArcadePanel,
} from '../ui/ArcadeUi';

export type MenuCommand = 'up' | 'down' | 'confirm' | 'cancel';

export interface TitleSceneOptions {
	onSelectMode?: (modeId: MenuOptionId) => void;
	onCancel?: () => void;
	storyProgress?: StoryProgress;
}

export class TitleScene implements Scene {
	readonly name = 'TitleScene';

	private keyHandler: ((e: KeyboardEvent) => void) | null = null;
	private selectedOption = 0;
	private readonly menuOptions = MODE_OPTIONS;

	constructor(private readonly options: TitleSceneOptions = {}) {}

	static getMenuOptions(): MenuOption[] {
		return MODE_OPTIONS.map((option) => ({ ...option }));
	}

	private getDefaultOption(): MenuOption {
		return MODE_OPTIONS[0] ?? { id: 'story', label: 'Story Run', description: 'Start story mode.' };
	}

	private getCurrentOption(): MenuOption {
		return this.menuOptions[this.selectedOption] ?? this.getDefaultOption();
	}

	getSelectedOption(): MenuOption {
		return { ...this.getCurrentOption() };
	}

	moveSelection(delta: number): void {
		this.selectedOption =
			(this.selectedOption + delta + this.menuOptions.length) % this.menuOptions.length;
	}

	confirmSelection(): void {
		this.options.onSelectMode?.(this.getCurrentOption().id);
	}

	handleMenuCommand(command: MenuCommand): void {
		switch (command) {
			case 'up':
				this.moveSelection(-1);
				break;
			case 'down':
				this.moveSelection(1);
				break;
			case 'confirm':
				this.confirmSelection();
				break;
			case 'cancel':
				this.options.onCancel?.();
				break;
		}
	}

	onEnter(_ctx: SceneContext): void {
		console.log('TitleScene entered');
		window.dispatchEvent(new CustomEvent('badger:title-progress-summary', { detail: this.getStoryProgressSummary() }));
		const endingCard = this.getEndingCard();
		if (endingCard) window.dispatchEvent(new CustomEvent('badger:ending-card', { detail: endingCard }));
		const handleKeyDown = (e: KeyboardEvent): void => {
			switch (e.code) {
				case 'ArrowUp':
					this.moveSelection(-1);
					break;
				case 'ArrowDown':
					this.moveSelection(1);
					break;
				case 'Enter':
				case 'Space':
					this.confirmSelection();
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
	}

	onExit(): void {
		if (this.keyHandler) {
			window.removeEventListener('keydown', this.keyHandler);
			this.keyHandler = null;
		}
		console.log('TitleScene exited');
	}

	update(_dt: number): void {
		// Title screen animation
	}

	render(renderer: Renderer, _alpha: number): void {
		const maybeRenderer = renderer as {
			getContext?: () => CanvasRenderingContext2D;
			drawBackground?: () => void;
		};
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;

		maybeRenderer.drawBackground?.();
		this.renderTitle(ctx);
	}

	getStoryProgressSummary(): StoryProgressSummary | null {
		return this.options.storyProgress ? buildStoryProgressSummary(this.options.storyProgress) : null;
	}

	getEndingCard(): EndingCard | null {
		return this.options.storyProgress ? buildEndingCard(this.options.storyProgress) : null;
	}


	private renderEndingCard(ctx: CanvasRenderingContext2D, W: number, H: number): void {
		const card = this.getEndingCard();
		if (!card) return;
		const width = Math.min(380, W * 0.34);
		const x = 20;
		const y = H - 168;
		drawArcadePanel(ctx, {
			x,
			y,
			width,
			height: 116,
			accent: BADGER_UI.accent,
			strong: true,
			label: 'Last transmission',
		});
		ctx.textAlign = 'left';
		ctx.font = `700 14px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = BADGER_UI.accent;
		ctx.fillText(card.title, x + 18, y + 42);
		ctx.font = `12px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = BADGER_UI.text;
		ctx.fillText(card.subtitle.slice(0, 45), x + 18, y + 62);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.fillText(card.body.slice(0, 49), x + 18, y + 82);
		ctx.fillStyle = BADGER_UI.warning;
		ctx.fillText(card.closingLine.slice(0, 49), x + 18, y + 102);
	}

	private renderStoryProgress(ctx: CanvasRenderingContext2D, W: number, _H: number): void {
		const summary = this.getStoryProgressSummary();
		if (!summary) return;
		const lines = formatStoryProgressSummary(summary);
		const width = Math.min(330, W * 0.34);
		const x = W - width - 20;
		const y = 20;
		const accent = summary.campaignComplete ? BADGER_UI.accent : BADGER_UI.warning;
		drawArcadePanel(ctx, {
			x,
			y,
			width,
			height: 112,
			accent,
			label: 'Campaign signal',
		});
		ctx.textAlign = 'left';
		ctx.font = `700 13px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = accent;
		ctx.fillText(lines[0] ?? 'New Story', x + 18, y + 42);
		ctx.font = `11px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = BADGER_UI.text;
		ctx.fillText((lines[1] ?? '').slice(0, 42), x + 18, y + 61);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.fillText((lines[2] ?? '').slice(0, 42), x + 18, y + 78);
		ctx.fillText((lines[3] ?? '').slice(0, 42), x + 18, y + 94);
	}

	private renderTitle(ctx: CanvasRenderingContext2D): void {
		const W = ctx.canvas.width;
		const H = ctx.canvas.height;
		drawArcadeBackdrop(ctx);

		ctx.fillStyle = BADGER_UI.muted;
		ctx.font = `700 11px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText('SPRAWL SIGNAL // MOSS-01', W / 2, Math.max(54, H * 0.11));

		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `900 46px ${ARCADE_UI_FONT}`;
		ctx.fillText('BADGER SPRAWL RUNNER', W / 2, Math.max(104, H * 0.2));
		ctx.fillStyle = BADGER_UI.accent;
		ctx.fillRect(W / 2 - 92, Math.max(116, H * 0.22), 184, 3);
		ctx.font = `700 14px ${ARCADE_UI_FONT}`;
		ctx.fillText('A CYBER-PLATFORMER ADVENTURE', W / 2, Math.max(144, H * 0.27));

		this.renderStoryProgress(ctx, W, H);
		this.renderEndingCard(ctx, W, H);

		const menuWidth = Math.min(540, W - 80);
		const menuX = W / 2 - menuWidth / 2;
		const menuY = Math.max(180, H * 0.36);
		const menuHeight = this.menuOptions.length * 40 + 82;
		drawArcadePanel(ctx, {
			x: menuX,
			y: menuY,
			width: menuWidth,
			height: menuHeight,
			strong: true,
			label: 'Select route',
		});

		for (let i = 0; i < this.menuOptions.length; i++) {
			const option = this.menuOptions[i];
			if (!option) continue;
			const isSelected = i === this.selectedOption;
			drawArcadeMenuRow(ctx, option.label, menuX + 16, menuY + 30 + i * 40, menuWidth - 32, isSelected);
		}

		const selected = this.getCurrentOption();
		ctx.textAlign = 'left';
		ctx.font = `11px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = BADGER_UI.muted;
		ctx.fillText(
			selected.description.slice(0, 72).toUpperCase(),
			menuX + 20,
			menuY + menuHeight - 18
		);
		drawArcadeFooter(ctx, '↑ ↓ navigate  //  Enter deploy');
	}
}

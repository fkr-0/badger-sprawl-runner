/**
 * TitleScene - main menu scene
 */

import { createGridFocusNavigator } from '../../../../vendor/arcade-runtime.mjs';
import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import { type EndingCard, buildEndingCard } from '../game/EndingCards';
import type { MenuOption, MenuOptionId, StoryProgress } from '../game/GameFlow';
import { MODE_OPTIONS } from '../game/ModeMenu';
import {
	type StoryProgressSummary,
	buildStoryProgressSummary,
	formatStoryProgressSummary,
} from '../game/StoryProgressSummary';
import type { Renderer } from '../renderer/Renderer';
import {
	ARCADE_UI_FONT,
	BADGER_UI,
	drawArcadeBackdrop,
	drawArcadeCommandBar,
	drawArcadeMenuRow,
	drawArcadePanel,
	drawArcadeScreenTitle,
	drawArcadeTextBlock,
	fitArcadeText,
} from '../ui/ArcadeUi';
import type { ArcadeCommandAction } from '../ui/ArcadeUi';

export type MenuCommand = 'up' | 'down' | 'confirm' | 'cancel';

export interface TitleSceneOptions {
	onSelectMode?: (modeId: MenuOptionId) => void;
	onCancel?: () => void;
	storyProgress?: StoryProgress;
}

export class TitleScene implements Scene {
	readonly name = 'TitleScene';

	private keyHandler: ((e: KeyboardEvent) => void) | null = null;
	private readonly menuOptions = MODE_OPTIONS;
	private readonly navigation = createGridFocusNavigator({
		columns: 1,
		wrapY: true,
		items: MODE_OPTIONS.map((option) => ({ id: option.id })),
	});

	constructor(private readonly options: TitleSceneOptions = {}) {}

	static getMenuOptions(): MenuOption[] {
		return MODE_OPTIONS.map((option) => ({ ...option }));
	}

	private getDefaultOption(): MenuOption {
		return MODE_OPTIONS[0] ?? { id: 'story', label: 'Story Run', description: 'Start story mode.' };
	}

	private getCurrentOption(): MenuOption {
		const focusedId = this.navigation.current()?.id;
		return this.menuOptions.find((option) => option.id === focusedId) ?? this.getDefaultOption();
	}

	getSelectedOption(): MenuOption {
		return { ...this.getCurrentOption() };
	}

	moveSelection(delta: number): void {
		const direction = delta < 0 ? 'up' : 'down';
		this.navigation.moveBy(direction, Math.abs(delta));
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
		window.dispatchEvent(
			new CustomEvent('badger:title-progress-summary', { detail: this.getStoryProgressSummary() })
		);
		const endingCard = this.getEndingCard();
		if (endingCard)
			window.dispatchEvent(new CustomEvent('badger:ending-card', { detail: endingCard }));
		const handleKeyDown = (e: KeyboardEvent): void => {
			switch (e.code) {
				case 'ArrowUp':
					this.handleMenuCommand('up');
					e.preventDefault();
					break;
				case 'ArrowDown':
					this.handleMenuCommand('down');
					e.preventDefault();
					break;
				case 'Enter':
				case 'Space':
					this.handleMenuCommand('confirm');
					e.preventDefault();
					break;
				case 'Escape':
					this.handleMenuCommand('cancel');
					e.preventDefault();
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
		return this.options.storyProgress
			? buildStoryProgressSummary(this.options.storyProgress)
			: null;
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
		ctx.fillText(fitArcadeText(ctx, card.subtitle, width - 36), x + 18, y + 62);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.fillText(fitArcadeText(ctx, card.body, width - 36), x + 18, y + 82);
		ctx.fillStyle = BADGER_UI.warning;
		ctx.fillText(fitArcadeText(ctx, card.closingLine, width - 36), x + 18, y + 102);
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
		ctx.fillText(fitArcadeText(ctx, lines[1] ?? '', width - 36), x + 18, y + 61);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.fillText(fitArcadeText(ctx, lines[2] ?? '', width - 36), x + 18, y + 78);
		ctx.fillText(fitArcadeText(ctx, lines[3] ?? '', width - 36), x + 18, y + 94);
	}

	private renderTitle(ctx: CanvasRenderingContext2D): void {
		const W = ctx.canvas.width;
		const H = ctx.canvas.height;
		drawArcadeBackdrop(ctx);

		drawArcadeScreenTitle(ctx, {
			eyebrow: 'Sprawl signal // Moss-01',
			title: 'Badger Sprawl Runner',
			subtitle: 'A cyber-platformer adventure',
			y: Math.max(66, H * 0.12),
			titleSize: 46,
			accent: BADGER_UI.text,
		});

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
			const isSelected = i === this.navigation.index();
			drawArcadeMenuRow(
				ctx,
				option.label,
				menuX + 16,
				menuY + 30 + i * 40,
				menuWidth - 32,
				isSelected
			);
		}

		const selected = this.getCurrentOption();
		drawArcadeTextBlock(ctx, {
			x: menuX + 20,
			y: menuY + menuHeight - 28,
			width: menuWidth - 40,
			text: selected.description.toUpperCase(),
			font: `11px ${ARCADE_UI_FONT}`,
			lineHeight: 13,
			maxLines: 2,
			color: BADGER_UI.muted,
		});
		drawArcadeCommandBar(ctx, TITLE_COMMANDS);
	}
}

const TITLE_COMMANDS: readonly ArcadeCommandAction[] = [
	{
		id: 'navigate',
		label: 'choose route',
		inputs: { keyboard: '↑ / ↓', gamepad: 'D-Pad' },
		priority: 10,
	},
	{ id: 'confirm', label: 'deploy', inputs: { keyboard: 'Enter', gamepad: 'A' }, priority: 9 },
	{ id: 'cancel', label: 'return', inputs: { keyboard: 'Esc', gamepad: 'B' } },
];

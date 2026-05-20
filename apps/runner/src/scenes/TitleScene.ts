/**
 * TitleScene - main menu scene
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import type { MenuOption, MenuOptionId, StoryProgress } from '../game/GameFlow';
import { MODE_OPTIONS } from '../game/ModeMenu';
import {
	buildStoryProgressSummary,
	formatStoryProgressSummary,
	type StoryProgressSummary,
} from '../game/StoryProgressSummary';

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

	render(renderer: unknown, _alpha: number): void {
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

	private renderStoryProgress(ctx: CanvasRenderingContext2D, W: number, H: number): void {
		const summary = this.getStoryProgressSummary();
		if (!summary) return;
		const lines = formatStoryProgressSummary(summary);
		const panelY = H / 2 - 18;
		ctx.fillStyle = 'rgba(4, 6, 12, 0.74)';
		ctx.fillRect(W / 2 - 252, panelY - 24, 504, 92);
		ctx.strokeStyle = summary.campaignComplete ? '#67f3c4' : '#ffb35e';
		ctx.strokeRect(W / 2 - 252, panelY - 24, 504, 92);
		ctx.font = '700 14px ui-monospace, monospace';
		ctx.fillStyle = '#ffb35e';
		ctx.fillText(lines[0] ?? 'New Story', W / 2, panelY);
		ctx.font = '12px ui-monospace, monospace';
		ctx.fillStyle = '#eaf2ff';
		ctx.fillText(lines[1] ?? '', W / 2, panelY + 18);
		ctx.fillStyle = '#92a4be';
		ctx.fillText(lines[2] ?? '', W / 2, panelY + 34);
		ctx.fillText(lines[3] ?? '', W / 2, panelY + 50);
		ctx.fillStyle = '#67f3c4';
		ctx.fillText(lines[4] ?? '', W / 2, panelY + 66);
	}

	private renderTitle(ctx: CanvasRenderingContext2D): void {
		const W = ctx.canvas.width;
		const H = ctx.canvas.height;

		// Game title
		ctx.fillStyle = '#eaf2ff';
		ctx.font = 'bold 48px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText('BADGER', W / 2, H / 3);
		ctx.fillText('SPRAWL RUNNER', W / 2, H / 3 + 50);

		// Subtitle
		ctx.fillStyle = '#67f3c4';
		ctx.font = '18px ui-monospace, monospace';
		ctx.fillText('A Cyber-Platformer Adventure', W / 2, H / 3 + 100);

		this.renderStoryProgress(ctx, W, H);

		// Menu
		let y = H / 2 + 96;
		for (let i = 0; i < this.menuOptions.length; i++) {
			const option = this.menuOptions[i];
			if (!option) continue;
			const isSelected = i === this.selectedOption;

			if (isSelected) {
				ctx.fillStyle = '#ffb35e';
				ctx.fillText(`> ${option.label}`, W / 2, y);
			} else {
				ctx.fillStyle = '#92a4be';
				ctx.fillText(`  ${option.label}`, W / 2, y);
			}

			y += 40;
		}

		// Footer
		ctx.fillStyle = '#4a4a4a';
		ctx.font = '14px ui-monospace, monospace';
		ctx.fillText('Arrow keys to navigate | Enter to select', W / 2, H - 50);
	}
}

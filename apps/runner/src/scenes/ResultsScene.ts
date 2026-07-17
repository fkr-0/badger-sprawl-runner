/**
 * ResultsScene - shows run results and rewards
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';
import type { RunResult } from '@badger/progression';
import {
	ARCADE_UI_FONT,
	BADGER_UI,
	drawArcadeBackdrop,
	drawArcadeFooter,
	drawArcadePanel,
} from '../ui/ArcadeUi';

export class ResultsScene implements Scene {
	readonly name = 'ResultsScene';

	private results: RunResult | null = null;
	private keyHandler: ((e: KeyboardEvent) => void) | null = null;
	private renderer: Renderer | null = null;

	onEnter(ctx: SceneContext): void {
		console.log('ResultsScene entered');
		this.renderer = ctx.renderer;

		const handleKeyDown = (e: KeyboardEvent): void => {
			if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
				this.returnToHub();
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
		console.log('ResultsScene exited');
	}

	update(dt: number): void {
		// Results logic
	}

	render(rend: Renderer, alpha: number): void {
		const ctx = rend.getContext();

		drawArcadeBackdrop(ctx);

		if (!this.results) return;

		this.renderResults(ctx);
	}

	private renderResults(ctx: CanvasRenderingContext2D): void {
		if (!this.results) return;

		const W = ctx.canvas.width;
		const H = ctx.canvas.height;
		const panelWidth = Math.min(520, W - 96);
		const panelX = W / 2 - panelWidth / 2;
		const panelY = H / 4 + 34;
		drawArcadePanel(ctx, {
			x: panelX,
			y: panelY,
			width: panelWidth,
			height: 344,
			accent: this.results.damageDealt > 100 ? BADGER_UI.accent : BADGER_UI.danger,
			strong: true,
			label: 'Run ledger',
		});

		const victory = this.results.damageDealt > 100;
		ctx.fillStyle = victory ? BADGER_UI.accent : BADGER_UI.danger;
		ctx.font = `900 36px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText(victory ? 'MISSION COMPLETE' : 'DEFEATED', W / 2, H / 4);

		// Stats
		const stats = [
			{ label: 'Damage Dealt', value: this.results.damageDealt.toString() },
			{ label: 'Damage Taken', value: this.results.damageTaken.toString() },
			{ label: 'Heat Gained', value: this.results.heatGained.toString() },
			{ label: 'Time Alive', value: this.formatTime(this.results.timeAlive) },
			{ label: 'Loot Found', value: this.results.lootCollected.length.toString() },
		];

		let y = H / 3 + 30;
		ctx.font = `16px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'left';

		for (const stat of stats) {
			ctx.fillStyle = BADGER_UI.muted;
			ctx.fillText(`${stat.label}:`, W / 2 - 100, y);
			ctx.fillStyle = BADGER_UI.text;
			ctx.textAlign = 'right';
			ctx.fillText(stat.value, W / 2 + 100, y);
			ctx.textAlign = 'left';
			y += 30;
		}

		// Rewards
		y += 20;
		ctx.textAlign = 'center';
		ctx.fillStyle = BADGER_UI.warning;
		ctx.font = `800 18px ${ARCADE_UI_FONT}`;
		ctx.fillText('REWARDS', W / 2, y);
		y += 30;

		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `16px ${ARCADE_UI_FONT}`;
		ctx.fillText(`${this.results.rewards.credchips} Credchips`, W / 2, y);
		y += 25;
		ctx.fillText(`${this.results.rewards.blueprintShards} Blueprint Shards`, W / 2, y);
		y += 25;
		ctx.fillText(`${this.results.rewards.dubFavor} Dub Favor`, W / 2, y);

		drawArcadeFooter(ctx, 'Enter  //  Return to Colony Hub');
	}

	private formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	setResults(results: RunResult): void {
		this.results = results;
	}

	returnToHub(): void {
		console.log('Returning to hub with rewards:', this.results?.rewards);
		// Would use SceneManager to transition to ColonyHubScene
	}
}

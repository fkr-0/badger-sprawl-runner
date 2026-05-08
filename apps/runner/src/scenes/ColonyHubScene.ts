/**
 * ColonyHubScene - central hub with shop, skill tree access
 */

import type { Scene } from '../engine/SceneManager';
import type { SceneContext } from '../engine/SceneManager';
import { loadMeta, type MetaState } from '@badger/progression';
import type { Renderer } from '../renderer/Renderer';

export class ColonyHubScene implements Scene {
	readonly name = 'ColonyHubScene';

	private metaState: MetaState | null = null;
	private keyHandler: ((e: KeyboardEvent) => void) | null = null;
	private renderer: Renderer | null = null;
	private selectedOption = 0;
	private menuOptions = [
		{ id: 'shop', name: 'Visit Shop', key: 'S' },
		{ id: 'skills', name: 'Skill Tree', key: 'K' },
		{ id: 'mission', name: 'Next Mission', key: 'ENTER' },
	];

	onEnter(ctx: SceneContext): void {
		console.log('ColonyHubScene entered');
		this.renderer = ctx.renderer as Renderer;
		this.metaState = loadMeta();

		// Initialize fresh state if none exists
		if (!this.metaState) {
			this.metaState = {
				credchips: 100, // Starting currency
				blueprintShards: 0,
				dubFavor: 0,
				orbitHeat: 0,
				unlockedBoons: [],
				purchasedSkills: [],
			};
		}

		// Set up keyboard input
		const handleKeyDown = (e: KeyboardEvent): void => {
			switch (e.code) {
				case 'ArrowUp':
					this.selectedOption = Math.max(0, this.selectedOption - 1);
					break;
				case 'ArrowDown':
					this.selectedOption = Math.min(this.menuOptions.length - 1, this.selectedOption + 1);
					break;
				case 'Enter':
					this.selectOption();
					break;
				case 'KeyS':
					this.navigate('shop');
					break;
				case 'KeyK':
					this.navigate('skills');
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
		console.log('ColonyHubScene exited');
	}

	update(dt: number): void {
		// Hub interaction is handled in render via keyboard events
	}

	render(renderer: unknown, alpha: number): void {
		const rend = renderer as Renderer;
		const ctx = rend.getContext();

		// Clear and draw background
		rend.clear();
		rend.drawBackground();

		// Draw hub environment
		this.renderHub(ctx);

		// Draw menu
		this.renderMenu(ctx);
	}

	private renderHub(ctx: CanvasRenderingContext2D): void {
		const W = ctx.canvas.width;
		const H = ctx.canvas.height;

		// Floor
		ctx.fillStyle = '#1a1d26';
		ctx.fillRect(0, H - 150, W, 150);

		// Hub structure
		ctx.fillStyle = '#272b32';
		ctx.fillRect(W / 2 - 200, H - 300, 400, 150);

		// Npcs
		ctx.fillStyle = '#67f3c4';
		ctx.beginPath();
		ctx.arc(W / 2, H - 220, 30, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#eaf2ff';
		ctx.font = '14px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText('MURR MURRBY', W / 2, H - 260);
	}

	private renderMenu(ctx: CanvasRenderingContext2D): void {
		const W = ctx.canvas.width;
		const H = ctx.canvas.height;

		// Menu panel
		ctx.fillStyle = 'rgba(4, 6, 12, 0.9)';
		ctx.fillRect(W / 2 - 200, H / 2 - 150, 400, 300);

		// Title
		ctx.fillStyle = '#67f3c4';
		ctx.font = 'bold 24px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText('COLONY HUB', W / 2, H / 2 - 110);

		// Currency display
		if (this.metaState) {
			ctx.fillStyle = '#ffb35e';
			ctx.font = '14px ui-monospace, monospace';
			ctx.fillText(`Credchips: ${this.metaState.credchips}`, W / 2, H / 2 - 80);
			ctx.fillStyle = '#ff5e7a';
			ctx.fillText(`Blueprint Shards: ${this.metaState.blueprintShards}`, W / 2, H / 2 - 60);
			ctx.fillStyle = '#67f3c4';
			ctx.fillText(`Dub Favor: ${this.metaState.dubFavor}`, W / 2, H / 2 - 40);
		}

		// Menu options
		let y = H / 2;
		for (let i = 0; i < this.menuOptions.length; i++) {
			const option = this.menuOptions[i];
			const isSelected = i === this.selectedOption;

			if (isSelected) {
				ctx.fillStyle = '#ffb35e';
				ctx.fillText(`> ${option.name}`, W / 2, y);
			} else {
				ctx.fillStyle = '#92a4be';
				ctx.fillText(`  ${option.name}`, W / 2, y);
			}

			// Key hint
			ctx.fillStyle = '#4a4a4a';
			ctx.font = '12px ui-monospace, monospace';
			ctx.fillText(`[${option.key}]`, W / 2 + 100, y);

			y += 35;
		}
	}

	private selectOption(): void {
		const option = this.menuOptions[this.selectedOption];
		this.navigate(option.id);
	}

	private navigate(destination: string): void {
		console.log(`Navigate to: ${destination}`);
		// This would use SceneManager to push/replace scenes
	}
}

/**
 * Renderer - central canvas context wrapper and render coordination
 */

import { SpriteRenderer } from './SpriteRenderer';
import { VFXPool } from './VFXPool';
import { ParallaxRenderer } from './ParallaxLayer';
import { TitleCardRenderer } from './TitleCardRenderer';
import { UIRenderer } from './UIRenderer';
import type { Player } from '../actors/MossBadger';
import type { Camera } from '../systems/CameraSystem';
import type { EnemyEntity } from '../systems/EnemySystem';

export class Renderer {
	private spriteRenderer: SpriteRenderer;
	private vfxPool: VFXPool;
	private parallaxRenderer: ParallaxRenderer;
	private titleCardRenderer: TitleCardRenderer;
	private uiRenderer: UIRenderer;

	constructor(
		private ctx: CanvasRenderingContext2D,
		private width: number,
		private height: number
	) {
		this.spriteRenderer = new SpriteRenderer(ctx);
		this.vfxPool = new VFXPool();
		this.parallaxRenderer = new ParallaxRenderer();
		this.titleCardRenderer = new TitleCardRenderer();
		this.uiRenderer = new UIRenderer();

		// Initialize default parallax
		this.parallaxRenderer.initializeDefaultSprawl(height);
	}

	clear(): void {
		this.ctx.clearRect(0, 0, this.width, this.height);
	}

	drawBackground(): void {
		const sky = this.ctx.createLinearGradient(0, 0, 0, this.height);
		sky.addColorStop(0, '#111832');
		sky.addColorStop(0.55, '#12101f');
		sky.addColorStop(1, '#080a12');
		this.ctx.fillStyle = sky;
		this.ctx.fillRect(0, 0, this.width, this.height);
	}

	renderParallax(cameraX: number): void {
		this.parallaxRenderer.render(this.ctx, cameraX, this.width, this.height);
	}

	renderPlatforms(
		platforms: Array<{ x: number; y: number; w: number; h: number }>,
		cameraX: number
	): void {
		for (const p of platforms) {
			const x = p.x - cameraX;
			if (x + p.w < 0 || x > this.width) continue;

			// Platform body
			this.ctx.fillStyle = '#272b32';
			this.ctx.fillRect(x, p.y, p.w, p.h);

			// Platform highlight
			this.ctx.fillStyle = '#364457';
			this.ctx.fillRect(x, p.y, p.w, 4);

			// Safety stripes
			this.ctx.fillStyle = '#ffb35e';
			for (let sx = x + 10; sx < x + p.w - 10; sx += 24) {
				this.ctx.fillRect(sx, p.y + p.h - 8, 12, 4);
				this.ctx.fillRect(sx + 12, p.y + p.h - 4, 12, 4);
			}
		}
	}

	renderPlayer(
		player: Player & {
			animState?: { currentAnim: string; frame: number };
			scaleX?: number;
			scaleY?: number;
		},
		cameraX: number
	): void {
		const x = player.x - cameraX;
		const y = player.y;
		const scaleX = player.scaleX ?? 1;
		const scaleY = player.scaleY ?? 1;

		if (this.spriteRenderer.hasSheet('moss_badger')) {
			// Use sprite rendering with squash/stretch
			if (player.animState) {
				this.spriteRenderer.drawEntity(
					'moss_badger',
					player.animState,
					x,
					y,
					player.dir < 0,
					scaleX,
					scaleY
				);
			}
		} else {
			// Fallback vector rendering with squash/stretch
			const fallback = this.spriteRenderer.getFallbackDraw();
			fallback(this.ctx, player, x, y);
		}
	}

	renderEnemies(enemies: EnemyEntity[], cameraX: number): void {
		for (const enemy of enemies) {
			const x = enemy.x - cameraX;

			// Stun flash
			if (enemy.stun > 0) {
				this.ctx.fillStyle = '#ffb35e';
				this.ctx.fillRect(x - 2, enemy.y - 2, enemy.w + 4, enemy.h + 4);
			}

			// Body
			this.ctx.fillStyle = '#1a1d26';
			this.ctx.fillRect(x, enemy.y, enemy.w, enemy.h);

			// Eye
			this.ctx.fillStyle = enemy.invuln > 0 ? '#ff5e7a' : '#67f3c4';
			this.ctx.fillRect(x + (enemy.vx > 0 ? 22 : 6), enemy.y + 8, 6, 6);
		}
	}

	renderPickups(
		pickups: Array<{ x: number; y: number; kind: string; taken: boolean }>,
		cameraX: number
	): void {
		for (const p of pickups) {
			if (p.taken) continue;

			const x = p.x - cameraX;
			const bob = Math.sin(Date.now() / 200) * 4;

			// Glow
			this.ctx.shadowColor = this.getPickupColor(p.kind);
			this.ctx.shadowBlur = 16;

			// Item
			this.ctx.fillStyle = this.getPickupColor(p.kind);
			this.ctx.fillRect(x - 8, p.y + bob - 8, 16, 16);

			this.ctx.shadowBlur = 0;
		}
	}

	renderVFX(cameraX: number): void {
		this.vfxPool.render(this.ctx, cameraX);
	}

	renderUI(player: Player, camera: Camera): void {
		this.uiRenderer.render(this.ctx, player, camera);
	}

	renderTitleCard(title: string, subtitle?: string, progress = 0): void {
		this.titleCardRenderer.render(this.ctx, title, subtitle, progress);
	}

	updateVFX(dt: number): void {
		this.vfxPool.update(dt);
	}

	emitVFX(x: number, y: number, kind: string, count: number, spread?: number): void {
		this.vfxPool.emit(x, y, kind, count, spread);
	}

	async loadSprites(manifestUrl: string): Promise<void> {
		await this.spriteRenderer.loadManifest(manifestUrl);
	}

	getContext(): CanvasRenderingContext2D {
		return this.ctx;
	}

	getSpriteRenderer(): SpriteRenderer {
		return this.spriteRenderer;
	}

	getVFXPool(): VFXPool {
		return this.vfxPool;
	}

	private getPickupColor(kind: string): string {
		switch (kind) {
			case 'rocket':
				return '#ffb35e';
			case 'railgun':
				return '#67f3c4';
			case 'stim':
				return '#ff5e7a';
			case 'katana':
				return '#eaf2ff';
			default:
				return '#fff';
		}
	}
}

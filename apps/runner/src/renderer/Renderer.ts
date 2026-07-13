/**
 * Renderer - central canvas context wrapper and render coordination
 */

import type { Player } from '../actors/MossBadger';
import type { Camera } from '../systems/CameraSystem';
import type { CombatEntity } from '../systems/CombatSystem';
import type { Pickup } from '../systems/ItemSystem';
import { DialoguePortraitRenderer } from './DialoguePortraitRenderer';
import { ParallaxRenderer } from './ParallaxLayer';
import { SpriteRenderer } from './SpriteRenderer';
import { TitleCardRenderer } from './TitleCardRenderer';
import { UIRenderer } from './UIRenderer';
import { VFXPool } from './VFXPool';

export class Renderer {
	private spriteRenderer: SpriteRenderer;
	private vfxPool: VFXPool;
	private parallaxRenderer: ParallaxRenderer;
	private titleCardRenderer: TitleCardRenderer;
	private uiRenderer: UIRenderer;
	private dialoguePortraitRenderer: DialoguePortraitRenderer;

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
		this.dialoguePortraitRenderer = new DialoguePortraitRenderer();

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

	private renderBoss(enemy: CombatEntity, x: number): void {
		const sheetId = enemy.bossSpriteSheetId;
		if (!sheetId) return;
		const animationName = enemy.bossAnimation ?? 'idle';
		const animation = this.spriteRenderer.getSheet(sheetId)?.sheet.animations[animationName];
		const frame = animation
			? Math.floor((performance.now() / 1000) * animation.fps) % animation.frames
			: 0;
		const spriteX = x + enemy.w / 2 - 48;
		const spriteY = enemy.y + enemy.h - 88;

		this.ctx.save();
		if ((enemy.bossTelegraph ?? 0) > 0) {
			const pulse = 10 + (enemy.bossTelegraph ?? 0) * 24;
			this.ctx.strokeStyle = '#ff5e7a';
			this.ctx.lineWidth = 3;
			this.ctx.globalAlpha = 0.45 + (enemy.bossTelegraph ?? 0) * 0.45;
			this.ctx.beginPath();
			this.ctx.arc(x + enemy.w / 2, enemy.y + enemy.h / 2, pulse, 0, Math.PI * 2);
			this.ctx.stroke();
		}
		this.ctx.globalAlpha = enemy.hp <= 0 ? 0.72 : 1;
		this.spriteRenderer.drawFrame(sheetId, animationName, frame, spriteX, spriteY, enemy.dir > 0);
		this.ctx.globalAlpha = 1;

		const barW = 118;
		const ratio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
		this.ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
		this.ctx.fillRect(x + enemy.w / 2 - barW / 2, enemy.y - 25, barW, 12);
		this.ctx.fillStyle = ratio > 0.5 ? '#ffb35e' : '#ff5e7a';
		this.ctx.fillRect(x + enemy.w / 2 - barW / 2 + 2, enemy.y - 23, (barW - 4) * ratio, 8);
		this.ctx.fillStyle = '#eaf2ff';
		this.ctx.font = '700 9px ui-monospace, monospace';
		this.ctx.textAlign = 'center';
		this.ctx.fillText(enemy.bossName ?? 'CAPTAIN GRIN', x + enemy.w / 2, enemy.y - 30);
		this.ctx.restore();
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

		this.ctx.save();
		if ((player.damageFlash ?? 0) > 0 && Math.floor(performance.now() / 55) % 2 === 0) {
			this.ctx.globalAlpha = 0.48;
		}
		if (this.spriteRenderer.hasSheet('moss_badger')) {
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
			const fallback = this.spriteRenderer.getFallbackDraw();
			fallback(this.ctx, player, x, y);
		}
		this.ctx.restore();
	}

	renderEnemies(enemies: CombatEntity[], cameraX: number): void {
		for (const enemy of enemies) {
			const x = enemy.x - cameraX;
			if (enemy.bossSpriteSheetId && this.spriteRenderer.hasSheet(enemy.bossSpriteSheetId)) {
				this.renderBoss(enemy, x);
				continue;
			}

			if ((enemy.attackTelegraph ?? 0) > 0) {
				const telegraph = Math.max(0, Math.min(1, enemy.attackTelegraph ?? 0));
				this.ctx.save();
				this.ctx.globalAlpha = 0.35 + telegraph * 0.55;
				this.ctx.strokeStyle = '#ffb35e';
				this.ctx.lineWidth = 2 + telegraph * 2;
				this.ctx.beginPath();
				this.ctx.arc(x + enemy.w / 2, enemy.y + enemy.h / 2, 20 + telegraph * 13, 0, Math.PI * 2);
				this.ctx.stroke();
				if (enemy.procgenRole === 'turret') {
					this.ctx.fillStyle = 'rgba(255, 94, 122, 0.18)';
					this.ctx.fillRect(enemy.dir > 0 ? x + enemy.w : x - 300, enemy.y + 7, 300, enemy.h - 14);
				}
				this.ctx.restore();
			}

			if (enemy.stun > 0) {
				this.ctx.fillStyle = '#ffb35e';
				this.ctx.fillRect(x - 2, enemy.y - 2, enemy.w + 4, enemy.h + 4);
			}

			// Body
			this.ctx.fillStyle =
				enemy.procgenRole === 'bruiser'
					? '#3b2638'
					: enemy.procgenRole === 'turret'
						? '#202b3c'
						: '#1a1d26';
			this.ctx.fillRect(x, enemy.y, enemy.w, enemy.h);

			if (enemy.rookMarked) {
				this.ctx.strokeStyle = '#67f3c4';
				this.ctx.lineWidth = 2;
				this.ctx.strokeRect(x - 4, enemy.y - 4, enemy.w + 8, enemy.h + 8);
			}
			if (enemy.bossPhaseLabel) {
				this.ctx.strokeStyle = '#ff5e7a';
				this.ctx.lineWidth = 2;
				this.ctx.strokeRect(x - 7, enemy.y - 7, enemy.w + 14, enemy.h + 14);
			}

			// Eye and state tell.
			this.ctx.fillStyle =
				enemy.aiState === 'windup' ? '#ffb35e' : enemy.invuln > 0 ? '#ff5e7a' : '#67f3c4';
			this.ctx.fillRect(x + (enemy.dir > 0 ? enemy.w - 12 : 6), enemy.y + 8, 6, 6);
			if (enemy.hp < enemy.maxHp && enemy.hp > 0) {
				const width = Math.max(28, enemy.w + 8);
				const ratio = Math.max(0, enemy.hp / enemy.maxHp);
				this.ctx.fillStyle = 'rgba(4, 6, 12, 0.88)';
				this.ctx.fillRect(x + enemy.w / 2 - width / 2, enemy.y - 10, width, 5);
				this.ctx.fillStyle = enemy.procgenRole === 'bruiser' ? '#ff5e7a' : '#67f3c4';
				this.ctx.fillRect(x + enemy.w / 2 - width / 2 + 1, enemy.y - 9, (width - 2) * ratio, 3);
			}
		}
	}

	renderPickups(pickups: Pickup[], cameraX: number): void {
		for (const p of pickups) {
			if (p.taken || p.visualState === 'collected') continue;

			const x = p.x - cameraX;
			const bob = Math.sin(Date.now() / 200) * 4;
			const color = this.getPickupColor(p.kind);
			const scale = p.visualState === 'collecting' ? 1.35 : 1;

			this.ctx.save();
			this.ctx.shadowColor = color;
			this.ctx.shadowBlur = p.visualState === 'collecting' ? 24 : 16;

			if (this.spriteRenderer.hasSheet('items_core') && p.animation) {
				const frame = Math.floor(Date.now() / 125) % 4;
				this.spriteRenderer.drawFrame('items_core', p.animation, frame, x - 16, p.y + bob - 16);
			} else {
				this.ctx.translate(x, p.y + bob);
				this.ctx.scale(scale, scale);
				this.ctx.fillStyle = color;
				this.ctx.fillRect(-8, -8, 16, 16);
			}

			this.ctx.restore();
		}
	}

	renderVFX(cameraX: number): void {
		this.vfxPool.render(this.ctx, cameraX);
	}

	renderUI(player: Player, camera: Camera): void {
		this.uiRenderer.render(this.ctx, player, camera, this.spriteRenderer);
	}

	renderDialoguePortrait(speaker: string, x: number, y: number, size?: number): void {
		this.dialoguePortraitRenderer.render(this.ctx, this.spriteRenderer, speaker, x, y, size);
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
			case 'set_piece':
				return '#ffe06b';
			case 'pickup':
				return '#ffe06b';
			default:
				return '#fff';
		}
	}
}

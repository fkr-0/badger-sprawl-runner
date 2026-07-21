/**
 * Renderer - central canvas context wrapper and render coordination
 */

import { type LoadedSheet, sampleSpriteAnimationFrame } from '@badger/sprite-contracts';
import { createArcadeCameraTransform } from '../../../../vendor/arcade-runtime.mjs';
import type { Player } from '../actors/MossBadger';
import type { StagePlatformArt } from '../game/StageArtRegistry';
import type { Camera } from '../systems/CameraSystem';
import type { CombatEntity } from '../systems/CombatSystem';
import type { Pickup } from '../systems/ItemSystem';
import { DialoguePortraitRenderer } from './DialoguePortraitRenderer';
import { ParallaxRenderer } from './ParallaxLayer';
import type { ParallaxLayer } from './ParallaxLayer';
import {
	type SpriteManifestLoadOptions,
	type SpriteManifestLoadReport,
	SpriteRenderer,
} from './SpriteRenderer';
import { TitleCardRenderer } from './TitleCardRenderer';
import { UIRenderer } from './UIRenderer';
import { VFXPool, type VFXRenderSource } from './VFXPool';

export const PLAYER_SPRITE_SHEET_ID = 'moss_badger_production';
export const LOWER_SPRAWL_BACKDROP_SHEET_ID = 'lower_sprawl_backdrop';
export const LOWER_SPRAWL_PARALLAX_SHEET_ID = 'lower_sprawl_parallax';
export const DRAINMARKET_PARALLAX_SHEET_ID = 'drainmarket_parallax';
export const CHROME_ARCOLOGY_PARALLAX_SHEET_ID = 'chrome_arcology_parallax';
export const MIRROR_PALACE_PARALLAX_SHEET_ID = 'straylight_mirage_parallax';
export const DUB_COLONY_PARALLAX_SHEET_ID = 'dub_colony_parallax';
export const ANTENNA_BARRENS_PARALLAX_SHEET_ID = 'antenna_barrens_parallax';
export const ORBITAL_LIFT_PARALLAX_SHEET_ID = 'orbital_lift_parallax';
export const ASTEROID_REDOUBT_PARALLAX_SHEET_ID = 'asteroid_redoubt_parallax';
const BOSS_RENDER_HEIGHT = 78;

export type BadgerBridgePassName = 'stage-backdrop' | 'parallax' | 'terrain';
export interface BadgerRendererBridgeSink {
	queuePass(name: BadgerBridgePassName, draw: (ctx: CanvasRenderingContext2D) => void): void;
	syncNativeHud?(player: Player): void;
	syncNativeVfx?(source: VFXRenderSource, cameraX: number): void;
	syncNativeStageParallax?(sheetId: string, sheet: LoadedSheet, cameraX: number): void;
	syncNativeProceduralParallax?(layers: readonly ParallaxLayer[], cameraX: number): void;
	syncNativeStageBackdrop?(sheetId: string, sheet: LoadedSheet): void;
	syncNativePlayer?(player: Player, cameraX: number, sprites: SpriteRenderer): void;
	syncNativeEnemies?(
		enemies: readonly CombatEntity[],
		cameraX: number,
		sprites: SpriteRenderer
	): void;
	syncNativeProjectiles?(player: Player, cameraX: number): void;
	syncNativeTerrain?(
		platforms: readonly { x: number; y: number; w: number; h: number }[],
		cameraX: number,
		art: StagePlatformArt | undefined,
		sprites: SpriteRenderer
	): void;
}

export class Renderer {
	private spriteRenderer: SpriteRenderer;
	private vfxPool: VFXPool;
	private parallaxRenderer: ParallaxRenderer;
	private titleCardRenderer: TitleCardRenderer;
	private uiRenderer: UIRenderer;
	private dialoguePortraitRenderer: DialoguePortraitRenderer;
	private bridgeSink: BadgerRendererBridgeSink | null = null;
	private cameraTransform = createArcadeCameraTransform({ anchorX: 0, anchorY: 0 });

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

	renderProjectiles(player: Player, cameraX: number): void {
		if (this.bridgeSink?.syncNativeProjectiles) {
			this.bridgeSink.syncNativeProjectiles(player, cameraX);
			return;
		}
		if ((player.railgunFlash ?? 0) <= 0) return;
		const startX = player.x + (player.dir > 0 ? player.w : 0) - cameraX;
		const endX = startX + player.dir * 560;
		const y = player.y + 23;
		this.ctx.save();
		this.ctx.globalAlpha = Math.min(1, (player.railgunFlash ?? 0) / 0.08);
		this.ctx.strokeStyle = '#eaf2ff';
		this.ctx.lineWidth = 8;
		this.ctx.beginPath();
		this.ctx.moveTo(startX, y);
		this.ctx.lineTo(endX, y);
		this.ctx.stroke();
		this.ctx.strokeStyle = '#67f3c4';
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.moveTo(startX, y);
		this.ctx.lineTo(endX, y);
		this.ctx.stroke();
		this.ctx.restore();
	}

	clear(): void {
		this.ctx.clearRect(0, 0, this.width, this.height);
	}

	setBridgeSink(sink: BadgerRendererBridgeSink | null): void {
		this.bridgeSink = sink;
	}

	private queueBridgePass(
		name: BadgerBridgePassName,
		draw: (ctx: CanvasRenderingContext2D) => void
	): boolean {
		if (!this.bridgeSink) return false;
		this.bridgeSink.queuePass(name, draw);
		return true;
	}

	drawBackground(): void {
		if (this.queueBridgePass('stage-backdrop', (ctx) => this.drawBackgroundTo(ctx))) return;
		this.drawBackgroundTo(this.ctx);
	}

	private drawBackgroundTo(ctx: CanvasRenderingContext2D): void {
		const sky = ctx.createLinearGradient(0, 0, 0, this.height);
		sky.addColorStop(0, '#111832');
		sky.addColorStop(0.55, '#12101f');
		sky.addColorStop(1, '#080a12');
		ctx.fillStyle = sky;
		ctx.fillRect(0, 0, this.width, this.height);
	}

	renderParallax(cameraX: number): void {
		if (this.bridgeSink?.syncNativeProceduralParallax) {
			this.bridgeSink.syncNativeProceduralParallax(this.parallaxRenderer.getLayers(), cameraX);
			return;
		}
		if (
			this.queueBridgePass('parallax', (ctx) =>
				this.parallaxRenderer.render(ctx, cameraX, this.width, this.height)
			)
		)
			return;
		this.parallaxRenderer.render(this.ctx, cameraX, this.width, this.height);
	}

	renderStageBackdrop(sheetId: string): boolean {
		const sheet = this.spriteRenderer.getSheet(sheetId);
		if (!sheet) return false;
		if (this.bridgeSink?.syncNativeStageBackdrop) {
			this.bridgeSink.syncNativeStageBackdrop(sheetId, sheet);
			return true;
		}
		if (this.queueBridgePass('stage-backdrop', (ctx) => this.drawStageBackdropTo(ctx, sheetId))) {
			return true;
		}
		this.drawStageBackdropTo(this.ctx, sheetId);
		return true;
	}

	private drawStageBackdropTo(ctx: CanvasRenderingContext2D, sheetId: string): void {
		this.spriteRenderer.drawFrameTo(ctx, sheetId, 'background', 0, 0, 0);
		const shade = ctx.createLinearGradient(0, 0, 0, this.height);
		shade.addColorStop(0, 'rgba(4, 7, 16, 0.10)');
		shade.addColorStop(0.65, 'rgba(4, 7, 16, 0.20)');
		shade.addColorStop(1, 'rgba(4, 7, 16, 0.48)');
		ctx.fillStyle = shade;
		ctx.fillRect(0, 0, this.width, this.height);
	}

	renderStageParallax(sheetId: string, cameraX: number): boolean {
		const sheet = this.spriteRenderer.getSheet(sheetId);
		if (!sheet) return false;
		if (this.bridgeSink?.syncNativeStageParallax) {
			this.bridgeSink.syncNativeStageParallax(sheetId, sheet, cameraX);
			return true;
		}
		if (this.queueBridgePass('parallax', (ctx) => this.drawStageParallaxTo(ctx, sheetId, cameraX)))
			return true;
		this.drawStageParallaxTo(this.ctx, sheetId, cameraX);
		return true;
	}

	private drawStageParallaxTo(
		ctx: CanvasRenderingContext2D,
		sheetId: string,
		cameraX: number
	): void {
		const layers = [
			{ animation: 'back_plate', speed: 0.035, alpha: 1 },
			{ animation: 'mid_plate', speed: 0.09, alpha: 0.84 },
			{ animation: 'front_plate', speed: 0.16, alpha: 0.66 },
		];
		for (const layer of layers) {
			const offset = -((cameraX * layer.speed) % this.width);
			ctx.save();
			ctx.globalAlpha = layer.alpha;
			this.spriteRenderer.drawFrameTo(ctx, sheetId, layer.animation, 0, offset, 0, false, 3, 3);
			this.spriteRenderer.drawFrameTo(
				ctx,
				sheetId,
				layer.animation,
				0,
				offset + this.width,
				0,
				false,
				3,
				3
			);
			ctx.restore();
		}
		const shade = ctx.createLinearGradient(0, 0, 0, this.height);
		shade.addColorStop(0, 'rgba(8, 5, 14, 0.08)');
		shade.addColorStop(0.62, 'rgba(8, 5, 14, 0.18)');
		shade.addColorStop(1, 'rgba(8, 5, 14, 0.52)');
		ctx.fillStyle = shade;
		ctx.fillRect(0, 0, this.width, this.height);
	}

	renderPlatforms(
		platforms: Array<{ x: number; y: number; w: number; h: number }>,
		cameraX: number,
		art?: StagePlatformArt
	): void {
		if (this.bridgeSink?.syncNativeTerrain) {
			this.bridgeSink.syncNativeTerrain(platforms, cameraX, art, this.spriteRenderer);
			return;
		}
		if (
			this.queueBridgePass('terrain', (ctx) => this.drawPlatformsTo(ctx, platforms, cameraX, art))
		)
			return;
		this.drawPlatformsTo(this.ctx, platforms, cameraX, art);
	}

	private drawPlatformsTo(
		ctx: CanvasRenderingContext2D,
		platforms: Array<{ x: number; y: number; w: number; h: number }>,
		cameraX: number,
		art?: StagePlatformArt
	): void {
		this.cameraTransform.set({
			x: cameraX,
			y: 0,
			zoom: 1,
			viewportWidth: this.width,
			viewportHeight: this.height,
		});
		const tileSheet = art ? this.spriteRenderer.getSheet(art.sheetId)?.sheet : undefined;
		const tileSize = tileSheet?.frameSize[0] ?? 32;
		const now = performance.now() / 1000;
		const animationFrame = (animationName: string): number => {
			const animation = tileSheet?.animations[animationName];
			if (!animation || animation.frames <= 1) return 0;
			return sampleSpriteAnimationFrame(tileSheet, animationName, now, { mode: 'loop' });
		};

		for (const [platformIndex, p] of platforms.entries()) {
			const x = this.cameraTransform.worldToScreen({ x: p.x, y: p.y }).x;
			if (x + p.w < 0 || x > this.width) continue;

			// Opaque fallback remains underneath the tile pass so missing or
			// partially transparent source art never creates collision ambiguity.
			ctx.fillStyle = '#272b32';
			ctx.fillRect(x, p.y, p.w, p.h);

			if (art && tileSheet && this.spriteRenderer.hasSheet(art.sheetId)) {
				ctx.save();
				ctx.beginPath();
				ctx.rect(x, p.y, p.w, p.h);
				ctx.clip();
				const firstColumn = Math.max(0, Math.floor(-x / tileSize));
				const lastColumn = Math.ceil((Math.min(this.width, x + p.w) - x) / tileSize);
				const rows = Math.max(1, Math.ceil(p.h / tileSize));
				for (let row = 0; row < rows; row += 1) {
					const animationName = row === 0 ? art.surfaceAnimation : art.bodyAnimation;
					const frame = animationFrame(animationName);
					for (let column = firstColumn; column < lastColumn; column += 1) {
						this.spriteRenderer.drawFrameTo(
							ctx,
							art.sheetId,
							animationName,
							frame,
							x + column * tileSize,
							p.y + row * tileSize
						);
					}
				}
				ctx.restore();

				// One deterministic set-dressing prop per substantial platform makes
				// the imported atlas visible without turning decorative art into a
				// collision promise.
				if (p.w >= tileSize * 3 && art.decorations.length > 0) {
					const decoration = art.decorations[platformIndex % art.decorations.length];
					if (!decoration) continue;
					const decorationFrame = animationFrame(decoration);
					const propX = x + Math.min(p.w - tileSize, tileSize * (1 + (platformIndex % 3)));
					this.spriteRenderer.drawFrameTo(
						ctx,
						art.sheetId,
						decoration,
						decorationFrame,
						propX,
						p.y - tileSize
					);
				}
				continue;
			}

			ctx.fillStyle = '#364457';
			ctx.fillRect(x, p.y, p.w, 4);
			ctx.fillStyle = '#ffb35e';
			for (let sx = x + 10; sx < x + p.w - 10; sx += 24) {
				ctx.fillRect(sx, p.y + p.h - 8, 12, 4);
				ctx.fillRect(sx + 12, p.y + p.h - 4, 12, 4);
			}
		}
	}

	private renderEnemySprite(enemy: CombatEntity, x: number): boolean {
		const sheetId = enemy.spriteSheetId;
		if (!sheetId || !this.spriteRenderer.hasSheet(sheetId)) return false;
		const animationName = enemy.hp <= 0 ? 'death' : (enemy.spriteAnimation ?? 'idle');
		const loadedSheet = this.spriteRenderer.getSheet(sheetId);
		const frame = loadedSheet?.sheet.animations[animationName]
			? sampleSpriteAnimationFrame(loadedSheet.sheet, animationName, performance.now() / 1000, {
					mode: 'loop',
				})
			: 0;
		this.ctx.save();
		if ((enemy.flashTimer ?? 0) > 0) {
			this.ctx.globalAlpha = Math.floor(performance.now() / 45) % 2 === 0 ? 0.38 : 0.92;
			this.ctx.filter = 'brightness(1.8) saturate(0.45)';
		}
		if (enemy.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0) {
			this.ctx.globalAlpha = 0.46;
		}
		const [frameWidth, frameHeight] = loadedSheet?.sheet.frameSize ?? [48, 48];
		const spriteX = x + enemy.w / 2 - frameWidth / 2;
		const spriteY = enemy.y + enemy.h - frameHeight;
		this.spriteRenderer.drawFrame(sheetId, animationName, frame, spriteX, spriteY, enemy.dir > 0);
		this.ctx.filter = 'none';
		this.ctx.restore();
		return true;
	}

	private renderBoss(enemy: CombatEntity, x: number): void {
		const sheetId = enemy.bossSpriteSheetId;
		if (!sheetId) return;
		const animationName = enemy.bossAnimation ?? 'idle';
		const loadedSheet = this.spriteRenderer.getSheet(sheetId);
		const frame = loadedSheet?.sheet.animations[animationName]
			? sampleSpriteAnimationFrame(loadedSheet.sheet, animationName, performance.now() / 1000, {
					mode: 'loop',
				})
			: 0;
		const [frameWidth, frameHeight] = loadedSheet?.sheet.frameSize ?? [96, 96];
		const renderScale = Math.min(1, BOSS_RENDER_HEIGHT / frameHeight);
		const spriteX = x + enemy.w / 2 - frameWidth / 2;
		const spriteY = enemy.y + enemy.h - frameHeight;

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
		this.spriteRenderer.drawFrame(
			sheetId,
			animationName,
			frame,
			spriteX,
			spriteY,
			enemy.dir > 0,
			renderScale,
			renderScale
		);
		this.ctx.globalAlpha = 1;

		const barW = 96;
		const ratio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
		this.ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
		this.ctx.fillRect(x + enemy.w / 2 - barW / 2, enemy.y - 25, barW, 12);
		this.ctx.fillStyle = ratio > 0.5 ? '#ffb35e' : '#ff5e7a';
		this.ctx.fillRect(x + enemy.w / 2 - barW / 2 + 2, enemy.y - 23, (barW - 4) * ratio, 8);
		this.ctx.fillStyle = '#eaf2ff';
		this.ctx.font = '700 8px ui-monospace, monospace';
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
		if (this.bridgeSink?.syncNativePlayer) {
			this.bridgeSink.syncNativePlayer(player, cameraX, this.spriteRenderer);
			return;
		}
		const [frameWidth, frameHeight] = this.spriteRenderer.getSheet(PLAYER_SPRITE_SHEET_ID)?.sheet
			.frameSize ?? [48, 48];
		const x = player.x - cameraX + player.w / 2 - frameWidth / 2;
		const y = player.y + player.h - frameHeight;
		const scaleX = player.scaleX ?? 1;
		const scaleY = player.scaleY ?? 1;

		this.ctx.save();
		if (
			(player.decoyTimer ?? 0) > 0 &&
			player.animState &&
			this.spriteRenderer.hasSheet(PLAYER_SPRITE_SHEET_ID)
		) {
			this.ctx.globalAlpha = Math.min(0.34, (player.decoyTimer ?? 0) * 0.48);
			this.spriteRenderer.drawEntity(
				PLAYER_SPRITE_SHEET_ID,
				player.animState,
				x - player.dir * 24,
				y + 2,
				player.dir < 0,
				scaleX,
				scaleY
			);
			this.ctx.globalAlpha = 1;
		}
		if ((player.damageFlash ?? 0) > 0 && Math.floor(performance.now() / 55) % 2 === 0) {
			this.ctx.globalAlpha = 0.48;
		}
		if (this.spriteRenderer.hasSheet(PLAYER_SPRITE_SHEET_ID)) {
			if (player.animState) {
				this.spriteRenderer.drawEntity(
					PLAYER_SPRITE_SHEET_ID,
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
		const syncNativeEnemies = this.bridgeSink?.syncNativeEnemies;
		const nativeActors = typeof syncNativeEnemies === 'function';
		if (syncNativeEnemies) {
			syncNativeEnemies(enemies, cameraX, this.spriteRenderer);
		}
		for (const enemy of enemies) {
			const x = enemy.x - cameraX;
			if (
				!nativeActors &&
				enemy.bossSpriteSheetId &&
				this.spriteRenderer.hasSheet(enemy.bossSpriteSheetId)
			) {
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
				if (nativeActors) {
					this.ctx.strokeStyle = '#ffb35e';
					this.ctx.lineWidth = 2;
					this.ctx.strokeRect(x - 2, enemy.y - 2, enemy.w + 4, enemy.h + 4);
				} else {
					this.ctx.fillStyle = '#ffb35e';
					this.ctx.fillRect(x - 2, enemy.y - 2, enemy.w + 4, enemy.h + 4);
				}
			}

			const renderedSprite = nativeActors || this.renderEnemySprite(enemy, x);

			if (!renderedSprite) {
				// Fallback body for enemies without a loaded authored sheet.
				this.ctx.fillStyle =
					enemy.procgenRole === 'bruiser'
						? '#3b2638'
						: enemy.procgenRole === 'turret'
							? '#202b3c'
							: '#1a1d26';
				this.ctx.fillRect(x, enemy.y, enemy.w, enemy.h);
			}

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

			if (!renderedSprite) {
				// Eye and state tell.
				this.ctx.fillStyle =
					enemy.aiState === 'windup' ? '#ffb35e' : enemy.invuln > 0 ? '#ff5e7a' : '#67f3c4';
				this.ctx.fillRect(x + (enemy.dir > 0 ? enemy.w - 12 : 6), enemy.y + 8, 6, 6);
			}
			if (enemy.hp < enemy.maxHp && enemy.hp > 0) {
				const width = Math.max(28, enemy.w + 8);
				const ratio = Math.max(0, enemy.hp / enemy.maxHp);
				this.ctx.fillStyle = 'rgba(4, 6, 12, 0.88)';
				this.ctx.fillRect(x + enemy.w / 2 - width / 2, enemy.y - 10, width, 5);
				this.ctx.fillStyle = enemy.procgenRole === 'bruiser' ? '#ff5e7a' : '#67f3c4';
				this.ctx.fillRect(x + enemy.w / 2 - width / 2 + 1, enemy.y - 9, (width - 2) * ratio, 3);
			}
			if (nativeActors && enemy.bossSpriteSheetId) {
				const barW = 96;
				const ratio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
				this.ctx.fillStyle = 'rgba(4, 6, 12, 0.85)';
				this.ctx.fillRect(x + enemy.w / 2 - barW / 2, enemy.y - 25, barW, 12);
				this.ctx.fillStyle = ratio > 0.5 ? '#ffb35e' : '#ff5e7a';
				this.ctx.fillRect(x + enemy.w / 2 - barW / 2 + 2, enemy.y - 23, (barW - 4) * ratio, 8);
				this.ctx.fillStyle = '#eaf2ff';
				this.ctx.font = '700 8px ui-monospace, monospace';
				this.ctx.textAlign = 'center';
				this.ctx.fillText(enemy.bossName ?? 'CAPTAIN GRIN', x + enemy.w / 2, enemy.y - 30);
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

			const spriteSheetId = p.spriteSheetId ?? 'items_core';
			if (this.spriteRenderer.hasSheet(spriteSheetId) && p.animation) {
				const frame = Math.floor(Date.now() / 125) % 4;
				this.spriteRenderer.drawFrame(spriteSheetId, p.animation, frame, x - 16, p.y + bob - 16);
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
		if (this.bridgeSink?.syncNativeVfx) {
			this.bridgeSink.syncNativeVfx(this.vfxPool, cameraX);
			return;
		}
		this.vfxPool.render(this.ctx, cameraX, this.spriteRenderer);
	}

	renderUI(player: Player, camera: Camera): void {
		this.bridgeSink?.syncNativeHud?.(player);
		this.uiRenderer.render(this.ctx, player, camera, this.spriteRenderer, {
			renderVitals: this.bridgeSink?.syncNativeHud === undefined,
		});
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

	async loadSprites(
		manifestUrl: string,
		options: SpriteManifestLoadOptions = {}
	): Promise<SpriteManifestLoadReport> {
		return this.spriteRenderer.loadManifest(manifestUrl, options);
	}

	getContext(): CanvasRenderingContext2D {
		return this.ctx;
	}

	getSpriteRenderer(): SpriteRenderer {
		return this.spriteRenderer;
	}

	getSpriteLoadReport(): SpriteManifestLoadReport | null {
		return this.spriteRenderer.getLastLoadReport();
	}

	resetSprites(): void {
		this.spriteRenderer.clear();
	}

	getActorRenderContract(): {
		playerFrameWidth: number;
		playerFrameHeight: number;
		bossTargetHeight: number;
		bossToPlayerHeightRatio: number;
	} {
		const [playerFrameWidth, playerFrameHeight] = this.spriteRenderer.getSheet(
			PLAYER_SPRITE_SHEET_ID
		)?.sheet.frameSize ?? [48, 48];
		return {
			playerFrameWidth,
			playerFrameHeight,
			bossTargetHeight: BOSS_RENDER_HEIGHT,
			bossToPlayerHeightRatio: BOSS_RENDER_HEIGHT / playerFrameHeight,
		};
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

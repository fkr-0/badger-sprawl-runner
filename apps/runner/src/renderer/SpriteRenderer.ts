/**
 * SpriteRenderer - loads sprite sheets and draws animated frames
 */

import {
	type LoadedSheet,
	type SpriteAnimationEvent,
	type SpriteManifest,
	loadSpriteSheet,
	normalizeSpriteManifest,
} from '@badger/sprite-contracts';
import { collectArcadeSpriteAnimationEvents } from '../../../../vendor/arcade-runtime.mjs';

interface FallbackEntity {
	x: number;
	y: number;
	w: number;
	h: number;
	dir: number;
	onGround: boolean;
	scaleX?: number;
	scaleY?: number;
}

export class SpriteRenderer {
	private sheets = new Map<string, LoadedSheet>();
	private manifest: SpriteManifest | null = null;

	constructor(private ctx: CanvasRenderingContext2D) {}

	async loadManifest(manifestUrl: string): Promise<void> {
		const response = await fetch(manifestUrl);
		this.manifest = normalizeSpriteManifest(await response.json());

		const loadPromises = this.manifest.sheets.map((sheetDef) =>
			loadSpriteSheet(sheetDef, this.ctx).then((loaded) => {
				this.sheets.set(sheetDef.id, loaded);
			})
		);

		await Promise.all(loadPromises);
	}

	drawFrame(
		sheetId: string,
		animName: string,
		frameIndex: number,
		x: number,
		y: number,
		flipX = false,
		scaleX = 1,
		scaleY = 1
	): void {
		this.drawFrameTo(this.ctx, sheetId, animName, frameIndex, x, y, flipX, scaleX, scaleY);
	}

	drawFrameTo(
		ctx: CanvasRenderingContext2D,
		sheetId: string,
		animName: string,
		frameIndex: number,
		x: number,
		y: number,
		flipX = false,
		scaleX = 1,
		scaleY = 1
	): void {
		const sheet = this.sheets.get(sheetId);
		if (!sheet) return;

		// Apply squash/stretch around the frame's feet rather than a hard-coded
		// point. This keeps 32px icons, 48px actors and 96px bosses aligned.
		const [frameWidth, frameHeight] = sheet.sheet.frameSize;
		const originalTransform = ctx.getTransform();
		ctx.translate(x + frameWidth / 2, y + frameHeight);
		ctx.scale(scaleX, scaleY);
		ctx.translate(-(x + frameWidth / 2), -(y + frameHeight));

		sheet.drawFrame(ctx, animName, frameIndex, x, y, flipX);

		ctx.setTransform(originalTransform);
	}

	drawEntity(
		sheetId: string,
		animState: { currentAnim: string; frame: number },
		x: number,
		y: number,
		flipX = false,
		scaleX = 1,
		scaleY = 1
	): void {
		this.drawFrame(sheetId, animState.currentAnim, animState.frame, x, y, flipX, scaleX, scaleY);
	}

	hasSheet(sheetId: string): boolean {
		return this.sheets.has(sheetId);
	}

	getSheet(sheetId: string): LoadedSheet | undefined {
		return this.sheets.get(sheetId);
	}

	getAnimationEvents(
		sheetId: string,
		animName: string,
		frameIndex: number
	): SpriteAnimationEvent[] {
		const sheet = this.sheets.get(sheetId);
		const animation = sheet?.sheet.animations[animName];
		if (!animation) return [];
		const frame = Math.max(0, frameIndex) % animation.frames;
		return [...collectArcadeSpriteAnimationEvents(animation, [frame])];
	}

	getContext(): CanvasRenderingContext2D {
		return this.ctx;
	}

	getFallbackDraw(): (
		ctx: CanvasRenderingContext2D,
		entity: FallbackEntity,
		x: number,
		y: number
	) => void {
		return (ctx, entity, x, y) => {
			const scaleX = entity.scaleX ?? 1;
			const scaleY = entity.scaleY ?? 1;

			ctx.save();

			// Apply squash and stretch from center
			const centerX = x + entity.w / 2;
			const centerY = y + entity.h / 2;
			ctx.translate(centerX, centerY);
			if (entity.dir < 0) ctx.scale(-1, 1);
			ctx.scale(scaleX, scaleY);
			ctx.translate(-centerX, -centerY);

			// Body
			ctx.fillStyle = '#272b32';
			ctx.fillRect(x, y, entity.w, entity.h);

			// Stripe
			ctx.fillStyle = '#f0f0e8';
			ctx.fillRect(x + 4, y + 8, 26, 10);

			// Eyes
			ctx.fillStyle = '#111';
			ctx.fillRect(x + 19, y + 10, 5, 5);

			// Legs with animation
			const runCycle = Math.sin(Date.now() / 60) * 4;
			ctx.fillStyle = '#364457';
			ctx.fillRect(x + 1, y + 32 + (entity.onGround ? runCycle : 0), 13, 16);
			ctx.fillRect(x + 20, y + 32 + (entity.onGround ? -runCycle : 0), 13, 16);

			ctx.restore();
		};
	}
}

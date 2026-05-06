/**
 * SpriteRenderer - loads sprite sheets and draws animated frames
 */

import { loadSpriteSheet, type SpriteManifest, type LoadedSheet } from '@badger/sprite-contracts';

export class SpriteRenderer {
  private sheets = new Map<string, LoadedSheet>();
  private manifest: SpriteManifest | null = null;

  constructor(private ctx: CanvasRenderingContext2D) {}

  async loadManifest(manifestUrl: string): Promise<void> {
    const response = await fetch(manifestUrl);
    this.manifest = await response.json() as SpriteManifest;

    const loadPromises = this.manifest.sheets.map(sheetDef =>
      loadSpriteSheet(sheetDef, this.ctx).then(loaded => {
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
    const sheet = this.sheets.get(sheetId);
    if (!sheet) return;

    // Apply squash and stretch
    const originalTransform = this.ctx.getTransform();
    this.ctx.translate(x + (scaleX !== 1 ? 16 : 0), y + (scaleY !== 1 ? 23 : 0));
    this.ctx.scale(scaleX, scaleY);
    this.ctx.translate(-(x + (scaleX !== 1 ? 16 : 0)), -(y + (scaleY !== 1 ? 23 : 0)));

    sheet.drawFrame(this.ctx, animName, frameIndex, x, y, flipX);

    this.ctx.setTransform(originalTransform);
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

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getFallbackDraw(): (ctx: CanvasRenderingContext2D, entity: any, x: number, y: number) => void {
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

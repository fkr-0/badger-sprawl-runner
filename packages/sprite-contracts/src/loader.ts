import type { SpriteSheet, LoadedSheet } from './types';

/**
 * Load a sprite sheet from a sheet definition
 * Loads the PNG image and creates a LoadedSheet with drawFrame method
 */
export function loadSpriteSheet(sheet: SpriteSheet, ctx: CanvasRenderingContext2D): Promise<LoadedSheet> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        sheet,
        image: img,
        drawFrame(ctx: CanvasRenderingContext2D, animName: string, frameIndex: number, x: number, y: number, flipX = false) {
          const anim = sheet.animations[animName];
          if (!anim) return;

          const [frameW, frameH] = sheet.frameSize;
          const animNames = Object.keys(sheet.animations);
          const animRow = animNames.indexOf(animName);
          if (animRow < 0) return;

          const srcX = frameIndex * frameW;
          const srcY = animRow * frameH;

          ctx.save();
          if (flipX) {
            ctx.translate(x + frameW, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, srcX, srcY, frameW, frameH, 0, 0, frameW, frameH);
          } else {
            ctx.drawImage(img, srcX, srcY, frameW, frameH, x, y, frameW, frameH);
          }
          ctx.restore();
        },
      });
    };
    img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${sheet.file}`));
    img.src = sheet.file;
  });
}

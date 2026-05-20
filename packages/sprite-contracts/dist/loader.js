function getOrderedFrame(sheet, animName, frameIndex) {
    const anim = sheet.animations[animName];
    if (!anim)
        return null;
    const wrappedFrame = Math.max(0, frameIndex) % anim.frames;
    return anim.order?.[wrappedFrame] ?? wrappedFrame;
}
function getFrameSource(sheet, animName, frameIndex) {
    const absoluteFrame = getOrderedFrame(sheet, animName, frameIndex);
    if (absoluteFrame === null)
        return null;
    const [frameW, frameH] = sheet.frameSize;
    if (sheet.grid) {
        const column = absoluteFrame % sheet.grid.columns;
        const row = Math.floor(absoluteFrame / sheet.grid.columns);
        return [column * frameW, row * frameH];
    }
    const animNames = Object.keys(sheet.animations);
    const animRow = animNames.indexOf(animName);
    if (animRow < 0)
        return null;
    return [absoluteFrame * frameW, animRow * frameH];
}
/**
 * Load a sprite sheet from a sheet definition.
 * Supports both row-per-animation sheets and explicit grid/order sheets.
 */
export function loadSpriteSheet(sheet, ctx) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                sheet,
                image: img,
                drawFrame(ctx, animName, frameIndex, x, y, flipX = false) {
                    const source = getFrameSource(sheet, animName, frameIndex);
                    if (!source)
                        return;
                    const [frameW, frameH] = sheet.frameSize;
                    const [srcX, srcY] = source;
                    ctx.save();
                    if (flipX) {
                        ctx.translate(x + frameW, y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(img, srcX, srcY, frameW, frameH, 0, 0, frameW, frameH);
                    }
                    else {
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
export const __spriteLoaderInternals = { getFrameSource, getOrderedFrame };
//# sourceMappingURL=loader.js.map
import { resolveArcadeSpriteFrame } from '../../../vendor/arcade-runtime.mjs';
function getOrderedFrame(sheet, animName, frameIndex) {
    return resolveArcadeSpriteFrame(sheet, animName, frameIndex)?.absoluteFrame ?? null;
}
function getFrameSource(sheet, animName, frameIndex) {
    const frame = resolveArcadeSpriteFrame(sheet, animName, frameIndex);
    return frame ? [frame.sourceX, frame.sourceY] : null;
}
/**
 * Browser image loading remains consumer-owned for this migration step. Frame
 * addressing is delegated to @arcade/runtime so Canvas and future Pixi paths
 * consume the same sheet/grid/order contract.
 */
export function loadSpriteSheet(sheet, ctx) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                sheet,
                image: img,
                drawFrame(ctx, animName, frameIndex, x, y, flipX = false) {
                    const frame = resolveArcadeSpriteFrame(sheet, animName, frameIndex);
                    if (!frame)
                        return;
                    const { sourceX, sourceY, frameWidth, frameHeight } = frame;
                    ctx.save();
                    if (flipX) {
                        ctx.translate(x + frameWidth, y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(img, sourceX, sourceY, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
                    }
                    else {
                        ctx.drawImage(img, sourceX, sourceY, frameWidth, frameHeight, x, y, frameWidth, frameHeight);
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
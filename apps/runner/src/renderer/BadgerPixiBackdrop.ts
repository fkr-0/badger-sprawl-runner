import type { LoadedSheet } from '@badger/sprite-contracts';
import { type Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { resolveArcadeSpriteFrame } from '@arcade/runtime/sprites';

export function createBadgerPixiBackdrop(options: {
	container: Container;
	width: number;
	height: number;
}) {
	const sprite = new Sprite();
	const shade = new Graphics();
	options.container.addChild(sprite, shade);
	let sheetId: string | null = null;
	let base: Texture | null = null;
	let frameTexture: Texture | null = null;
	let textureBytes = 0;

	return {
		sync(nextSheetId: string, sheet: LoadedSheet) {
			if (sheetId !== nextSheetId) {
				frameTexture?.destroy(false);
				base?.destroy(false);
				const frame = resolveArcadeSpriteFrame(sheet.sheet, 'background', 0);
				if (!frame) throw new Error(`Missing backdrop frame ${nextSheetId}:background`);
				base = Texture.from(sheet.image);
				base.source.scaleMode = 'nearest';
				frameTexture = new Texture({
					source: base.source,
					frame: new Rectangle(frame.sourceX, frame.sourceY, frame.frameWidth, frame.frameHeight),
				});
				sprite.texture = frameTexture;
				sprite.width = options.width;
				sprite.height = options.height;
				sheetId = nextSheetId;
				textureBytes = sheet.image.width * sheet.image.height * 4;
				shade.clear();
				shade.rect(0, 0, options.width, options.height * 0.65).fill({ color: 0x040710, alpha: 0.1 });
				shade.rect(0, options.height * 0.65, options.width, options.height * 0.35).fill({ color: 0x040710, alpha: 0.48 });
			}
			sprite.visible = true;
			shade.visible = true;
			return { sheetId, textureBytes } as const;
		},
		clear() {
			sprite.visible = false;
			shade.visible = false;
		},
		snapshot: () => ({ sheetId, textureBytes } as const),
		destroy() {
			frameTexture?.destroy(false);
			base?.destroy(false);
			sprite.removeFromParent();
			shade.removeFromParent();
			sprite.destroy({ texture: false, textureSource: false });
			shade.destroy();
		},
	};
}

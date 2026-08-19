import { type Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { resolveArcadeSpriteFrame } from '@arcade/runtime/sprites';
import type { LoadedSheet } from '@badger/sprite-contracts';
import type { ParallaxLayer } from './ParallaxLayer';

const STAGE_LAYERS = Object.freeze([
	Object.freeze({ animation: 'back_plate', speed: 0.035, alpha: 1 }),
	Object.freeze({ animation: 'mid_plate', speed: 0.09, alpha: 0.84 }),
	Object.freeze({ animation: 'front_plate', speed: 0.16, alpha: 0.66 }),
]);

interface StageStrip {
	speed: number;
	left: Sprite;
	right: Sprite;
	texture: Texture;
}

interface ProceduralElement {
	speed: number;
	sourceX: number;
	graphics: Graphics;
}

export interface BadgerPixiParallaxSnapshot {
	mode: 'none' | 'stage-sheet' | 'procedural';
	sheetId: string | null;
	stageStrips: number;
	proceduralElements: number;
	textureBuilds: number;
	updates: number;
}

export function resolveBadgerParallaxOffset(
	cameraX: number,
	speed: number,
	wrapWidth: number
): number {
	if (!Number.isFinite(wrapWidth) || wrapWidth <= 0) return 0;
	const distance = (Number.isFinite(cameraX) ? cameraX : 0) * (Number.isFinite(speed) ? speed : 0);
	return -(((distance % wrapWidth) + wrapWidth) % wrapWidth);
}

export function resolveBadgerProceduralParallaxX(
	sourceX: number,
	cameraX: number,
	speed: number,
	wrapWidth = 1200,
	origin = -120
): number {
	if (!Number.isFinite(wrapWidth) || wrapWidth <= 0) return origin;
	const distance = (Number.isFinite(cameraX) ? cameraX : 0) * (Number.isFinite(speed) ? speed : 0);
	const local = (Number.isFinite(sourceX) ? sourceX : 0) - distance;
	return ((local % wrapWidth) + wrapWidth) % wrapWidth + origin;
}

export function resolveBadgerStageParallaxFrames(sheet: LoadedSheet) {
	return STAGE_LAYERS.map((layer) => {
		const frame = resolveArcadeSpriteFrame(sheet.sheet, layer.animation, 0);
		if (!frame) throw new Error(`Missing parallax frame ${sheet.sheet.id}:${layer.animation}`);
		return Object.freeze({ ...layer, frame });
	});
}

export function createBadgerPixiParallax(options: {
	container: Container;
	width: number;
	height: number;
}) {
	const root = new Graphics();
	root.label = 'badger-native-parallax-shade';
	options.container.addChild(root);
	const stageStrips: StageStrip[] = [];
	const proceduralElements: ProceduralElement[] = [];
	let baseTexture: Texture | null = null;
	let mode: BadgerPixiParallaxSnapshot['mode'] = 'none';
	let sheetId: string | null = null;
	let textureBuilds = 0;
	let updates = 0;

	function drawShade(): void {
		root.clear();
		const bands = [
			{ y: 0, height: options.height * 0.45, alpha: 0.08 },
			{ y: options.height * 0.45, height: options.height * 0.2, alpha: 0.18 },
			{ y: options.height * 0.65, height: options.height * 0.35, alpha: 0.52 },
		];
		for (const band of bands) {
			root.rect(0, band.y, options.width, band.height);
			root.fill({ color: 0x08050e, alpha: band.alpha });
		}
	}

	function clearStage(): void {
		for (const strip of stageStrips) {
			strip.left.removeFromParent();
			strip.right.removeFromParent();
			strip.left.destroy({ texture: false, textureSource: false });
			strip.right.destroy({ texture: false, textureSource: false });
			strip.texture.destroy(false);
		}
		stageStrips.length = 0;
		baseTexture?.destroy(false);
		baseTexture = null;
	}

	function clearProcedural(): void {
		for (const element of proceduralElements) {
			element.graphics.removeFromParent();
			element.graphics.destroy();
		}
		proceduralElements.length = 0;
	}

	function clearContent(): void {
		clearStage();
		clearProcedural();
	}

	function buildStage(nextSheetId: string, sheet: LoadedSheet): void {
		clearContent();
		baseTexture = new Texture({ source: Texture.from(sheet.image).source });
		for (const layer of resolveBadgerStageParallaxFrames(sheet)) {
			const texture = new Texture({
				source: baseTexture.source,
				frame: new Rectangle(
					layer.frame.sourceX,
					layer.frame.sourceY,
					layer.frame.frameWidth,
					layer.frame.frameHeight
				),
			});
			const left = new Sprite(texture);
			const right = new Sprite(texture);
			for (const sprite of [left, right]) {
				sprite.width = options.width;
				sprite.height = options.height;
				sprite.alpha = layer.alpha;
				sprite.label = `badger-native-parallax:${layer.animation}`;
				options.container.addChild(sprite);
			}
			stageStrips.push({ speed: layer.speed, left, right, texture });
		}
		options.container.addChild(root);
		mode = 'stage-sheet';
		sheetId = nextSheetId;
		textureBuilds += 1;
		drawShade();
	}

	function buildProcedural(layers: readonly ParallaxLayer[]): void {
		clearContent();
		for (const layer of layers) {
			for (const source of layer.elements) {
				const graphics = new Graphics();
				graphics.rect(0, 0, source.w, source.h);
				graphics.fill({ color: source.color1 });
				graphics.rect(14, 8, 8, 28);
				graphics.fill({ color: source.color2 });
				graphics.y = source.y;
				graphics.label = 'badger-native-procedural-parallax';
				options.container.addChild(graphics);
				proceduralElements.push({ speed: layer.speed, sourceX: source.x, graphics });
			}
		}
		options.container.addChild(root);
		mode = 'procedural';
		sheetId = null;
		drawShade();
	}

	function snapshot(): BadgerPixiParallaxSnapshot {
		return {
			mode,
			sheetId,
			stageStrips: stageStrips.length,
			proceduralElements: proceduralElements.length,
			textureBuilds,
			updates,
		};
	}

	return {
		syncStage(nextSheetId: string, sheet: LoadedSheet, cameraX: number): BadgerPixiParallaxSnapshot {
			if (mode !== 'stage-sheet' || sheetId !== nextSheetId) buildStage(nextSheetId, sheet);
			for (const strip of stageStrips) {
				const offset = resolveBadgerParallaxOffset(cameraX, strip.speed, options.width);
				strip.left.x = offset;
				strip.right.x = offset + options.width;
			}
			updates += 1;
			return snapshot();
		},
		syncProcedural(layers: readonly ParallaxLayer[], cameraX: number): BadgerPixiParallaxSnapshot {
			if (mode !== 'procedural') buildProcedural(layers);
			for (const element of proceduralElements) {
				element.graphics.x = resolveBadgerProceduralParallaxX(
					element.sourceX,
					cameraX,
					element.speed
				);
			}
			updates += 1;
			return snapshot();
		},
		clear(): void {
			clearContent();
			root.clear();
			mode = 'none';
			sheetId = null;
		},
		snapshot,
		destroy(): void {
			clearContent();
			root.removeFromParent();
			root.destroy();
			mode = 'none';
			sheetId = null;
		},
	};
}

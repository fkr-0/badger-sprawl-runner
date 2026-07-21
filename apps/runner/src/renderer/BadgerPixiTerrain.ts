import { type LoadedSheet, sampleSpriteAnimationFrame } from '@badger/sprite-contracts';
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import { resolveArcadeSpriteFrame } from '../../../../vendor/arcade-runtime.mjs';
import type { StagePlatformArt } from '../game/StageArtRegistry';
import type { SpriteRenderer } from './SpriteRenderer';

export interface BadgerTerrainPlatform {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface TerrainNode {
	root: Container;
	base: Graphics;
	tiles: Container;
	mask: Graphics;
	decoration: Sprite;
	tileSprites: Sprite[];
}

export interface BadgerPixiTerrainSnapshot {
	platforms: number;
	tiles: number;
	createdPlatforms: number;
	createdTiles: number;
	textureSources: number;
	textureBytes: number;
	updates: number;
}

function createTerrainNode(container: Container): TerrainNode {
	const root = new Container();
	root.label = 'terrain-platform';
	const base = new Graphics();
	const tiles = new Container();
	const mask = new Graphics();
	const decoration = new Sprite();
	decoration.anchor.set(0, 1);
	root.addChild(base, tiles, decoration, mask);
	tiles.mask = mask;
	container.addChild(root);
	return { root, base, tiles, mask, decoration, tileSprites: [] };
}

export function createBadgerPixiTerrain(options: {
	container: Container;
	width: number;
	maxPlatforms?: number;
}) {
	const nodes: TerrainNode[] = [];
	const baseTextures = new Map<string, Texture>();
	const frameTextures = new Map<string, Texture>();
	const maxPlatforms = options.maxPlatforms ?? 256;
	let createdTiles = 0;
	let textureBytes = 0;
	let updates = 0;
	let latest: BadgerPixiTerrainSnapshot = {
		platforms: 0,
		tiles: 0,
		createdPlatforms: 0,
		createdTiles: 0,
		textureSources: 0,
		textureBytes: 0,
		updates: 0,
	};

	const textureFor = (
		sheet: LoadedSheet,
		animation: string,
		frameIndex: number
	): Texture | null => {
		const frame = resolveArcadeSpriteFrame(sheet.sheet, animation, frameIndex);
		if (!frame) return null;
		let base = baseTextures.get(sheet.sheet.id);
		if (!base) {
			base = Texture.from(sheet.image);
			base.source.scaleMode = 'nearest';
			baseTextures.set(sheet.sheet.id, base);
			textureBytes += sheet.image.width * sheet.image.height * 4;
		}
		const key = `${sheet.sheet.id}:${animation}:${frame.absoluteFrame}`;
		let texture = frameTextures.get(key);
		if (!texture) {
			texture = new Texture({
				source: base.source,
				frame: new Rectangle(frame.sourceX, frame.sourceY, frame.frameWidth, frame.frameHeight),
			});
			frameTextures.set(key, texture);
		}
		return texture;
	};

	const ensureNode = (index: number): TerrainNode | null => {
		if (index >= maxPlatforms) return null;
		while (nodes.length <= index) nodes.push(createTerrainNode(options.container));
		return nodes[index] ?? null;
	};

	const ensureTiles = (node: TerrainNode, count: number): void => {
		while (node.tileSprites.length < count) {
			const sprite = new Sprite();
			sprite.anchor.set(0, 0);
			node.tiles.addChild(sprite);
			node.tileSprites.push(sprite);
			createdTiles += 1;
		}
		for (let index = 0; index < node.tileSprites.length; index += 1) {
			const sprite = node.tileSprites[index];
			if (sprite) sprite.visible = index < count;
		}
	};

	return {
		sync(
			platforms: readonly BadgerTerrainPlatform[],
			cameraX: number,
			art: StagePlatformArt | undefined,
			sprites: SpriteRenderer,
			timeMs = performance.now()
		): BadgerPixiTerrainSnapshot {
			let visiblePlatforms = 0;
			let visibleTiles = 0;
			const sheet = art ? sprites.getSheet(art.sheetId) : undefined;
			const tileSize = sheet?.sheet.frameSize[0] ?? 32;

			for (const [platformIndex, platform] of platforms.entries()) {
				const node = ensureNode(platformIndex);
				if (!node) break;
				const screenX = platform.x - cameraX;
				const visible = screenX + platform.w >= 0 && screenX <= options.width;
				node.root.visible = visible;
				if (!visible) continue;
				visiblePlatforms += 1;
				node.root.position.set(screenX, platform.y);
				node.base.clear();
				node.base.rect(0, 0, platform.w, platform.h).fill({ color: '#272b32' });
				node.mask.clear().rect(0, 0, platform.w, platform.h).fill({ color: '#ffffff' });

				if (art && sheet) {
					const firstColumn = Math.max(0, Math.floor(-screenX / tileSize));
					const lastColumn = Math.ceil(
						(Math.min(options.width, screenX + platform.w) - screenX) / tileSize
					);
					const rows = Math.max(1, Math.ceil(platform.h / tileSize));
					const columns = Math.max(0, lastColumn - firstColumn);
					const count = rows * columns;
					ensureTiles(node, count);
					let tileIndex = 0;
					for (let row = 0; row < rows; row += 1) {
						const animationName = row === 0 ? art.surfaceAnimation : art.bodyAnimation;
						const frame = sheet.sheet.animations[animationName]
							? sampleSpriteAnimationFrame(sheet.sheet, animationName, timeMs / 1000, {
									mode: 'loop',
								})
							: 0;
						for (let column = firstColumn; column < lastColumn; column += 1) {
							const sprite = node.tileSprites[tileIndex++];
							const texture = sprite ? textureFor(sheet, animationName, frame) : null;
							if (!sprite || !texture) continue;
							sprite.texture = texture;
							sprite.position.set(column * tileSize, row * tileSize);
							sprite.visible = true;
						}
					}
					visibleTiles += count;

					const decorationName = art.decorations[platformIndex % art.decorations.length];
					if (platform.w >= tileSize * 3 && decorationName) {
						const frame = sheet.sheet.animations[decorationName]
							? sampleSpriteAnimationFrame(sheet.sheet, decorationName, timeMs / 1000, {
									mode: 'loop',
								})
							: 0;
						const texture = textureFor(sheet, decorationName, frame);
						if (texture) {
							node.decoration.texture = texture;
							node.decoration.position.set(
								Math.min(platform.w - tileSize, tileSize * (1 + (platformIndex % 3))),
								0
							);
							node.decoration.visible = true;
						} else node.decoration.visible = false;
					} else node.decoration.visible = false;
				} else {
					ensureTiles(node, 0);
					node.decoration.visible = false;
					node.base.rect(0, 0, platform.w, 4).fill({ color: '#364457' });
					for (let stripeX = 10; stripeX < platform.w - 10; stripeX += 24) {
						node.base.rect(stripeX, platform.h - 8, 12, 4).fill({ color: '#ffb35e' });
						node.base.rect(stripeX + 12, platform.h - 4, 12, 4).fill({ color: '#ffb35e' });
					}
				}
			}

			for (let index = platforms.length; index < nodes.length; index += 1) {
				const node = nodes[index];
				if (node) node.root.visible = false;
			}
			updates += 1;
			latest = {
				platforms: visiblePlatforms,
				tiles: visibleTiles,
				createdPlatforms: nodes.length,
				createdTiles,
				textureSources: baseTextures.size,
				textureBytes,
				updates,
			};
			return latest;
		},
		snapshot: () => ({ ...latest }),
		destroy(): void {
			for (const node of nodes) node.root.destroy({ children: true });
			for (const texture of frameTextures.values()) texture.destroy(false);
			for (const texture of baseTextures.values()) texture.destroy(true);
			nodes.length = 0;
			frameTextures.clear();
			baseTextures.clear();
		},
	};
}

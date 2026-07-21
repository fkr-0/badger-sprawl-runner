import { type LoadedSheet, sampleSpriteAnimationFrame } from '@badger/sprite-contracts';
import { Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import {
	createPixiFramePool,
	resolveArcadeSpriteFrame,
} from '../../../../vendor/arcade-runtime.mjs';
import type { Player } from '../actors/MossBadger';
import type { CombatEntity } from '../systems/CombatSystem';
import type { SpriteRenderer } from './SpriteRenderer';

interface ActorNodeParts {
	sprite: Sprite;
	fallback: Graphics;
}

interface ActorPayload {
	id: string;
	sheet: LoadedSheet | null;
	animation: string;
	frame: number;
	x: number;
	y: number;
	width: number;
	height: number;
	flipX: boolean;
	scaleX: number;
	scaleY: number;
	alpha: number;
	fallbackColor: string;
}

export interface BadgerPixiActorSnapshot {
	actors: number;
	created: number;
	capacity: number;
	dropped: number;
	textureSources: number;
	textureBytes: number;
}

function createActorNode(parts: WeakMap<Container, ActorNodeParts>): Container {
	const root = new Container();
	const sprite = new Sprite();
	const fallback = new Graphics();
	root.addChild(sprite, fallback);
	parts.set(root, { sprite, fallback });
	return root;
}

export function createBadgerPixiActors(options: {
	container: Container;
	maxActors?: number;
}) {
	const parts = new WeakMap<Container, ActorNodeParts>();
	const baseTextures = new Map<string, Texture>();
	const frameTextures = new Map<string, Texture>();
	let textureBytes = 0;

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

	const pool = createPixiFramePool<Container, ActorPayload>({
		container: options.container,
		maxCapacity: options.maxActors ?? 160,
		createSprite: () => createActorNode(parts),
		activate(root, payload) {
			const node = parts.get(root);
			if (!node) return;
			root.label = `actor:${payload.id}`;
			root.position.set(payload.x, payload.y);
			root.alpha = payload.alpha;
			const texture = payload.sheet
				? textureFor(payload.sheet, payload.animation, payload.frame)
				: null;
			if (texture) {
				node.sprite.texture = texture;
				node.sprite.anchor.set(0.5, 1);
				node.sprite.scale.set(payload.flipX ? -payload.scaleX : payload.scaleX, payload.scaleY);
				node.sprite.visible = true;
				node.fallback.visible = false;
			} else {
				node.sprite.visible = false;
				node.fallback.clear();
				node.fallback.rect(-payload.width / 2, -payload.height, payload.width, payload.height);
				node.fallback.fill({ color: payload.fallbackColor });
				node.fallback.visible = true;
			}
		},
		deactivate(root) {
			const node = parts.get(root);
			if (node) {
				node.sprite.visible = false;
				node.fallback.clear();
			}
		},
	});

	function playerPayload(player: Player, cameraX: number, sprites: SpriteRenderer): ActorPayload {
		return {
			id: 'player',
			sheet: sprites.getSheet('moss_badger_production') ?? null,
			animation: player.animState?.currentAnim ?? 'idle',
			frame: player.animState?.frame ?? 0,
			x: player.x - cameraX + player.w / 2,
			y: player.y + player.h,
			width: player.w,
			height: player.h,
			flipX: player.dir < 0,
			scaleX: player.scaleX ?? 1,
			scaleY: player.scaleY ?? 1,
			alpha: player.invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0 ? 0.46 : 1,
			fallbackColor: '#272b32',
		};
	}

	function enemyPayload(
		enemy: CombatEntity,
		cameraX: number,
		sprites: SpriteRenderer
	): ActorPayload {
		const sheetId = enemy.bossSpriteSheetId ?? enemy.spriteSheetId;
		const sheet = sheetId ? (sprites.getSheet(sheetId) ?? null) : null;
		const animation = enemy.bossSpriteSheetId
			? (enemy.bossAnimation ?? 'idle')
			: enemy.hp <= 0
				? 'death'
				: (enemy.spriteAnimation ?? 'idle');
		const frame = sheet?.sheet.animations[animation]
			? sampleSpriteAnimationFrame(sheet.sheet, animation, performance.now() / 1000, {
					mode: 'loop',
				})
			: 0;
		const frameHeight = sheet?.sheet.frameSize[1] ?? enemy.h;
		const bossScale = enemy.bossSpriteSheetId ? Math.min(1, 78 / frameHeight) : 1;
		return {
			id: enemy.id ?? `${enemy.x}:${enemy.y}`,
			sheet,
			animation,
			frame,
			x: enemy.x - cameraX + enemy.w / 2,
			y: enemy.y + enemy.h,
			width: enemy.w,
			height: enemy.h,
			flipX: enemy.dir < 0,
			scaleX: bossScale,
			scaleY: bossScale,
			alpha: enemy.hp <= 0 ? 0.72 : enemy.invuln > 0 ? 0.46 : 1,
			fallbackColor:
				enemy.procgenRole === 'bruiser'
					? '#3b2638'
					: enemy.procgenRole === 'turret'
						? '#202b3c'
						: '#1a1d26',
		};
	}

	return {
		beginFrame() {
			return pool.beginFrame();
		},
		syncPlayer(player: Player, cameraX: number, sprites: SpriteRenderer) {
			return pool.acquire(playerPayload(player, cameraX, sprites));
		},
		syncEnemies(enemies: readonly CombatEntity[], cameraX: number, sprites: SpriteRenderer) {
			for (const enemy of enemies) pool.acquire(enemyPayload(enemy, cameraX, sprites));
		},
		endFrame(): BadgerPixiActorSnapshot {
			const snapshot = pool.endFrame();
			return {
				actors: snapshot.active,
				created: snapshot.created,
				capacity: snapshot.capacity,
				dropped: snapshot.frameDropped,
				textureSources: baseTextures.size,
				textureBytes,
			};
		},
		snapshot(): BadgerPixiActorSnapshot {
			const snapshot = pool.snapshot();
			return {
				actors: snapshot.active,
				created: snapshot.created,
				capacity: snapshot.capacity,
				dropped: snapshot.frameDropped,
				textureSources: baseTextures.size,
				textureBytes,
			};
		},
		destroy() {
			pool.destroy();
			for (const texture of frameTextures.values()) texture.destroy(false);
			for (const texture of baseTextures.values()) texture.destroy(false);
			frameTextures.clear();
			baseTextures.clear();
		},
	};
}

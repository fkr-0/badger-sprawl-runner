import { type Container, Graphics } from 'pixi.js';
import type { Player } from '../actors/MossBadger';

export interface BadgerPixiProjectileSnapshot {
	active: number;
	railgunAlpha: number;
}

export function createBadgerPixiProjectiles(options: { container: Container }) {
	const railgun = new Graphics();
	railgun.label = 'badger-native-railgun';
	options.container.addChild(railgun);
	let snapshot: BadgerPixiProjectileSnapshot = { active: 0, railgunAlpha: 0 };

	return {
		sync(player: Player, cameraX: number): BadgerPixiProjectileSnapshot {
			railgun.clear();
			const flash = player.railgunFlash ?? 0;
			if (flash <= 0) {
				railgun.visible = false;
				snapshot = { active: 0, railgunAlpha: 0 };
				return snapshot;
			}
			const startX = player.x + (player.dir > 0 ? player.w : 0) - cameraX;
			const endX = startX + player.dir * 560;
			const y = player.y + 23;
			const alpha = Math.min(1, flash / 0.08);
			railgun.moveTo(startX, y).lineTo(endX, y).stroke({ color: '#eaf2ff', width: 8, alpha });
			railgun.moveTo(startX, y).lineTo(endX, y).stroke({ color: '#67f3c4', width: 3, alpha });
			railgun.visible = true;
			snapshot = { active: 1, railgunAlpha: alpha };
			return snapshot;
		},
		snapshot: () => snapshot,
		destroy() {
			railgun.removeFromParent();
			railgun.destroy();
		},
	};
}

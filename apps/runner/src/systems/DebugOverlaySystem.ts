/**
 * DebugOverlaySystem - renders hitboxes, hurtboxes, frame data
 */

import type { Entity } from '../systems/PhysicsSystem';
import type { Camera } from '../systems/CameraSystem';

export class DebugOverlaySystem {
	render(ctx: CanvasRenderingContext2D, entities: Entity[], camera: Camera): void {
		const camX = camera.x;

		ctx.save();
		ctx.translate(-camX, 0);

		for (const entity of entities) {
			// Hurtbox (blue)
			ctx.strokeStyle = 'rgba(103, 243, 196, 0.8)';
			ctx.lineWidth = 2;
			ctx.strokeRect(entity.x, entity.y, entity.w, entity.h);

			// Hitbox (red) - would be part of CombatEntity
			ctx.strokeStyle = 'rgba(255, 94, 122, 0.8)';
			ctx.strokeRect(entity.x + entity.w / 2 - 21, entity.y + 8, 42, 28);
		}

		ctx.restore();
	}
}

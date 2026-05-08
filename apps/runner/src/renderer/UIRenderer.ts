/**
 * UIRenderer - renders HUD elements (HP bar, fuel, heat, reload ring)
 */

import type { Camera } from '../systems/CameraSystem';
import type { Player } from '../actors/MossBadger';

export class UIRenderer {
	render(ctx: CanvasRenderingContext2D, player: Player, camera: Camera): void {
		// HUD background
		ctx.fillStyle = 'rgba(4, 6, 12, 0.72)';
		ctx.fillRect(16, 16, 450, 74);

		// HP display
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '16px ui-monospace, monospace';
		ctx.fillText(`HP ${'♥'.repeat(player.hp)}${'·'.repeat(player.maxHp - player.hp)}`, 30, 42);

		// Fuel
		ctx.fillText(
			`Fuel ${player.hasRocket ? `${player.fuel.toFixed(1)}/${player.maxFuel}` : 'no pack'}`,
			30,
			67
		);
	}
}

/**
 * UIRenderer - renders HUD elements (HP bar, fuel, heat, reload ring, item icons)
 */

import type { Camera } from '../systems/CameraSystem';
import type { Player } from '../actors/MossBadger';
import type { SpriteRenderer } from './SpriteRenderer';

interface HudIconSlot {
	animation: string;
	label: string;
	active: boolean;
	count?: number;
}

const HUD_ICON_SHEET = 'item_icons';
const HUD_ICON_SIZE = 32;
const HUD_ICON_GAP = 10;

export class UIRenderer {
	render(
		ctx: CanvasRenderingContext2D,
		player: Player,
		camera: Camera,
		spriteRenderer?: SpriteRenderer
	): void {
		// HUD background
		ctx.fillStyle = 'rgba(4, 6, 12, 0.72)';
		ctx.fillRect(16, 16, 560, 112);

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

		this.renderItemIcons(ctx, player, spriteRenderer, 30, 84);
		this.renderCompanionStatus(ctx, player, 214, 84);
	}

	private renderItemIcons(
		ctx: CanvasRenderingContext2D,
		player: Player,
		spriteRenderer: SpriteRenderer | undefined,
		x: number,
		y: number
	): void {
		const slots = this.getHudIconSlots(player);
		ctx.font = '12px ui-monospace, monospace';

		for (const [index, slot] of slots.entries()) {
			const slotX = x + index * (HUD_ICON_SIZE + HUD_ICON_GAP);
			this.renderIconSlot(ctx, spriteRenderer, slot, slotX, y);
		}
	}

	private renderIconSlot(
		ctx: CanvasRenderingContext2D,
		spriteRenderer: SpriteRenderer | undefined,
		slot: HudIconSlot,
		x: number,
		y: number
	): void {
		ctx.save();
		ctx.globalAlpha = slot.active ? 1 : 0.35;
		ctx.fillStyle = slot.active ? 'rgba(103, 243, 196, 0.18)' : 'rgba(234, 242, 255, 0.08)';
		ctx.fillRect(x - 2, y - 2, HUD_ICON_SIZE + 4, HUD_ICON_SIZE + 4);

		if (spriteRenderer?.hasSheet(HUD_ICON_SHEET)) {
			spriteRenderer.drawFrame(HUD_ICON_SHEET, slot.animation, 0, x, y);
		} else {
			ctx.fillStyle = '#1a1d26';
			ctx.fillRect(x, y, HUD_ICON_SIZE, HUD_ICON_SIZE);
			ctx.fillStyle = slot.active ? '#67f3c4' : '#7a8194';
			ctx.fillText(slot.label.slice(0, 3).toUpperCase(), x + 4, y + 20);
		}

		if (slot.count !== undefined && slot.count > 0) {
			ctx.globalAlpha = 1;
			ctx.fillStyle = '#080a12';
			ctx.fillRect(x + 18, y + 19, 16, 14);
			ctx.fillStyle = '#eaf2ff';
			ctx.fillText(String(slot.count), x + 22, y + 30);
		}

		ctx.restore();
	}


	private renderCompanionStatus(ctx: CanvasRenderingContext2D, player: Player, x: number, y: number): void {
		ctx.font = '12px ui-monospace, monospace';
		ctx.fillStyle = '#67f3c4';
		ctx.fillText(`Naya shield ${Math.floor(player.companionShield ?? 0)}`, x, y + 10);
		if (player.rookOverlayActive) {
			ctx.fillStyle = '#ffb35e';
			ctx.fillText('Rook overlay active', x, y + 27);
		}
		if (player.companionHint) {
			ctx.fillStyle = '#92a4be';
			ctx.fillText(player.companionHint.slice(0, 52), x, y + 44);
		}
	}

	private getHudIconSlots(player: Player): HudIconSlot[] {
		return [
			{
				animation: 'rocket_backpack_icon',
				label: 'rocket',
				active: player.hasRocket,
			},
			{
				animation: 'railgun_icon',
				label: 'railgun',
				active: player.hasRailgun,
			},
			{
				animation: 'katana_icon',
				label: 'katana',
				active: player.hasKatana,
			},
			{
				animation: 'stim_pack_icon',
				label: 'stim',
				active: player.stims > 0,
				count: player.stims,
			},
		];
	}
}

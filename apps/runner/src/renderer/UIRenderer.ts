/**
 * Compact gameplay HUD focused on health, actions, immediate objectives and combat readability.
 */

import type { Player } from '../actors/MossBadger';
import type { Camera } from '../systems/CameraSystem';
import type { SpriteRenderer } from './SpriteRenderer';

interface HudIconSlot {
	animation: string;
	label: string;
	key: string;
	active: boolean;
	count?: number;
	cooldown?: number;
	cooldownMax?: number;
}

const HUD_ICON_SHEET = 'item_icons';
const HUD_ICON_SIZE = 32;
const HUD_ICON_GAP = 9;
const PANEL = 'rgba(4, 6, 12, 0.82)';
const PANEL_STRONG = 'rgba(4, 6, 12, 0.92)';
const TEXT = '#eaf2ff';
const MUTED = '#92a4be';
const MINT = '#67f3c4';
const AMBER = '#ffb35e';
const DANGER = '#ff5e7a';

export class UIRenderer {
	render(
		ctx: CanvasRenderingContext2D,
		player: Player,
		camera: Camera,
		spriteRenderer?: SpriteRenderer
	): void {
		void camera;
		this.renderScreenFeedback(ctx, player);
		this.renderVitals(ctx, player, spriteRenderer);
		this.renderCompanionStatus(ctx, player, 432, 18);
		this.renderObjective(ctx, player);
		this.renderCombatReadout(ctx, player);
		this.renderToast(ctx, player);
		this.renderContextHint(ctx, player);
	}

	private renderScreenFeedback(ctx: CanvasRenderingContext2D, player: Player): void {
		const healthRatio = player.maxHp > 0 ? player.hp / player.maxHp : 0;
		const damageAlpha = Math.min(0.34, player.damageFlash ?? 0);
		const lowHealthAlpha =
			healthRatio <= 0.4 ? 0.08 + Math.sin(performance.now() / 180) * 0.025 : 0;
		if (damageAlpha > 0 || lowHealthAlpha > 0) {
			const gradient = ctx.createRadialGradient(
				ctx.canvas.width / 2,
				ctx.canvas.height / 2,
				ctx.canvas.height * 0.2,
				ctx.canvas.width / 2,
				ctx.canvas.height / 2,
				ctx.canvas.width * 0.72
			);
			gradient.addColorStop(0, 'rgba(255, 94, 122, 0)');
			gradient.addColorStop(1, `rgba(255, 50, 82, ${damageAlpha + lowHealthAlpha})`);
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		}
		if ((player.healFlash ?? 0) > 0) {
			ctx.fillStyle = `rgba(103, 243, 196, ${Math.min(0.14, player.healFlash ?? 0)})`;
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		}
	}

	private renderVitals(
		ctx: CanvasRenderingContext2D,
		player: Player,
		spriteRenderer: SpriteRenderer | undefined
	): void {
		const x = 18;
		const y = 18;
		const width = 404;
		const height = 102;
		ctx.save();
		ctx.fillStyle = PANEL;
		ctx.fillRect(x, y, width, height);
		ctx.fillStyle = MINT;
		ctx.fillRect(x, y, 5, height);
		ctx.textAlign = 'left';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = MUTED;
		ctx.fillText('MOSS // FIELD STATUS', x + 16, y + 16);

		this.renderHealthBar(ctx, player, x + 16, y + 26, 188, 18);
		this.renderFuelBar(ctx, player, x + 16, y + 52, 188, 10);
		this.renderItemIcons(ctx, player, spriteRenderer, x + 222, y + 27);

		ctx.font = '10px ui-monospace, monospace';
		ctx.fillStyle = MUTED;
		ctx.fillText(
			`CHECKPOINT // ${(player.checkpointLabel ?? 'SPRAWL ENTRY').toUpperCase()}`,
			x + 16,
			y + 84
		);
		ctx.restore();
	}

	private renderHealthBar(
		ctx: CanvasRenderingContext2D,
		player: Player,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		const gap = 4;
		const segmentWidth = (width - gap * (player.maxHp - 1)) / player.maxHp;
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = TEXT;
		ctx.fillText('INTEGRITY', x, y - 5);
		for (let index = 0; index < player.maxHp; index += 1) {
			const segmentX = x + index * (segmentWidth + gap);
			ctx.fillStyle = index < Math.ceil(player.hp) ? (player.hp <= 2 ? DANGER : MINT) : '#202633';
			ctx.fillRect(segmentX, y, segmentWidth, height);
			ctx.fillStyle = 'rgba(255,255,255,0.12)';
			ctx.fillRect(segmentX, y, segmentWidth, 2);
		}
	}

	private renderFuelBar(
		ctx: CanvasRenderingContext2D,
		player: Player,
		x: number,
		y: number,
		width: number,
		height: number
	): void {
		ctx.font = '700 9px ui-monospace, monospace';
		ctx.fillStyle = player.hasRocket ? AMBER : MUTED;
		ctx.fillText(
			player.hasRocket ? `ROCKET ${player.fuel.toFixed(1)}/${player.maxFuel}` : 'ROCKET // OFFLINE',
			x,
			y - 4
		);
		ctx.fillStyle = '#202633';
		ctx.fillRect(x, y, width, height);
		if (player.hasRocket && player.maxFuel > 0) {
			const ratio = Math.max(0, Math.min(1, player.fuel / player.maxFuel));
			ctx.fillStyle = AMBER;
			ctx.fillRect(x, y, width * ratio, height);
		}
	}

	private renderItemIcons(
		ctx: CanvasRenderingContext2D,
		player: Player,
		spriteRenderer: SpriteRenderer | undefined,
		x: number,
		y: number
	): void {
		const slots = this.getHudIconSlots(player);
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
		ctx.globalAlpha = slot.active ? 1 : 0.3;
		ctx.fillStyle = slot.active ? 'rgba(103, 243, 196, 0.14)' : 'rgba(234, 242, 255, 0.06)';
		ctx.fillRect(x - 2, y - 2, HUD_ICON_SIZE + 4, HUD_ICON_SIZE + 4);
		ctx.strokeStyle = slot.active ? MINT : '#364457';
		ctx.strokeRect(x - 2, y - 2, HUD_ICON_SIZE + 4, HUD_ICON_SIZE + 4);

		if (spriteRenderer?.hasSheet(HUD_ICON_SHEET)) {
			spriteRenderer.drawFrame(HUD_ICON_SHEET, slot.animation, 0, x, y);
		} else {
			ctx.fillStyle = '#1a1d26';
			ctx.fillRect(x, y, HUD_ICON_SIZE, HUD_ICON_SIZE);
			ctx.fillStyle = slot.active ? MINT : '#7a8194';
			ctx.font = '10px ui-monospace, monospace';
			ctx.fillText(slot.label.slice(0, 3).toUpperCase(), x + 5, y + 20);
		}

		const ratio =
			slot.cooldownMax && slot.cooldown ? Math.min(1, slot.cooldown / slot.cooldownMax) : 0;
		if (ratio > 0) {
			ctx.globalAlpha = 0.72;
			ctx.fillStyle = '#080a12';
			ctx.fillRect(x, y, HUD_ICON_SIZE, HUD_ICON_SIZE * ratio);
		}
		ctx.globalAlpha = 1;
		ctx.fillStyle = PANEL_STRONG;
		ctx.fillRect(x - 2, y + HUD_ICON_SIZE + 3, 16, 13);
		ctx.fillStyle = TEXT;
		ctx.font = '700 9px ui-monospace, monospace';
		ctx.fillText(slot.key, x + 2, y + HUD_ICON_SIZE + 13);

		if (slot.count !== undefined && slot.count > 0) {
			ctx.fillStyle = PANEL_STRONG;
			ctx.fillRect(x + 19, y + 19, 15, 14);
			ctx.fillStyle = TEXT;
			ctx.fillText(String(slot.count), x + 23, y + 30);
		}
		ctx.restore();
	}

	private renderCompanionStatus(
		ctx: CanvasRenderingContext2D,
		player: Player,
		x: number,
		y: number
	): void {
		const lines: Array<{ text: string; color: string }> = [];
		if ((player.companionShield ?? 0) > 0) {
			lines.push({ text: `Naya shield ${Math.floor(player.companionShield ?? 0)}`, color: MINT });
		}
		if (player.rookOverlayActive) {
			lines.push({ text: 'Rook overlay active', color: AMBER });
		}
		if (player.companionHint) {
			lines.push({ text: player.companionHint.slice(0, 28), color: MUTED });
		}
		if (lines.length === 0) return;

		const width = 154;
		const height = 12 + lines.length * 16;
		ctx.save();
		ctx.fillStyle = PANEL;
		ctx.fillRect(x, y, width, height);
		ctx.font = '700 9px ui-monospace, monospace';
		ctx.textAlign = 'left';
		for (const [index, line] of lines.entries()) {
			ctx.fillStyle = line.color;
			ctx.fillText(line.text.toUpperCase(), x + 9, y + 15 + index * 16);
		}
		ctx.restore();
	}

	private renderObjective(ctx: CanvasRenderingContext2D, player: Player): void {
		if (!player.objectiveHint && !player.loadoutHint) return;
		const width = 330;
		const x = ctx.canvas.width - width - 18;
		const y = 18;
		ctx.save();
		ctx.fillStyle = PANEL;
		ctx.fillRect(x, y, width, 64);
		ctx.fillStyle = AMBER;
		ctx.fillRect(x + width - 4, y, 4, 64);
		ctx.textAlign = 'left';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillStyle = MUTED;
		ctx.fillText('CURRENT ROUTE', x + 14, y + 17);
		ctx.font = '700 13px ui-monospace, monospace';
		ctx.fillStyle = TEXT;
		ctx.fillText((player.objectiveHint ?? '').slice(0, 39), x + 14, y + 37);
		ctx.font = '10px ui-monospace, monospace';
		ctx.fillStyle = MINT;
		ctx.fillText((player.loadoutHint ?? '').slice(0, 48), x + 14, y + 54);
		ctx.restore();
	}

	private renderCombatReadout(ctx: CanvasRenderingContext2D, player: Player): void {
		if ((player.comboCount ?? 0) <= 0 && !player.bossPhaseHint && !player.rookOverlayActive) return;
		ctx.save();
		ctx.textAlign = 'center';
		if ((player.comboCount ?? 0) > 0) {
			const x = ctx.canvas.width / 2;
			ctx.fillStyle = PANEL_STRONG;
			ctx.fillRect(x - 66, 18, 132, 48);
			ctx.fillStyle = AMBER;
			ctx.font = '900 22px ui-monospace, monospace';
			ctx.fillText(`CHAIN ×${player.comboCount}`, x, 47);
		}
		if (player.bossPhaseHint) {
			ctx.fillStyle = PANEL_STRONG;
			ctx.fillRect(ctx.canvas.width / 2 - 190, 72, 380, 28);
			ctx.fillStyle = DANGER;
			ctx.font = '700 11px ui-monospace, monospace';
			ctx.fillText(player.bossPhaseHint.slice(0, 54).toUpperCase(), ctx.canvas.width / 2, 90);
		}
		ctx.restore();
	}

	private renderToast(ctx: CanvasRenderingContext2D, player: Player): void {
		if (!player.hudToast || (player.hudToastTimer ?? 0) <= 0) return;
		const alpha = Math.min(1, (player.hudToastTimer ?? 0) * 2);
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.textAlign = 'center';
		ctx.font = '700 14px ui-monospace, monospace';
		const width = Math.min(520, Math.max(220, ctx.measureText(player.hudToast).width + 48));
		const x = ctx.canvas.width / 2 - width / 2;
		const y = 112;
		ctx.fillStyle = PANEL_STRONG;
		ctx.fillRect(x, y, width, 34);
		ctx.fillStyle = MINT;
		ctx.fillRect(x, y + 31, width, 3);
		ctx.fillStyle = TEXT;
		ctx.fillText(player.hudToast.toUpperCase(), ctx.canvas.width / 2, y + 22);
		ctx.restore();
	}

	private renderContextHint(ctx: CanvasRenderingContext2D, player: Player): void {
		if (!player.contextHint) return;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '700 12px ui-monospace, monospace';
		const width = Math.min(440, Math.max(180, ctx.measureText(player.contextHint).width + 38));
		const x = ctx.canvas.width / 2 - width / 2;
		const y = ctx.canvas.height - 46;
		ctx.fillStyle = PANEL_STRONG;
		ctx.fillRect(x, y, width, 28);
		ctx.strokeStyle = AMBER;
		ctx.strokeRect(x, y, width, 28);
		ctx.fillStyle = TEXT;
		ctx.fillText(player.contextHint.toUpperCase(), ctx.canvas.width / 2, y + 19);
		ctx.restore();
	}

	private getHudIconSlots(player: Player): HudIconSlot[] {
		return [
			{
				animation: 'rocket_backpack_icon',
				label: 'rocket',
				key: 'E',
				active: player.hasRocket,
				cooldown: player.boostCd,
				cooldownMax: 0.35,
			},
			{
				animation: 'railgun_icon',
				label: 'railgun',
				key: 'K',
				active: player.hasRailgun,
				cooldown: player.shootCd,
				cooldownMax: 0.72,
			},
			{
				animation: player.hasKatana ? 'katana_icon' : 'claws_icon',
				label: player.hasKatana ? 'katana' : 'claws',
				key: 'J',
				active: true,
				cooldown: player.meleeTimer,
				cooldownMax: player.hasKatana ? 0.28 : 0.18,
			},
			{
				animation: 'stim_pack_icon',
				label: 'stim',
				key: 'E',
				active: player.stims > 0,
				count: player.stims,
			},
		];
	}
}

/**
 * Compact gameplay HUD focused on health, actions, immediate objectives and combat readability.
 */

import type { Player } from '../actors/MossBadger';
import type { Camera } from '../systems/CameraSystem';
import { BADGER_UI, drawArcadePanel } from '../ui/ArcadeUi';
import { buildGameplayHudLayout } from './GameplayHudLayout';
import type { SpriteRenderer } from './SpriteRenderer';
import { resolveHudGauge } from '@arcade/runtime/ui';

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
const HUD_ICON_SOURCE_SIZE = 32;
const HUD_ICON_SIZE = 24;
const HUD_ICON_SCALE = HUD_ICON_SIZE / HUD_ICON_SOURCE_SIZE;
const HUD_ICON_GAP = 7;
const PANEL_STRONG = BADGER_UI.panelStrong;
const TEXT = BADGER_UI.text;
const MUTED = BADGER_UI.muted;
const MINT = BADGER_UI.accent;
const AMBER = BADGER_UI.warning;
const DANGER = BADGER_UI.danger;

export class UIRenderer {
	render(
		ctx: CanvasRenderingContext2D,
		player: Player,
		camera: Camera,
		spriteRenderer?: SpriteRenderer,
		options: { renderVitals?: boolean } = {}
	): void {
		void camera;
		const companionLines = this.getCompanionLines(player);
		const layout = buildGameplayHudLayout(
			ctx.canvas.width,
			ctx.canvas.height,
			companionLines.length,
			(player.gearIconSlots ?? []).length
		);
		this.renderScreenFeedback(ctx, player);
		if (options.renderVitals !== false) {
			this.renderVitals(ctx, player, spriteRenderer, layout.vitals);
		}
		this.renderCompanionStatus(ctx, companionLines, layout.companions);
		this.renderObjective(ctx, player, layout.objective);
		this.renderGearLoadout(ctx, player, spriteRenderer, layout.gear);
		this.renderCombatReadout(ctx, player, layout.combat);
		this.renderToast(ctx, player, layout.toast);
		this.renderContextHint(ctx, player, layout.context);
	}

	private renderGearLoadout(
		ctx: CanvasRenderingContext2D,
		player: Player,
		spriteRenderer: SpriteRenderer | undefined,
		rect: { x: number; y: number; width: number; height: number }
	): void {
		const slots = player.gearIconSlots ?? [];
		if (slots.length === 0) return;
		const gap = 7;
		const { x, y, width, height } = rect;
		ctx.save();
		drawArcadePanel(ctx, { x, y, width, height, label: 'Equipped' });
		for (const [index, slot] of slots.entries()) {
			const iconX = x + 9 + index * (HUD_ICON_SIZE + gap);
			const iconY = y + 15;
			ctx.fillStyle = 'rgba(103, 243, 196, 0.1)';
			ctx.fillRect(iconX - 1, iconY - 1, HUD_ICON_SIZE + 2, HUD_ICON_SIZE + 2);
			ctx.strokeStyle = MINT;
			ctx.strokeRect(iconX - 1, iconY - 1, HUD_ICON_SIZE + 2, HUD_ICON_SIZE + 2);
			if (spriteRenderer?.hasSheet(slot.sheetId)) {
				spriteRenderer.drawFrame(
					slot.sheetId,
					slot.animation,
					0,
					iconX,
					iconY,
					false,
					HUD_ICON_SCALE,
					HUD_ICON_SCALE
				);
			} else {
				ctx.fillStyle = '#1a1d26';
				ctx.fillRect(iconX, iconY, HUD_ICON_SIZE, HUD_ICON_SIZE);
				ctx.fillStyle = TEXT;
				ctx.font = '8px ui-monospace, monospace';
				ctx.fillText(slot.label.slice(0, 3).toUpperCase(), iconX + 3, iconY + 16);
			}
		}
		ctx.restore();
	}

	private renderScreenFeedback(ctx: CanvasRenderingContext2D, player: Player): void {
		const health = resolveHudGauge({
			value: player.hp,
			max: player.maxHp,
			lowThreshold: 0.4,
			criticalThreshold: 0.2,
			time: performance.now() / 1000,
			pulsePeriod: 0.36,
		});
		const damageAlpha = Math.min(0.34, player.damageFlash ?? 0);
		const lowHealthAlpha = health.warning ? 0.12 * health.pulse : 0;
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
		spriteRenderer: SpriteRenderer | undefined,
		rect: { x: number; y: number; width: number; height: number }
	): void {
		const { x, y, width, height } = rect;
		ctx.save();
		drawArcadePanel(ctx, { x, y, width, height, label: 'Moss // integrity' });
		ctx.textAlign = 'left';

		this.renderHealthBar(ctx, player, x + 14, y + 29, 150, 12);
		this.renderFuelBar(ctx, player, x + 14, y + 50, 150, 7);
		this.renderItemIcons(ctx, player, spriteRenderer, x + 184, y + 27);

		ctx.font = '9px ui-monospace, monospace';
		ctx.fillStyle = MUTED;
		ctx.fillText(
			`CHECKPOINT // ${(player.checkpointLabel ?? 'SPRAWL ENTRY').toUpperCase()}`,
			x + 14,
			y + 68
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
		const gauge = resolveHudGauge({
			value: player.hp,
			max: player.maxHp,
			segments: player.maxHp,
			lowThreshold: 0.4,
			criticalThreshold: 0.2,
		});
		for (const segment of gauge.segments) {
			const index = segment.index;
			const segmentX = x + index * (segmentWidth + gap);
			ctx.fillStyle = '#202633';
			ctx.fillRect(segmentX, y, segmentWidth, height);
			if (segment.fill > 0) {
				ctx.fillStyle = gauge.warning ? DANGER : MINT;
				ctx.fillRect(segmentX, y, segmentWidth * segment.fill, height);
			}
			ctx.fillStyle = 'rgba(255,255,255,0.12)';
			ctx.fillRect(segmentX, y, segmentWidth * Math.max(segment.fill, 0.08), 2);
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
		ctx.font = '700 8px ui-monospace, monospace';
		ctx.fillStyle = player.hasRocket ? AMBER : MUTED;
		ctx.fillText(
			player.hasRocket ? `ROCKET ${player.fuel.toFixed(1)}/${player.maxFuel}` : 'ROCKET // OFFLINE',
			x,
			y - 4
		);
		ctx.fillStyle = '#202633';
		ctx.fillRect(x, y, width, height);
		if (player.hasRocket && player.maxFuel > 0) {
			const gauge = resolveHudGauge({ value: player.fuel, max: player.maxFuel });
			ctx.fillStyle = AMBER;
			ctx.fillRect(x, y, width * gauge.ratio, height);
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
			spriteRenderer.drawFrame(
				HUD_ICON_SHEET,
				slot.animation,
				0,
				x,
				y,
				false,
				HUD_ICON_SCALE,
				HUD_ICON_SCALE
			);
		} else {
			ctx.fillStyle = '#1a1d26';
			ctx.fillRect(x, y, HUD_ICON_SIZE, HUD_ICON_SIZE);
			ctx.fillStyle = slot.active ? MINT : '#7a8194';
			ctx.font = '8px ui-monospace, monospace';
			ctx.fillText(slot.label.slice(0, 3).toUpperCase(), x + 3, y + 16);
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
		ctx.font = '700 8px ui-monospace, monospace';
		ctx.fillText(slot.key, x + 2, y + HUD_ICON_SIZE + 12);

		if (slot.count !== undefined && slot.count > 0) {
			ctx.fillStyle = PANEL_STRONG;
			ctx.fillRect(x + 19, y + 19, 15, 14);
			ctx.fillStyle = TEXT;
			ctx.fillText(String(slot.count), x + 22, y + 28);
		}
		ctx.restore();
	}

	private getCompanionLines(player: Player): Array<{ text: string; color: string }> {
		const lines: Array<{ text: string; color: string }> = [];
		if ((player.companionShield ?? 0) > 0) {
			lines.push({ text: `Naya shield ${Math.floor(player.companionShield ?? 0)}`, color: MINT });
		}
		if (player.rookOverlayActive) {
			lines.push({ text: 'Rook overlay active', color: AMBER });
		}
		if (player.companionHint) {
			lines.push({ text: player.companionHint.slice(0, 31), color: MUTED });
		}
		return lines;
	}

	private renderCompanionStatus(
		ctx: CanvasRenderingContext2D,
		lines: Array<{ text: string; color: string }>,
		rect: { x: number; y: number; width: number; height: number }
	): void {
		if (lines.length === 0) return;
		const { x, y, width, height } = rect;
		ctx.save();
		drawArcadePanel(ctx, { x, y, width, height, accent: BADGER_UI.accentAlt });
		ctx.font = '700 8px ui-monospace, monospace';
		ctx.textAlign = 'left';
		for (const [index, line] of lines.entries()) {
			ctx.fillStyle = line.color;
			ctx.fillText(line.text.toUpperCase(), x + 9, y + 14 + index * 14);
		}
		ctx.restore();
	}

	private renderObjective(
		ctx: CanvasRenderingContext2D,
		player: Player,
		rect: { x: number; y: number; width: number; height: number }
	): void {
		if (!player.objectiveHint && !player.loadoutHint) return;
		const { x, y, width, height } = rect;
		ctx.save();
		drawArcadePanel(ctx, { x, y, width, height, accent: AMBER, label: 'Current route' });
		ctx.textAlign = 'left';
		ctx.font = '700 11px ui-monospace, monospace';
		ctx.fillStyle = TEXT;
		ctx.fillText((player.objectiveHint ?? '').slice(0, 42), x + 14, y + 36);
		ctx.font = '9px ui-monospace, monospace';
		ctx.fillStyle = MINT;
		ctx.fillText((player.loadoutHint ?? '').slice(0, 52), x + 14, y + 52);
		ctx.restore();
	}

	private renderCombatReadout(
		ctx: CanvasRenderingContext2D,
		player: Player,
		rect: { x: number; y: number; width: number; height: number }
	): void {
		if ((player.comboCount ?? 0) <= 0 && !player.bossPhaseHint && !player.rookOverlayActive) return;
		ctx.save();
		ctx.textAlign = 'center';
		drawArcadePanel(ctx, {
			...rect,
			accent: player.bossPhaseHint ? DANGER : AMBER,
			strong: true,
		});
		const chain = (player.comboCount ?? 0) > 0 ? ` // CHAIN ×${player.comboCount}` : '';
		const message = `${player.bossPhaseHint ?? 'COMBAT FLOW'}${chain}`.slice(0, 58);
		ctx.fillStyle = player.bossPhaseHint ? DANGER : AMBER;
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillText(message.toUpperCase(), rect.x + rect.width / 2, rect.y + 16);
		ctx.restore();
	}

	private renderToast(
		ctx: CanvasRenderingContext2D,
		player: Player,
		rect: { x: number; y: number; width: number; height: number }
	): void {
		if (!player.hudToast || (player.hudToastTimer ?? 0) <= 0) return;
		const alpha = Math.min(1, (player.hudToastTimer ?? 0) * 2);
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.textAlign = 'center';
		ctx.font = '700 11px ui-monospace, monospace';
		const width = Math.min(rect.width, Math.max(220, ctx.measureText(player.hudToast).width + 36));
		const x = ctx.canvas.width / 2 - width / 2;
		const y = rect.y;
		drawArcadePanel(ctx, { x, y, width, height: rect.height, strong: true });
		ctx.fillStyle = MINT;
		ctx.fillRect(x, y + rect.height - 3, width, 3);
		ctx.fillStyle = TEXT;
		ctx.fillText(player.hudToast.toUpperCase(), ctx.canvas.width / 2, y + 20);
		ctx.restore();
	}

	private renderContextHint(
		ctx: CanvasRenderingContext2D,
		player: Player,
		rect: { x: number; y: number; width: number; height: number }
	): void {
		if (!player.contextHint) return;
		ctx.save();
		ctx.textAlign = 'center';
		ctx.font = '700 10px ui-monospace, monospace';
		const width = Math.min(
			rect.width,
			Math.max(180, ctx.measureText(player.contextHint).width + 32)
		);
		const x = ctx.canvas.width / 2 - width / 2;
		const y = rect.y;
		drawArcadePanel(ctx, { x, y, width, height: rect.height, accent: AMBER, strong: true });
		ctx.fillStyle = TEXT;
		ctx.fillText(player.contextHint.toUpperCase(), ctx.canvas.width / 2, y + 16);
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

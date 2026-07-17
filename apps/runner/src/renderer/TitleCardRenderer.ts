/**
 * TitleCardRenderer - Brechtian title/placard scenes
 */

import { ARCADE_UI_FONT, BADGER_UI, drawArcadePanel } from '../ui/ArcadeUi';

export class TitleCardRenderer {
	render(ctx: CanvasRenderingContext2D, title: string, subtitle?: string, progress = 0): void {
		const W = ctx.canvas.width;
		const H = ctx.canvas.height;

		ctx.fillStyle = `rgba(5, 7, 13, ${0.88 - progress * 0.34})`;
		ctx.fillRect(0, 0, W, H);

		const panelWidth = Math.min(W - 96, 820);
		const panelHeight = Math.min(H - 120, 276);
		drawArcadePanel(ctx, {
			x: W / 2 - panelWidth / 2,
			y: H / 2 - panelHeight / 2,
			width: panelWidth,
			height: panelHeight,
			strong: true,
			label: progress > 0 ? `World ${Math.floor(progress * 8) + 1}` : 'Broadcast placard',
		});

		ctx.save();
		ctx.translate(W / 2, H / 2);

		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `900 44px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Wrap title to fit width
		const maxWidth = W - 200;
		const lines = this.wrapText(title, maxWidth, ctx);

		const lineHeight = 56;
		const totalHeight = lines.length * lineHeight + (subtitle ? 40 : 0);

		let y = -totalHeight / 2;
		for (const line of lines) {
			ctx.fillText(line, 0, y);
			y += lineHeight;
		}

		// Subtitle
		if (subtitle) {
			ctx.fillStyle = BADGER_UI.muted;
			ctx.font = `20px ${ARCADE_UI_FONT}`;
			ctx.fillText(subtitle, 0, y + 30);
		}

		if (progress > 0) {
			ctx.fillStyle = BADGER_UI.accent;
			ctx.fillRect(-64, y + 66, 128, 3);
		}

		ctx.restore();
	}

	private wrapText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] {
		const words = text.split(' ');
		const lines: string[] = [];
		let current = '';

		for (const word of words) {
			const test = current ? `${current} ${word}` : word;
			const metrics = ctx.measureText(test);

			if (metrics.width > maxWidth && current) {
				lines.push(current);
				current = word;
			} else {
				current = test;
			}
		}

		if (current) lines.push(current);
		return lines;
	}
}

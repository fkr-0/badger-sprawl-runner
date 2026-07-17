/**
 * Renderer-neutral arcade UI primitives shared in shape with Ethic Brawl and
 * Hyperblast. Each game owns its palette, while spacing, panel construction,
 * focus treatment and footer language stay consistent.
 */

export interface ArcadeUiTheme {
	background: string;
	backgroundRaised: string;
	panel: string;
	panelStrong: string;
	text: string;
	muted: string;
	accent: string;
	accentAlt: string;
	warning: string;
	danger: string;
	line: string;
}

export interface ArcadePanelOptions {
	x: number;
	y: number;
	width: number;
	height: number;
	accent?: string;
	strong?: boolean;
	label?: string;
}

export const ARCADE_UI_UNIT = 4;
export const ARCADE_UI_FONT = 'ui-monospace, "Cascadia Mono", "Courier New", monospace';

export const BADGER_UI: ArcadeUiTheme = {
	background: '#05070d',
	backgroundRaised: '#0b101b',
	panel: 'rgba(4, 6, 12, 0.82)',
	panelStrong: 'rgba(4, 6, 12, 0.94)',
	text: '#eaf2ff',
	muted: '#92a4be',
	accent: '#67f3c4',
	accentAlt: '#8aa8ff',
	warning: '#ffb35e',
	danger: '#ff5e7a',
	line: 'rgba(146, 164, 190, 0.32)',
};

export function drawArcadeBackdrop(
	ctx: CanvasRenderingContext2D,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	const { width, height } = ctx.canvas;
	const gradient = ctx.createLinearGradient(0, 0, 0, height);
	gradient.addColorStop(0, theme.backgroundRaised);
	gradient.addColorStop(1, theme.background);
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);

	ctx.save();
	ctx.globalAlpha = 0.16;
	ctx.fillStyle = theme.line;
	for (let y = 0; y < height; y += ARCADE_UI_UNIT * 3) {
		ctx.fillRect(0, y, width, 1);
	}
	ctx.globalAlpha = 0.1;
	for (let x = 0; x < width; x += ARCADE_UI_UNIT * 12) {
		ctx.fillRect(x, 0, 1, height);
	}
	ctx.restore();
}

export function drawArcadePanel(
	ctx: CanvasRenderingContext2D,
	options: ArcadePanelOptions,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	const { x, y, width, height, strong = false, label } = options;
	const accent = options.accent ?? theme.accent;
	const cut = ARCADE_UI_UNIT * 2;

	ctx.save();
	ctx.fillStyle = strong ? theme.panelStrong : theme.panel;
	ctx.beginPath();
	ctx.moveTo(x + cut, y);
	ctx.lineTo(x + width, y);
	ctx.lineTo(x + width, y + height - cut);
	ctx.lineTo(x + width - cut, y + height);
	ctx.lineTo(x, y + height);
	ctx.lineTo(x, y + cut);
	ctx.lineTo(x + cut, y);
	ctx.fill();

	ctx.strokeStyle = theme.line;
	ctx.lineWidth = 1;
	ctx.stroke();
	ctx.fillStyle = accent;
	ctx.fillRect(x, y + cut, ARCADE_UI_UNIT, Math.max(0, height - cut * 2));
	ctx.fillRect(x + cut, y, Math.min(width * 0.28, 120), 2);

	if (label) {
		ctx.textAlign = 'left';
		ctx.textBaseline = 'alphabetic';
		ctx.font = `700 10px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = accent;
		ctx.fillText(label.toUpperCase(), x + ARCADE_UI_UNIT * 4, y + ARCADE_UI_UNIT * 5);
	}
	ctx.restore();
}

export function drawArcadeMenuRow(
	ctx: CanvasRenderingContext2D,
	label: string,
	x: number,
	y: number,
	width: number,
	selected: boolean,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	const height = ARCADE_UI_UNIT * 9;
	ctx.save();
	ctx.globalAlpha = selected ? 0.13 : 0.025;
	ctx.fillStyle = selected ? theme.accent : theme.text;
	ctx.fillRect(x, y, width, height);
	ctx.globalAlpha = 1;
	ctx.fillStyle = selected ? theme.accent : theme.line;
	ctx.fillRect(x, y, selected ? ARCADE_UI_UNIT : 1, height);
	ctx.strokeStyle = selected ? theme.accent : theme.line;
	ctx.lineWidth = 1;
	ctx.strokeRect(x, y, width, height);
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.font = `${selected ? 800 : 650} 16px ${ARCADE_UI_FONT}`;
	ctx.fillStyle = selected ? theme.text : theme.muted;
	ctx.fillText(label.toUpperCase(), x + ARCADE_UI_UNIT * 5, y + height / 2);
	ctx.textAlign = 'right';
	ctx.fillStyle = selected ? theme.accent : theme.muted;
	ctx.fillText(selected ? '◆' : '·', x + width - ARCADE_UI_UNIT * 4, y + height / 2);
	ctx.restore();
}

export function drawArcadeFooter(
	ctx: CanvasRenderingContext2D,
	text: string,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	const { width, height } = ctx.canvas;
	ctx.save();
	ctx.fillStyle = theme.panelStrong;
	ctx.fillRect(0, height - ARCADE_UI_UNIT * 9, width, ARCADE_UI_UNIT * 9);
	ctx.fillStyle = theme.line;
	ctx.fillRect(0, height - ARCADE_UI_UNIT * 9, width, 1);
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `700 12px ${ARCADE_UI_FONT}`;
	ctx.fillStyle = theme.muted;
	ctx.fillText(text.toUpperCase(), width / 2, height - ARCADE_UI_UNIT * 4.5);
	ctx.restore();
}

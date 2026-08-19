/**
 * Badger Sprawl Runner palette adapter over the canonical @arcade/runtime
 * Canvas UI composition. The game owns only its palette and compatibility
 * names; shared geometry and focus treatment live in the runtime.
 */

import {
	ARCADE_UI_FONT,
	ARCADE_UI_UNIT,
	createArcadeNoticeQueue,
	createArcadeUiTheme,
	drawArcadeBackdropCanvas,
	drawArcadeChipCanvas,
	drawArcadeCommandBarCanvas,
	drawArcadeFooterCanvas,
	drawArcadeMenuRowCanvas,
	drawArcadeMeterCanvas,
	drawArcadeNoticeCanvas,
	drawArcadePanelCanvas,
	drawArcadeScreenTitleCanvas,
	drawArcadeTextBlockCanvas,
	fitArcadeTextCanvas,
} from '@arcade/runtime/ui';
import type {
	ArcadeChipOptions,
	ArcadeCommandAction,
	ArcadeCommandDevice,
	ArcadeMeterOptions,
	ArcadeNotice,
	ArcadePanelOptions,
	ArcadeScreenTitleOptions,
	ArcadeUiTheme,
} from '@arcade/runtime/ui';

export { ARCADE_UI_FONT, ARCADE_UI_UNIT, createArcadeNoticeQueue };
export type {
	ArcadeChipOptions,
	ArcadeCommandAction,
	ArcadeCommandDevice,
	ArcadeMeterOptions,
	ArcadeNotice,
	ArcadePanelOptions,
	ArcadeScreenTitleOptions,
	ArcadeUiTheme,
};

export type ArcadeCommandBarOptions = Omit<
	Parameters<typeof drawArcadeCommandBarCanvas>[1],
	'actions' | 'device'
>;
export type ArcadeTextBlockOptions = Parameters<typeof drawArcadeTextBlockCanvas>[1];

export const BADGER_UI: ArcadeUiTheme = createArcadeUiTheme({
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
});

export function drawArcadeBackdrop(
	ctx: CanvasRenderingContext2D,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	drawArcadeBackdropCanvas(ctx, theme);
}

export function drawArcadeNotice(
	ctx: CanvasRenderingContext2D,
	notice: ArcadeNotice | null,
	options: Parameters<typeof drawArcadeNoticeCanvas>[2] = {},
	theme: ArcadeUiTheme = BADGER_UI
) {
	return drawArcadeNoticeCanvas(ctx, notice, options, theme);
}

export function drawArcadeCommandBar(
	ctx: CanvasRenderingContext2D,
	actions: readonly ArcadeCommandAction[],
	device: ArcadeCommandDevice = 'keyboard',
	options: ArcadeCommandBarOptions = {},
	theme: ArcadeUiTheme = BADGER_UI
) {
	return drawArcadeCommandBarCanvas(ctx, { ...options, actions, device }, theme);
}

export function drawArcadeTextBlock(
	ctx: CanvasRenderingContext2D,
	options: ArcadeTextBlockOptions,
	theme: ArcadeUiTheme = BADGER_UI
) {
	return drawArcadeTextBlockCanvas(ctx, options, theme);
}

export function fitArcadeText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number
): string {
	return fitArcadeTextCanvas(ctx, text, maxWidth);
}

export function drawArcadePanel(
	ctx: CanvasRenderingContext2D,
	options: ArcadePanelOptions,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	drawArcadePanelCanvas(ctx, options, theme);
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
	drawArcadeMenuRowCanvas(ctx, label, x, y, width, selected, theme);
}

export function drawArcadeFooter(
	ctx: CanvasRenderingContext2D,
	text: string,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	drawArcadeFooterCanvas(ctx, text, theme);
}

export function drawArcadeChip(
	ctx: CanvasRenderingContext2D,
	options: ArcadeChipOptions,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	drawArcadeChipCanvas(ctx, options, theme);
}

export function drawArcadeMeter(
	ctx: CanvasRenderingContext2D,
	options: ArcadeMeterOptions,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	drawArcadeMeterCanvas(ctx, options, theme);
}

export function drawArcadeScreenTitle(
	ctx: CanvasRenderingContext2D,
	options: ArcadeScreenTitleOptions,
	theme: ArcadeUiTheme = BADGER_UI
): void {
	drawArcadeScreenTitleCanvas(ctx, options, theme);
}

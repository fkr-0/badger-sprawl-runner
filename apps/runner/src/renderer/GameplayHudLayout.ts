export interface HudRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface GameplayHudLayout {
	vitals: HudRect;
	companions: HudRect;
	objective: HudRect;
	combat: HudRect;
	gear: HudRect;
	context: HudRect;
	toast: HudRect;
}

export const GAMEPLAY_HUD_WORLD_OVERLAY_TOP = 126;

export function buildGameplayHudLayout(
	canvasWidth: number,
	canvasHeight: number,
	companionLineCount: number,
	gearSlotCount: number
): GameplayHudLayout {
	const margin = 12;
	const vitals: HudRect = { x: margin, y: margin, width: 350, height: 74 };
	const companions: HudRect = {
		x: Math.round(canvasWidth / 2 - 96),
		y: margin,
		width: 192,
		height: Math.max(34, 12 + Math.max(1, companionLineCount) * 14),
	};
	const objective: HudRect = {
		x: canvasWidth - margin - 300,
		y: margin,
		width: 300,
		height: 62,
	};
	const combat: HudRect = {
		x: Math.round(canvasWidth / 2 - 160),
		y:
			Math.max(
				vitals.y + vitals.height,
				companions.y + companions.height,
				objective.y + objective.height
			) + 6,
		width: 320,
		height: 24,
	};
	const gearWidth = 18 + Math.max(1, gearSlotCount) * 31;
	const gear: HudRect = {
		x: canvasWidth - margin - gearWidth,
		y: canvasHeight - 88,
		width: gearWidth,
		height: 42,
	};
	const context: HudRect = {
		x: Math.round(canvasWidth / 2 - 200),
		y: canvasHeight - 34,
		width: 400,
		height: 24,
	};
	const toast: HudRect = {
		x: Math.round(canvasWidth / 2 - 240),
		y: combat.y + combat.height + 8,
		width: 480,
		height: 30,
	};

	return { vitals, companions, objective, combat, gear, context, toast };
}

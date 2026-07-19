import { describe, expect, it } from 'vitest';
import { buildGameplayHudLayout, GAMEPLAY_HUD_WORLD_OVERLAY_TOP } from './GameplayHudLayout';

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

function overlaps(a: Rect, b: Rect): boolean {
	return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

describe('gameplay HUD layout', () => {
	it('keeps the 960x540 top row readable and non-overlapping', () => {
		const layout = buildGameplayHudLayout(960, 540, 3, 4);
		expect(overlaps(layout.vitals, layout.companions)).toBe(false);
		expect(overlaps(layout.companions, layout.objective)).toBe(false);
		expect(overlaps(layout.combat, layout.vitals)).toBe(false);
		expect(overlaps(layout.combat, layout.companions)).toBe(false);
		expect(overlaps(layout.combat, layout.objective)).toBe(false);
		expect(layout.combat.y + layout.combat.height).toBeLessThanOrEqual(
			GAMEPLAY_HUD_WORLD_OVERLAY_TOP
		);
	});

	it('separates bottom equipment and context controls', () => {
		const layout = buildGameplayHudLayout(960, 540, 2, 4);
		expect(overlaps(layout.gear, layout.context)).toBe(false);
		expect(layout.context.y + layout.context.height).toBeLessThanOrEqual(540);
	});
});

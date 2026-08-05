import type { Scene, SceneContext } from '../engine/SceneManager';
import type { Renderer } from '../renderer/Renderer';
import {
	ARCADE_UI_FONT,
	BADGER_UI,
	drawArcadeBackdrop,
	drawArcadeCommandBar,
	drawArcadePanel,
} from '../ui/ArcadeUi';
import type { ArcadeCommandAction } from '../ui/ArcadeUi';

/**
 * Legacy compatibility scene.
 *
 * The former ShopScene owned an independent ShopEngine and wrote MetaState
 * directly, creating a shadow inventory/economy beside AdventureSaveV2. It is
 * intentionally quarantined: all purchasing now runs through
 * WorldServiceDirector inside LocationScene.
 */
export const LEGACY_SHOP_SCENE_QUARANTINED = true as const;

export class ShopScene implements Scene {
	readonly name = 'ShopScene';
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;

	constructor(private readonly onReturn?: () => void) {}

	onEnter(_context: SceneContext): void {
		this.keyHandler = (event) => {
			if (!['Escape', 'KeyQ', 'Enter', 'Space'].includes(event.code)) return;
			event.preventDefault();
			this.onReturn?.();
		};
		window.addEventListener('keydown', this.keyHandler);
	}

	onExit(): void {
		if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
		this.keyHandler = null;
	}

	update(_dt: number): void {}

	render(renderer: Renderer, _alpha: number): void {
		const ctx = renderer.getContext();
		drawArcadeBackdrop(ctx);
		drawArcadePanel(ctx, {
			x: 130,
			y: 128,
			width: 700,
			height: 300,
			strong: true,
			label: 'Legacy scene quarantined',
		});
		ctx.textAlign = 'center';
		ctx.fillStyle = BADGER_UI.warning;
		ctx.font = `900 22px ${ARCADE_UI_FONT}`;
		ctx.fillText('NO SHADOW SHOP', 480, 190);
		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `700 13px ${ARCADE_UI_FONT}`;
		ctx.fillText(
			'Purchases, stock, trust, and persistent inventory now live in the world.',
			480,
			232
		);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.font = `11px ${ARCADE_UI_FONT}`;
		ctx.fillText('Visit a field-shop service inside a walkable location.', 480, 270);
		ctx.fillText('This compatibility scene performs no save reads and no save writes.', 480, 292);
		drawArcadeCommandBar(ctx, LEGACY_SHOP_COMMANDS);
	}
}

const LEGACY_SHOP_COMMANDS: readonly ArcadeCommandAction[] = [
	{
		id: 'return',
		label: 'return to the real city',
		inputs: { keyboard: 'Enter / Q / Esc', gamepad: 'B' },
		priority: 10,
	},
];

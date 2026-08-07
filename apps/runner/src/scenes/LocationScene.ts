import type { Scene, SceneContext } from '../engine/SceneManager';
import type { GameFlow } from '../game/GameFlow';
import { PlaceDirector, type PlaceInteractionResult } from '../game/adventure/PlaceDirector';
import {
	type SocialPropDef,
	type SocialSpaceLayoutDef,
	getSocialSpaceLayout,
} from '../game/adventure/SocialSpaceCatalog';
import type { WorldDirector } from '../game/adventure/WorldDirector';
import {
	type ExecutableServiceId,
	type ServiceActionItem,
	type ServiceOfferItem,
	type ServiceTransactionReceipt,
	WorldServiceDirector,
} from '../game/adventure/WorldServiceDirector';
import type { Renderer } from '../renderer/Renderer';
import type { AutosaveFeedback } from '../storage/AutosaveFeedback';
import { UNDERCITY_ENTRANCES } from '../procgen/UndercityExpedition';
import { getFirstReleaseItem } from '../systems/FirstReleaseItemCatalog';
import {
	ARCADE_UI_FONT,
	BADGER_UI,
	drawArcadeBackdrop,
	drawArcadeCommandBar,
	drawArcadePanel,
	drawArcadeTextBlock,
	fitArcadeText,
} from '../ui/ArcadeUi';
import type { ArcadeCommandAction } from '../ui/ArcadeUi';

export interface LocationSceneOptions {
	locationId: string;
	flow: GameFlow;
	world: WorldDirector;
	onReturnToMap?: () => void;
	onOpenSkills?: () => void;
	onOpenShop?: () => void;
	onOpenUndercity?: (entranceId: string) => void;
	onAutosaveWorld?: () => AutosaveFeedback | undefined;
	onReturnToTitle?: () => void;
}

const LOCATION_COMMANDS: readonly ArcadeCommandAction[] = [
	{
		id: 'walk',
		label: 'walk place',
		inputs: { keyboard: 'A / D or ← / →', gamepad: 'Left Stick' },
		priority: 10,
	},
	{
		id: 'interact',
		label: 'interact',
		inputs: { keyboard: 'E / Enter', gamepad: 'A' },
		priority: 9,
	},
	{ id: 'cycle', label: 'cycle voices', inputs: { keyboard: 'Tab', gamepad: 'RB' } },
	{ id: 'transit', label: 'open transit', inputs: { keyboard: 'M', gamepad: 'Y' } },
];

const LOCATION_SERVICE_COMMANDS: readonly ArcadeCommandAction[] = [
	{
		id: 'choose',
		label: 'choose service',
		inputs: { keyboard: '↑ / ↓', gamepad: 'D-Pad' },
		priority: 10,
	},
	{ id: 'transact', label: 'transact', inputs: { keyboard: 'Enter', gamepad: 'A' }, priority: 9 },
	{ id: 'close', label: 'close service', inputs: { keyboard: 'Q / Esc', gamepad: 'B' } },
];

export type LocationInteraction =
	| { kind: 'npc'; id: string; label: string; detail: string; x: number }
	| { kind: 'service'; id: string; label: string; detail: string; x: number };

export type ActiveLocationService = 'field-shop' | 'loadout-locker' | ExecutableServiceId | null;

export interface LocationSceneSnapshot {
	locationId: string;
	title: string;
	phase: string;
	violencePolicy: string;
	interactionIds: string[];
	selectedIndex: number;
	focusedInteractionId?: string;
	playerX: number;
	activeServiceId: ActiveLocationService;
	serviceItemIds: string[];
	networkHealth: number;
	networkNotice?: string;
	worldBeat: string;
	scheduleNotice?: string;
	level: number;
	experience: number;
	message: string;
	subwayEra: string;
	undercityEntranceId?: string;
	undercityEntranceLabel?: string;
}

const FALLBACK_LAYOUT: SocialSpaceLayoutDef = {
	locationId: 'fallback',
	width: 1280,
	floorY: 354,
	spawnX: 180,
	walkSpeed: 210,
	interactionRadius: 90,
	farLayer: 'The place has not received its final spatial composition.',
	midLayer: 'People and services still occupy durable world positions.',
	anchors: [],
	props: [],
};

export class LocationScene implements Scene {
	readonly name = 'LocationScene';

	private readonly places: PlaceDirector;
	private readonly services: WorldServiceDirector;
	private readonly layout: SocialSpaceLayoutDef;
	private selectedIndex = 0;
	private serviceSelection = 0;
	private activeService: ActiveLocationService = null;
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private keyUpHandler: ((event: KeyboardEvent) => void) | null = null;
	private readonly pressed = new Set<string>();
	private message = 'Walk the place. People are not menu headings.';
	private playerX: number;
	private facing: -1 | 1 = 1;

	constructor(private readonly options: LocationSceneOptions) {
		this.places = new PlaceDirector(options.world, options.flow);
		this.services = new WorldServiceDirector(options.flow, options.world);
		this.layout = getSocialSpaceLayout(options.locationId) ?? FALLBACK_LAYOUT;
		this.playerX = this.layout.spawnX;
		this.updateFocusFromPosition();
	}

	onEnter(_context: SceneContext): void {
		this.keyHandler = (event) => this.handleKeyDown(event);
		this.keyUpHandler = (event) => this.handleKeyUp(event);
		window.addEventListener('keydown', this.keyHandler);
		window.addEventListener('keyup', this.keyUpHandler);
		window.dispatchEvent(
			new CustomEvent('badger:location-entered', { detail: this.getSnapshot() })
		);
	}

	onExit(): void {
		if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
		if (this.keyUpHandler) window.removeEventListener('keyup', this.keyUpHandler);
		this.keyHandler = null;
		this.keyUpHandler = null;
		this.pressed.clear();
	}

	update(dt: number): void {
		if (this.activeService) return;
		const direction =
			Number(this.pressed.has('ArrowRight') || this.pressed.has('KeyD')) -
			Number(this.pressed.has('ArrowLeft') || this.pressed.has('KeyA'));
		if (direction === 0) return;
		this.facing = direction < 0 ? -1 : 1;
		this.playerX = clamp(
			this.playerX + direction * this.layout.walkSpeed * Math.max(0, dt),
			28,
			this.layout.width - 28
		);
		this.updateFocusFromPosition();
	}

	render(renderer: Renderer, _alpha: number): void {
		const ctx = renderer.getContext();
		const snapshot = this.places.getSnapshot(this.options.locationId);
		drawArcadeBackdrop(ctx);
		if (!snapshot) {
			ctx.fillStyle = BADGER_UI.text;
			ctx.font = `700 18px ${ARCADE_UI_FONT}`;
			ctx.textAlign = 'center';
			ctx.fillText('PLACE LEDGER ENTRY PENDING', ctx.canvas.width / 2, ctx.canvas.height / 2);
			return;
		}

		const title = snapshot.variant.titleSuffix
			? `${snapshot.place.name} // ${snapshot.variant.titleSuffix}`
			: snapshot.place.name;
		ctx.textAlign = 'center';
		ctx.fillStyle = BADGER_UI.muted;
		ctx.font = `700 10px ${ARCADE_UI_FONT}`;
		const advancement = this.options.world.getState().advancement;
		ctx.fillText(
			`LVL ${advancement.level} // XP ${advancement.experience} // ${snapshot.phase.toUpperCase()} // ${snapshot.place.safety.toUpperCase()} // ${snapshot.place.violencePolicy.toUpperCase()}`,
			ctx.canvas.width / 2,
			28
		);
		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `900 25px ${ARCADE_UI_FONT}`;
		ctx.fillText(fitArcadeText(ctx, title, ctx.canvas.width - 160), ctx.canvas.width / 2, 58);
		ctx.font = `11px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = BADGER_UI.accent;
		ctx.fillText(
			fitArcadeText(ctx, snapshot.subwayPulse.tagline, ctx.canvas.width - 120),
			ctx.canvas.width / 2,
			80
		);

		this.renderSocialSpace(ctx);
		this.renderInteractionPanel(ctx);
		if (this.activeService) this.renderServiceOverlay(ctx);
		const entrance = this.getUndercityEntrance();
		const commands: readonly ArcadeCommandAction[] = entrance
			? [
					...LOCATION_COMMANDS,
					{
						id: 'undercity',
						label: 'open undercity',
						inputs: { keyboard: 'U', gamepad: 'X' },
						priority: 8,
					},
			  ]
			: LOCATION_COMMANDS;
		drawArcadeCommandBar(ctx, this.activeService ? LOCATION_SERVICE_COMMANDS : commands);
	}

	getSnapshot(): LocationSceneSnapshot {
		const snapshot = this.places.getSnapshot(this.options.locationId);
		const interactions = this.getInteractions();
		const entrance = this.getUndercityEntrance();
		return {
			locationId: this.options.locationId,
			title: snapshot?.place.name ?? 'Unknown place',
			phase: snapshot?.phase ?? 'unknown',
			violencePolicy: snapshot?.place.violencePolicy ?? 'disabled',
			interactionIds: interactions.map((interaction) => interaction.id),
			selectedIndex: this.selectedIndex,
			focusedInteractionId: interactions[this.selectedIndex]?.id,
			playerX: this.playerX,
			activeServiceId: this.activeService,
			serviceItemIds: this.getActiveServiceItems().map((item) => item.id),
			networkHealth: snapshot?.infrastructureHealth ?? 0,
			networkNotice: snapshot?.infrastructureNotices[0],
			worldBeat: snapshot?.worldBeat ?? 'city-night',
			scheduleNotice: snapshot?.scheduleNotice,
			level: this.options.world.getState().advancement.level,
			experience: this.options.world.getState().advancement.experience,
			message: this.message,
			subwayEra: snapshot?.subwayPulse.era ?? 'metered-silence',
			undercityEntranceId: entrance?.id,
			undercityEntranceLabel: entrance?.label,
		};
	}

	openUndercity(): boolean {
		const entrance = this.getUndercityEntrance();
		if (!entrance) {
			this.message = 'No undercity entrance is attached to this public place.';
			return false;
		}
		this.message = `${entrance.label} // seeded manifest required`;
		this.options.onOpenUndercity?.(entrance.id);
		return true;
	}

	moveSelection(delta: number): void {
		const interactions = this.getInteractions();
		if (interactions.length === 0) return;
		this.selectedIndex = (this.selectedIndex + delta + interactions.length) % interactions.length;
		this.playerX = interactions[this.selectedIndex]?.x ?? this.playerX;
	}

	movePlayer(delta: number): void {
		if (!Number.isFinite(delta)) return;
		this.playerX = clamp(this.playerX + delta, 28, this.layout.width - 28);
		this.facing = delta < 0 ? -1 : delta > 0 ? 1 : this.facing;
		this.updateFocusFromPosition();
	}

	confirmSelection(): PlaceInteractionResult | ServiceTransactionReceipt | null {
		if (this.activeService) return this.confirmServiceSelection();
		const interaction = this.getInteractions()[this.selectedIndex];
		if (!interaction) return null;
		if (Math.abs(interaction.x - this.playerX) > this.layout.interactionRadius) {
			this.message = 'Move closer. The city has had enough remote relationships.';
			return null;
		}
		if (interaction.kind === 'service' && interaction.id === 'field-shop') {
			this.activeService = 'field-shop';
			this.serviceSelection = 0;
			this.message = 'Murr opens the coat. The coat contains zoning violations.';
			return {
				ok: true,
				changed: false,
				message: this.message,
				intent: 'open-shop',
			};
		}
		if (interaction.kind === 'service' && isExecutableLocationService(interaction.id)) {
			this.activeService = interaction.id;
			this.serviceSelection = 0;
			this.message = serviceOpenMessage(interaction.id);
			return {
				ok: true,
				changed: false,
				message: this.message,
			};
		}
		if (interaction.kind === 'service' && interaction.id === 'loadout-locker') {
			this.activeService = 'loadout-locker';
			this.serviceSelection = 0;
			this.message = 'The locker remembers equipment, not hero poses.';
			return {
				ok: true,
				changed: false,
				message: this.message,
			};
		}
		const result =
			interaction.kind === 'npc'
				? this.places.talkTo(interaction.id, this.options.locationId)
				: this.places.activateService(interaction.id, this.options.locationId);
		this.message = result.message;
		if (result.changed) this.options.onAutosaveWorld?.();
		if (result.intent === 'open-skills') this.options.onOpenSkills?.();
		if (result.intent === 'open-shop') this.options.onOpenShop?.();
		if (result.intent === 'open-map') this.options.onReturnToMap?.();
		return result;
	}

	private confirmServiceSelection(): ServiceTransactionReceipt | null {
		const activeService = this.activeService;
		if (!activeService) return null;
		const items = this.getActiveServiceItems();
		const selected = items[this.serviceSelection];
		if (!selected) {
			this.message = 'Nothing usable is listed here.';
			return null;
		}
		const receipt =
			activeService === 'field-shop'
				? this.services.purchaseItem(this.options.locationId, selected.id)
				: activeService === 'loadout-locker'
					? this.services.equipItem(selected.id)
					: this.services.performServiceAction(this.options.locationId, activeService, selected.id);
		this.message = receipt.message;
		if (receipt.changed) this.options.onAutosaveWorld?.();
		return receipt;
	}

	private getInteractions(): LocationInteraction[] {
		const snapshot = this.places.getSnapshot(this.options.locationId);
		if (!snapshot) return [];
		const anchorByKey = new Map(
			this.layout.anchors.map((anchor) => [`${anchor.kind}:${anchor.id}`, anchor.x])
		);
		const entries: LocationInteraction[] = [
			...snapshot.npcs.map((entry, index) => ({
				kind: 'npc' as const,
				id: entry.npc.id,
				label: entry.met ? entry.npc.name : `${entry.npc.name} // NEW`,
				detail: `${entry.npc.alias ?? entry.npc.roles.join(', ')}. ${entry.npc.contradiction}`,
				x: anchorByKey.get(`npc:${entry.npc.id}`) ?? 240 + index * 180,
			})),
			...snapshot.services.map((service, index) => ({
				kind: 'service' as const,
				id: service.id,
				label: service.label,
				detail: service.description,
				x: anchorByKey.get(`service:${service.id}`) ?? 360 + index * 190,
			})),
		];
		return entries.sort((a, b) => a.x - b.x || a.label.localeCompare(b.label));
	}

	private getUndercityEntrance() {
		return UNDERCITY_ENTRANCES.find((entrance) => entrance.locationId === this.options.locationId);
	}

	private getActiveServiceItems(): Array<{
		id: string;
		label: string;
		detail: string;
		suffix: string;
	}> {
		if (this.activeService === 'field-shop') {
			return this.services.getShopOffer(this.options.locationId).map((offer: ServiceOfferItem) => ({
				id: offer.itemId,
				label: offer.name,
				detail: `${offer.effect} ${offer.flavor}`,
				suffix: `${offer.price} CC // OWN ${offer.owned} // STOCK ${offer.available}`,
			}));
		}
		if (this.activeService === 'loadout-locker') {
			const state = this.options.world.getState();
			const equipped = new Set(state.equippedItemIds);
			return state.inventory.map((stack) => {
				const definition = getFirstReleaseItem(stack.itemId);
				return {
					id: stack.itemId,
					label: definition?.name ?? stack.itemId,
					detail: definition?.effect ?? 'Uncatalogued persistent item.',
					suffix: `${equipped.has(stack.itemId) ? 'EQUIPPED' : 'OWNED'} // ×${stack.quantity}`,
				};
			});
		}
		if (this.activeService && isExecutableLocationService(this.activeService)) {
			return this.services
				.getServiceActions(this.options.locationId, this.activeService)
				.map((action: ServiceActionItem) => ({
					id: action.id,
					label: `${action.enabled ? '' : 'LOCKED // '}${action.label}`,
					detail: action.detail,
					suffix: action.suffix,
				}));
		}
		return [];
	}

	private updateFocusFromPosition(): void {
		const interactions = this.getInteractions();
		if (interactions.length === 0) {
			this.selectedIndex = 0;
			return;
		}
		let nearestIndex = 0;
		let nearestDistance = Number.POSITIVE_INFINITY;
		for (const [index, interaction] of interactions.entries()) {
			const distance = Math.abs(interaction.x - this.playerX);
			if (distance < nearestDistance) {
				nearestIndex = index;
				nearestDistance = distance;
			}
		}
		this.selectedIndex = nearestIndex;
	}

	private renderSocialSpace(ctx: CanvasRenderingContext2D): void {
		const viewport = { x: 36, y: 98, width: 888, height: 296 };
		drawArcadePanel(ctx, { ...viewport, strong: true, label: 'Walkable social space' });
		const cameraX = clamp(
			this.playerX - viewport.width * 0.5,
			0,
			Math.max(0, this.layout.width - viewport.width)
		);
		ctx.save();
		ctx.beginPath();
		ctx.rect(viewport.x + 2, viewport.y + 2, viewport.width - 4, viewport.height - 4);
		ctx.clip();

		ctx.fillStyle = BADGER_UI.backgroundRaised;
		ctx.fillRect(viewport.x + 4, viewport.y + 22, viewport.width - 8, viewport.height - 26);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.globalAlpha = 0.7;
		ctx.font = `10px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'left';
		ctx.fillText(
			fitArcadeText(ctx, this.layout.farLayer, viewport.width - 36),
			viewport.x + 18,
			viewport.y + 45
		);
		ctx.globalAlpha = 0.45;
		ctx.fillText(
			fitArcadeText(ctx, this.layout.midLayer, viewport.width - 36),
			viewport.x + 18,
			viewport.y + 64
		);
		ctx.globalAlpha = 1;

		for (const prop of this.layout.props) this.renderProp(ctx, prop, viewport.x, cameraX);
		ctx.fillStyle = BADGER_UI.line;
		ctx.fillRect(viewport.x, this.layout.floorY, viewport.width, 4);
		ctx.fillStyle = BADGER_UI.background;
		ctx.fillRect(
			viewport.x,
			this.layout.floorY + 4,
			viewport.width,
			viewport.y + viewport.height - this.layout.floorY
		);

		const interactions = this.getInteractions();
		for (const [index, interaction] of interactions.entries()) {
			const screenX = viewport.x + interaction.x - cameraX;
			if (screenX < viewport.x - 70 || screenX > viewport.x + viewport.width + 70) continue;
			this.renderInteractionActor(ctx, interaction, screenX, index === this.selectedIndex);
		}
		this.renderMoss(ctx, viewport.x + this.playerX - cameraX, this.layout.floorY);
		ctx.restore();
	}

	private renderProp(
		ctx: CanvasRenderingContext2D,
		prop: SocialPropDef,
		viewportX: number,
		cameraX: number
	): void {
		const x = viewportX + prop.x - cameraX;
		const y = this.layout.floorY - prop.height;
		ctx.save();
		ctx.globalAlpha = prop.kind === 'light' ? 0.38 : 0.78;
		ctx.fillStyle =
			prop.kind === 'greenery'
				? BADGER_UI.accent
				: prop.kind === 'clinic'
					? BADGER_UI.text
					: prop.kind === 'train'
						? BADGER_UI.accentAlt
						: BADGER_UI.muted;
		ctx.fillRect(x, y, prop.width, prop.height);
		ctx.globalAlpha = 1;
		ctx.strokeStyle = BADGER_UI.line;
		ctx.strokeRect(x, y, prop.width, prop.height);
		if (prop.label) {
			ctx.fillStyle = BADGER_UI.background;
			ctx.font = `700 9px ${ARCADE_UI_FONT}`;
			ctx.textAlign = 'center';
			ctx.fillText(prop.label, x + prop.width / 2, y + 16);
		}
		ctx.restore();
	}

	private renderInteractionActor(
		ctx: CanvasRenderingContext2D,
		interaction: LocationInteraction,
		screenX: number,
		focused: boolean
	): void {
		const floorY = this.layout.floorY;
		ctx.save();
		ctx.strokeStyle = focused ? BADGER_UI.warning : BADGER_UI.line;
		ctx.fillStyle = interaction.kind === 'npc' ? BADGER_UI.accentAlt : BADGER_UI.accent;
		if (interaction.kind === 'npc') {
			ctx.beginPath();
			ctx.arc(screenX, floorY - 62, 13, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillRect(screenX - 13, floorY - 49, 26, 45);
		} else {
			ctx.translate(screenX, floorY - 42);
			ctx.rotate(Math.PI / 4);
			ctx.fillRect(-14, -14, 28, 28);
			ctx.rotate(-Math.PI / 4);
			ctx.translate(-screenX, -(floorY - 42));
		}
		if (focused) {
			ctx.strokeRect(screenX - 26, floorY - 88, 52, 86);
			ctx.fillStyle = BADGER_UI.warning;
			ctx.font = `800 10px ${ARCADE_UI_FONT}`;
			ctx.textAlign = 'center';
			ctx.fillText('E', screenX, floorY - 98);
		}
		ctx.fillStyle = focused ? BADGER_UI.text : BADGER_UI.muted;
		ctx.font = `${focused ? 800 : 650} 9px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText(fitArcadeText(ctx, interaction.label.toUpperCase(), 104), screenX, floorY + 18);
		ctx.restore();
	}

	private renderMoss(ctx: CanvasRenderingContext2D, screenX: number, floorY: number): void {
		ctx.save();
		ctx.translate(screenX, floorY);
		ctx.scale(this.facing, 1);
		ctx.fillStyle = BADGER_UI.text;
		ctx.fillRect(-15, -46, 30, 42);
		ctx.fillStyle = BADGER_UI.background;
		ctx.fillRect(2, -41, 10, 9);
		ctx.fillStyle = BADGER_UI.warning;
		ctx.fillRect(11, -39, 4, 4);
		ctx.fillStyle = BADGER_UI.accent;
		ctx.fillRect(-18, -8, 36, 4);
		ctx.restore();
	}

	private renderInteractionPanel(ctx: CanvasRenderingContext2D): void {
		const interaction = this.getInteractions()[this.selectedIndex];
		const snapshot = this.places.getSnapshot(this.options.locationId);
		drawArcadePanel(ctx, {
			x: 36,
			y: 406,
			width: 888,
			height: 90,
			label: interaction?.kind ?? 'Listen',
		});
		ctx.textAlign = 'left';
		ctx.fillStyle = BADGER_UI.accent;
		ctx.font = `800 14px ${ARCADE_UI_FONT}`;
		ctx.fillText(interaction?.label ?? 'No nearby interaction', 56, 437);
		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `11px ${ARCADE_UI_FONT}`;
		drawArcadeTextBlock(ctx, {
			x: 56,
			y: 458,
			width: 520,
			text: interaction?.detail ?? this.layout.midLayer,
			font: ctx.font,
			lineHeight: 15,
			maxLines: 2,
			color: BADGER_UI.text,
		});
		ctx.fillStyle = BADGER_UI.warning;
		drawArcadeTextBlock(ctx, {
			x: 600,
			y: 431,
			width: 300,
			text: this.message,
			font: ctx.font,
			lineHeight: 15,
			maxLines: 2,
			color: BADGER_UI.warning,
		});
		ctx.fillStyle = BADGER_UI.accentAlt;
		ctx.font = `9px ${ARCADE_UI_FONT}`;
		drawArcadeTextBlock(ctx, {
			x: 600,
			y: 470,
			width: 300,
			text:
				snapshot?.infrastructureNotices[0] ??
				snapshot?.scheduleNotice ??
				`${snapshot?.infrastructureLabel ?? 'NO PUBLIC DEPENDENCY MAP'} // ${snapshot?.infrastructureHealth ?? 0}%`,
			font: ctx.font,
			lineHeight: 12,
			maxLines: 2,
			color: BADGER_UI.accentAlt,
		});
	}

	private renderServiceOverlay(ctx: CanvasRenderingContext2D): void {
		const items = this.getActiveServiceItems();
		const selected = items[this.serviceSelection];
		drawArcadePanel(ctx, {
			x: 118,
			y: 118,
			width: 724,
			height: 350,
			strong: true,
			label: serviceOverlayLabel(this.activeService),
		});
		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `900 20px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText(fitArcadeText(ctx, serviceOverlayTitle(this.activeService), 620), 480, 156);
		ctx.font = `700 11px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = BADGER_UI.warning;
		ctx.fillText(
			fitArcadeText(
				ctx,
				this.services.getServiceStatusLine(this.options.locationId, this.activeService ?? ''),
				650
			),
			480,
			178
		);
		ctx.textAlign = 'left';
		for (const [index, item] of items.entries()) {
			const y = 214 + index * 42;
			ctx.fillStyle = index === this.serviceSelection ? BADGER_UI.accent : BADGER_UI.text;
			ctx.font = `${index === this.serviceSelection ? 850 : 650} 12px ${ARCADE_UI_FONT}`;
			ctx.fillText(`${index === this.serviceSelection ? '▶' : ' '} ${item.label}`, 150, y);
			ctx.textAlign = 'right';
			ctx.fillStyle = index === this.serviceSelection ? BADGER_UI.warning : BADGER_UI.muted;
			ctx.fillText(item.suffix, 810, y);
			ctx.textAlign = 'left';
		}
		ctx.fillStyle = BADGER_UI.muted;
		ctx.font = `11px ${ARCADE_UI_FONT}`;
		drawArcadeTextBlock(ctx, {
			x: 150,
			y: 404,
			width: 660,
			text: selected?.detail ?? 'No stock or equipment is available.',
			font: ctx.font,
			lineHeight: 16,
			maxLines: 3,
			color: BADGER_UI.muted,
		});
	}

	private handleKeyDown(event: KeyboardEvent): void {
		if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
			event.preventDefault();
			this.pressed.add(event.code);
			return;
		}
		if (event.code === 'Escape' || event.code === 'KeyQ') {
			event.preventDefault();
			if (this.activeService) {
				this.activeService = null;
				this.message = 'Back in the place. The transaction did not become the world.';
			} else if (event.code === 'Escape') {
				this.options.onReturnToTitle?.();
			}
			return;
		}
		if (event.code === 'KeyM' && !this.activeService) {
			event.preventDefault();
			this.options.onReturnToMap?.();
			return;
		}
		if (event.code === 'KeyU' && !this.activeService) {
			event.preventDefault();
			this.openUndercity();
			return;
		}
		if (event.code === 'Tab' && !this.activeService) {
			event.preventDefault();
			this.moveSelection(event.shiftKey ? -1 : 1);
			return;
		}
		if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
			event.preventDefault();
			const delta = event.code === 'ArrowUp' ? -1 : 1;
			if (this.activeService) {
				const items = this.getActiveServiceItems();
				if (items.length > 0) {
					this.serviceSelection = (this.serviceSelection + delta + items.length) % items.length;
				}
			} else {
				this.moveSelection(delta);
			}
			return;
		}
		if (event.code === 'Enter' || event.code === 'Space' || event.code === 'KeyE') {
			event.preventDefault();
			this.confirmSelection();
		}
	}

	private handleKeyUp(event: KeyboardEvent): void {
		this.pressed.delete(event.code);
	}
}

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}

function isExecutableLocationService(serviceId: string): serviceId is ExecutableServiceId {
	return [
		'repair-bench',
		'clinic',
		'archive',
		'legal-aid',
		'greenhouse',
		'transit-control',
	].includes(serviceId);
}

function serviceOpenMessage(serviceId: ExecutableServiceId): string {
	switch (serviceId) {
		case 'repair-bench':
			return 'The bench opens a public maintenance record: condition, cost, modification, repeatability.';
		case 'clinic':
			return 'The clinic lists supplies and strain before it lists treatment.';
		case 'greenhouse':
			return 'The greenhouse publishes what can be harvested and what must be allowed to recover.';
		case 'archive':
			return 'The archive opens with audience, expiry, and protected names intact.';
		case 'legal-aid':
			return 'The case desk distinguishes evidence from permission to expose it.';
		case 'transit-control':
			return 'The timetable is a proposal with causes, maintainers, and a challenge path.';
	}
}

function serviceOverlayLabel(serviceId: ActiveLocationService): string {
	if (serviceId === 'field-shop') return 'Canonical field shop';
	if (serviceId === 'loadout-locker') return 'Persistent loadout locker';
	return `Canonical ${serviceId ?? 'world'} service`;
}

function serviceOverlayTitle(serviceId: ActiveLocationService): string {
	if (serviceId === 'field-shop') return 'SURVIVAL RETAIL // NO SHADOW SAVE';
	if (serviceId === 'loadout-locker') return 'PUBLIC LOADOUT LOCKER';
	return (serviceId ?? 'WORLD SERVICE').replace(/-/g, ' ').toUpperCase();
}

import type { Scene, SceneContext } from '../engine/SceneManager';
import type { GameFlow } from '../game/GameFlow';
import { resolveInfrastructureNetwork } from '../game/adventure/InfrastructureNetwork';
import {
	evaluateCampaignPhases,
	evaluateFinalDoctrineReadiness,
	type CampaignPhaseAcceptanceReport,
	type FinalDoctrineReadiness,
} from '../game/adventure/CampaignPhaseDirector';
import { resolveSubwayPulse } from '../game/adventure/SubwayPulse';
import type { WorldCommandResult, WorldDirector } from '../game/adventure/WorldDirector';
import {
	type LocationDef,
	getLocationDef,
	getOtherRouteEndpoint,
	getRoutesForLocation,
} from '../game/adventure/WorldGraph';
import { resolveWorldSchedule } from '../game/adventure/WorldSchedule';
import type { Renderer } from '../renderer/Renderer';
import type { AutosaveFeedback } from '../storage/AutosaveFeedback';
import {
	ARCADE_UI_FONT,
	BADGER_UI,
	drawArcadeBackdrop,
	drawArcadeCommandBar,
	drawArcadePanel,
	fitArcadeText,
} from '../ui/ArcadeUi';
import type { ArcadeCommandAction } from '../ui/ArcadeUi';

export interface SubwayMapSceneOptions {
	flow: GameFlow;
	world: WorldDirector;
	onDeployStory?: () => void;
	onOpenLocation?: (locationId: string) => void;
	onAutosaveWorld?: () => AutosaveFeedback | undefined;
	onReturnToTitle?: () => void;
}

const SUBWAY_MAP_COMMANDS: readonly ArcadeCommandAction[] = [
	{
		id: 'select',
		label: 'select place',
		inputs: { keyboard: '← / →', gamepad: 'D-Pad' },
		priority: 10,
	},
	{
		id: 'confirm',
		label: 'travel or deploy',
		inputs: { keyboard: 'Enter', gamepad: 'A' },
		priority: 9,
	},
	{ id: 'return', label: 'return to title', inputs: { keyboard: 'Esc', gamepad: 'B' } },
];

export interface SubwayMapSnapshot {
	currentLocationId: string;
	selectedLocationId: string;
	reachableLocationIds: string[];
	discoveredLocationIds: string[];
	selectedKind: LocationDef['kind'];
	selectedExpeditionStageId?: string;
	subwayEra: string;
	subwayLabel: string;
	networkHealth: number;
	networkLabel: string;
	networkNotices: string[];
	worldBeat: string;
	scheduleLabel: string;
	level: number;
	experience: number;
	campaignPhases: CampaignPhaseAcceptanceReport[];
	activeCampaignPhase: number;
	finalDoctrineReadiness?: FinalDoctrineReadiness;
	message: string;
}

export class SubwayMapScene implements Scene {
	readonly name = 'SubwayMapScene';

	private keyHandler: ((event: KeyboardEvent) => void) | null = null;
	private selectedIndex = 0;
	private message = 'Choose a place, not a disposable run.';

	constructor(private readonly options: SubwayMapSceneOptions) {
		const currentIndex = this.getSelectableLocations().findIndex(
			(location) => location.id === options.world.getState().currentLocationId
		);
		this.selectedIndex = Math.max(0, currentIndex);
	}

	private emitSnapshot(): void {
		if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
		window.dispatchEvent(new CustomEvent('badger:world-map', { detail: this.getSnapshot() }));
	}

	selectLocation(locationId: string): boolean {
		const index = this.getSelectableLocations().findIndex((location) => location.id === locationId);
		if (index < 0) return false;
		this.selectedIndex = index;
		this.message = this.getSelectableLocations()[index]?.description ?? '';
		return true;
	}

	onEnter(_context: SceneContext): void {
		this.keyHandler = (event) => this.handleKeyDown(event);
		window.addEventListener('keydown', this.keyHandler);
		this.emitSnapshot();
	}

	onExit(): void {
		if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
		this.keyHandler = null;
	}

	update(_dt: number): void {}

	render(renderer: Renderer, _alpha: number): void {
		const ctx = renderer.getContext();
		drawArcadeBackdrop(ctx);
		this.renderHeader(ctx);
		this.renderNetwork(ctx);
		this.renderSelection(ctx);
		drawArcadeCommandBar(ctx, SUBWAY_MAP_COMMANDS);
	}

	getSnapshot(): SubwayMapSnapshot {
		const state = this.options.world.getState();
		const selected = this.getSelectedLocation();
		const pulse = resolveSubwayPulse(state, this.options.flow.getStoryProgress());
		const infrastructure = resolveInfrastructureNetwork(
			state,
			this.options.flow.getStoryProgress()
		);
		const schedule = resolveWorldSchedule(state, this.options.flow.getStoryProgress());
		const story = this.options.flow.getStoryProgress();
		const campaignPhases = evaluateCampaignPhases(state, story);
		const activeCampaignPhase = campaignPhases.find((phase) => !phase.ready)?.phase ?? 9;
		const finalDoctrineReadiness = story.finalBroadcastDoctrine
			? evaluateFinalDoctrineReadiness(state, story.finalBroadcastDoctrine)
			: undefined;
		return {
			currentLocationId: state.currentLocationId,
			selectedLocationId: selected.id,
			reachableLocationIds: this.options.world.getReachableLocationIds(),
			discoveredLocationIds: [...state.discoveredLocationIds],
			selectedKind: selected.kind,
			selectedExpeditionStageId: selected.expeditionStageId,
			subwayEra: pulse.era,
			subwayLabel: pulse.label,
			networkHealth: infrastructure.health,
			networkLabel: infrastructure.label,
			networkNotices: infrastructure.notices,
			worldBeat: schedule.beat,
			scheduleLabel: schedule.label,
			level: state.advancement.level,
			experience: state.advancement.experience,
			campaignPhases,
			activeCampaignPhase,
			finalDoctrineReadiness,
			message: this.message,
		};
	}

	moveSelection(delta: number): void {
		const locations = this.getSelectableLocations();
		if (locations.length === 0) return;
		this.selectedIndex = (this.selectedIndex + delta + locations.length) % locations.length;
		this.message = locations[this.selectedIndex]?.description ?? '';
		this.emitSnapshot();
	}

	confirmSelection(): WorldCommandResult | null {
		const selected = this.getSelectedLocation();
		const state = this.options.world.getState();
		let result: WorldCommandResult | null = null;
		if (selected.id !== state.currentLocationId) {
			result = this.options.world.execute({ type: 'travel', destinationId: selected.id });
			if (!result.ok) {
				this.message = this.describeTravelFailure(result.reason);
				return result;
			}
			this.options.onAutosaveWorld?.();
			this.message = `Arrived: ${selected.name}`;
		}
		if (selected.expeditionStageId === this.options.flow.getStoryProgress().currentStageId) {
			this.options.onDeployStory?.();
			return result;
		}
		if (selected.expeditionStageId) {
			this.message = 'This district story is not active yet.';
		} else {
			this.options.onOpenLocation?.(selected.id);
		}
		return result;
	}

	private handleKeyDown(event: KeyboardEvent): void {
		if (event.code === 'Escape') {
			event.preventDefault();
			this.options.onReturnToTitle?.();
			return;
		}
		if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') {
			event.preventDefault();
			this.moveSelection(-1);
			return;
		}
		if (event.code === 'ArrowRight' || event.code === 'ArrowDown') {
			event.preventDefault();
			this.moveSelection(1);
			return;
		}
		if (event.code === 'Enter' || event.code === 'Space') {
			event.preventDefault();
			this.confirmSelection();
		}
	}

	private getSelectableLocations(): LocationDef[] {
		const state = this.options.world.getState();
		const graph = this.options.world.getGraph();
		return graph.locations
			.filter((location) => state.discoveredLocationIds.includes(location.id))
			.sort((a, b) => a.mapX - b.mapX || a.mapY - b.mapY || a.name.localeCompare(b.name));
	}

	private getSelectedLocation(): LocationDef {
		const locations = this.getSelectableLocations();
		return (locations[this.selectedIndex] ??
			getLocationDef(
				this.options.world.getGraph(),
				this.options.world.getState().currentLocationId
			) ??
			locations[0]) as LocationDef;
	}

	private describeTravelFailure(
		reason: Extract<WorldCommandResult, { ok: false }>['reason']
	): string {
		switch (reason) {
			case 'route-locked':
				return 'The route exists, but its machinery is still locked.';
			case 'location-unreachable':
				return 'Travel through adjacent places; the city is not a level menu.';
			case 'location-undiscovered':
				return 'No reliable route to that place has been discovered.';
			default:
				return `Travel unavailable: ${reason.replaceAll('-', ' ')}`;
		}
	}

	private renderHeader(ctx: CanvasRenderingContext2D): void {
		const pulse = resolveSubwayPulse(
			this.options.world.getState(),
			this.options.flow.getStoryProgress()
		);
		const infrastructure = resolveInfrastructureNetwork(
			this.options.world.getState(),
			this.options.flow.getStoryProgress()
		);
		const schedule = resolveWorldSchedule(
			this.options.world.getState(),
			this.options.flow.getStoryProgress()
		);
		const phaseReport = evaluateCampaignPhases(
			this.options.world.getState(),
			this.options.flow.getStoryProgress()
		).find((phase) => !phase.ready);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.font = `700 11px ${ARCADE_UI_FONT}`;
		ctx.textAlign = 'center';
		ctx.fillText(
			fitArcadeText(ctx, `${pulse.label} // PERSISTENT CITY STATE`, ctx.canvas.width - 120),
			ctx.canvas.width / 2,
			42
		);
		ctx.fillStyle = BADGER_UI.text;
		ctx.font = `900 34px ${ARCADE_UI_FONT}`;
		ctx.fillText('SPRAWL TRANSIT MAP', ctx.canvas.width / 2, 82);
		ctx.fillStyle = BADGER_UI.warning;
		ctx.font = `700 9px ${ARCADE_UI_FONT}`;
		ctx.fillText(
			`LVL ${this.options.world.getState().advancement.level} // ${schedule.label} // NETWORK ${infrastructure.health}% // ${phaseReport ? `P${phaseReport.phase} ${phaseReport.metCount}/${phaseReport.totalCount}` : 'P9 READY'}`,
			ctx.canvas.width / 2,
			101
		);
	}

	private renderNetwork(ctx: CanvasRenderingContext2D): void {
		const graph = this.options.world.getGraph();
		const state = this.options.world.getState();
		const selected = this.getSelectedLocation();
		const panel = { x: 34, y: 112, width: ctx.canvas.width - 68, height: 290 };
		drawArcadePanel(ctx, { ...panel, strong: true, label: 'Discovered places and transit' });
		const discovered = new Set(state.discoveredLocationIds);
		const unlocked = new Set(state.unlockedRouteIds);
		const minX = Math.min(...graph.locations.map((location) => location.mapX));
		const maxX = Math.max(...graph.locations.map((location) => location.mapX));
		const scaleX = (panel.width - 86) / Math.max(1, maxX - minX);
		const screen = (location: LocationDef): { x: number; y: number } => ({
			x: panel.x + 42 + (location.mapX - minX) * scaleX,
			y: panel.y + (location.kind === 'station' ? 92 : 156 + location.mapY * 0.17),
		});

		ctx.save();
		for (const route of graph.routes) {
			if (!discovered.has(route.from) || !discovered.has(route.to)) continue;
			const from = getLocationDef(graph, route.from);
			const to = getLocationDef(graph, route.to);
			if (!from || !to) continue;
			const a = screen(from);
			const b = screen(to);
			ctx.strokeStyle = unlocked.has(route.id) ? BADGER_UI.accent : BADGER_UI.muted;
			ctx.globalAlpha = unlocked.has(route.id) ? 0.78 : 0.26;
			ctx.lineWidth = route.mode === 'foot' ? 2 : 5;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
		for (const location of graph.locations.filter((entry) => discovered.has(entry.id))) {
			const point = screen(location);
			const current = location.id === state.currentLocationId;
			const active = location.id === selected.id;
			ctx.fillStyle = current ? BADGER_UI.warning : active ? BADGER_UI.accent : BADGER_UI.text;
			ctx.beginPath();
			ctx.arc(point.x, point.y, current ? 9 : active ? 8 : 5, 0, Math.PI * 2);
			ctx.fill();
			if (active || current || location.kind === 'station') {
				ctx.textAlign = 'center';
				ctx.font = `700 9px ${ARCADE_UI_FONT}`;
				ctx.fillStyle = BADGER_UI.text;
				ctx.fillText(location.name.slice(0, 20), point.x, point.y - 13);
			}
		}
		ctx.restore();
	}

	private renderSelection(ctx: CanvasRenderingContext2D): void {
		const selected = this.getSelectedLocation();
		const state = this.options.world.getState();
		const graph = this.options.world.getGraph();
		const routes = getRoutesForLocation(graph, selected.id);
		const connections = routes
			.map((route) => getOtherRouteEndpoint(route, selected.id))
			.filter((id): id is string => Boolean(id))
			.map((id) => getLocationDef(graph, id)?.name)
			.filter((name): name is string => Boolean(name));
		const x = 70;
		const y = 426;
		const width = ctx.canvas.width - 140;
		drawArcadePanel(ctx, { x, y, width, height: 126, label: selected.kind.toUpperCase() });
		ctx.textAlign = 'left';
		ctx.font = `800 18px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = selected.id === state.currentLocationId ? BADGER_UI.warning : BADGER_UI.accent;
		ctx.fillText(selected.name, x + 18, y + 34);
		ctx.font = `11px ${ARCADE_UI_FONT}`;
		ctx.fillStyle = BADGER_UI.text;
		ctx.fillText(selected.description.slice(0, 92), x + 18, y + 56);
		ctx.fillStyle = BADGER_UI.muted;
		ctx.fillText(`Connections: ${connections.join(' • ').slice(0, 90)}`, x + 18, y + 78);
		ctx.fillStyle = BADGER_UI.warning;
		ctx.fillText(this.message.slice(0, 96), x + 18, y + 102);
	}
}

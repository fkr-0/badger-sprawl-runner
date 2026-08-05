import type { Player } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import type { EnemyCohesionSystem } from './EnemyCohesionSystem';
import type {
	EnemyCommunicationEvent,
	EnemyCommunicationNetwork,
} from './EnemyCommunicationNetwork';
import type { ActionMap } from './InputSystem';
import type { CivilianEvacuationRoute } from '../world/EncounterTopology';

export type CivilianWitnessDisposition =
	| 'precarious'
	| 'mutual-aid'
	| 'authority-dependent'
	| 'independent-receiver';

export type CivilianWitnessState =
	| 'observing'
	| 'documenting'
	| 'evacuating'
	| 'sheltering'
	| 'withdrawn';

export interface CivilianWitnessDef {
	id: string;
	stageId: string;
	label: string;
	x: number;
	y: number;
	radius: number;
	initialTrust: number;
	disposition: CivilianWitnessDisposition;
	decoyOffset: number;
}

interface CivilianWitnessRuntime extends CivilianWitnessDef {
	trust: number;
	stress: number;
	state: CivilianWitnessState;
	reportCooldown: number;
	documentedIncidents: number;
	standDownCells: Set<string>;
	evacuationRoute?: CivilianEvacuationRoute;
	evacuationWaypointIndex: number;
	evacuationAnnounced: boolean;
}

export type CivilianWitnessEvent =
	| {
			kind: 'civilian-warning' | 'civilian-misdirection';
			witnessId: string;
			cellId: string;
			x: number;
			y: number;
			trust: number;
		}
	| {
			kind: 'civilian-stand-down-appeal';
			witnessId: string;
			cellId: string;
			legitimacy: number;
		}
	| {
			kind: 'civilian-documented' | 'civilian-withdrew';
			witnessId: string;
			trust: number;
			stress: number;
		}
	| {
			kind: 'civilian-evacuating' | 'civilian-sheltered';
			witnessId: string;
			routeId: string;
			x: number;
			y: number;
		};

export interface CivilianWitnessStepResult {
	events: CivilianWitnessEvent[];
	communicationEvents: EnemyCommunicationEvent[];
}

export const CIVILIAN_WITNESS_CATALOG: readonly CivilianWitnessDef[] = [
	{
		id: 'listener-appeal-booth',
		stageId: 'antenna-barrens',
		label: 'Listener Appeal Booth',
		x: 980,
		y: 400,
		radius: 330,
		initialTrust: 0.58,
		disposition: 'mutual-aid',
		decoyOffset: -420,
	},
	{
		id: 'witness-container-c19',
		stageId: 'orbital-lift',
		label: 'Witness Container C-19',
		x: 1500,
		y: 400,
		radius: 350,
		initialTrust: 0.46,
		disposition: 'precarious',
		decoyOffset: 480,
	},
	{
		id: 'return-receiver-three',
		stageId: 'asteroid-redoubt',
		label: 'Independent Return Receiver Three',
		x: 1740,
		y: 390,
		radius: 370,
		initialTrust: 0.64,
		disposition: 'independent-receiver',
		decoyOffset: -520,
	},
];

/**
 * Bounded civilian reactions for authored encounter spaces.
 *
 * Witnesses are local knowledge actors, not a global reputation meter. They
 * observe nearby conduct, remember public aid, and may report, misdirect, leave,
 * document, or support a stand-down. Their claims enter the same report ledger
 * and district trust doctrine as alarms and enemies.
 */
export class CivilianWitnessSystem {
	private readonly witnesses: CivilianWitnessRuntime[];

	constructor(
		private readonly stageId: string,
		definitions: readonly CivilianWitnessDef[] = CIVILIAN_WITNESS_CATALOG
	) {
		this.witnesses = definitions
			.filter((witness) => witness.stageId === stageId)
			.map((witness) => ({
				...witness,
				trust: clamp01(witness.initialTrust),
				stress: 0,
				state: 'observing',
				reportCooldown: 0,
				documentedIncidents: 0,
				standDownCells: new Set<string>(),
				evacuationWaypointIndex: 0,
				evacuationAnnounced: false,
			}));
	}

	configureEvacuationRoutes(routes: readonly CivilianEvacuationRoute[]): void {
		for (const witness of this.witnesses) {
			const route = [...routes]
				.filter((candidate) => candidate.waypoints.length >= 2)
				.sort((a, b) => {
					const aStart = a.waypoints[0] as { x: number; y: number };
					const bStart = b.waypoints[0] as { x: number; y: number };
					const aDistance = Math.hypot(aStart.x - witness.x, aStart.y - witness.y);
					const bDistance = Math.hypot(bStart.x - witness.x, bStart.y - witness.y);
					return aDistance - bDistance || a.id.localeCompare(b.id);
				})[0];
			witness.evacuationRoute = route
				? { ...route, waypoints: route.waypoints.map((point) => ({ ...point })) }
				: undefined;
			witness.evacuationWaypointIndex = 0;
			witness.evacuationAnnounced = false;
		}
	}

	recordPublicAid(witnessId: string, amount = 0.2): CivilianWitnessEvent[] {
		const witness = this.witnesses.find((candidate) => candidate.id === witnessId);
		if (!witness || witness.state === 'withdrawn' || !Number.isFinite(amount) || amount <= 0) {
			return [];
		}
		witness.trust = clamp01(witness.trust + amount);
		witness.stress = clamp01(witness.stress - amount * 0.6);
		witness.state = 'documenting';
		witness.documentedIncidents += 1;
		return [
			{
				kind: 'civilian-documented',
				witnessId,
				trust: witness.trust,
				stress: witness.stress,
			},
		];
	}

	recordAuthorityHarm(witnessId: string, severity = 0.25): CivilianWitnessEvent[] {
		const witness = this.witnesses.find((candidate) => candidate.id === witnessId);
		if (!witness || witness.state === 'withdrawn' || !Number.isFinite(severity) || severity <= 0) {
			return [];
		}
		witness.trust = clamp01(witness.trust + severity * 0.45);
		witness.stress = clamp01(witness.stress + severity);
		witness.state = 'documenting';
		witness.documentedIncidents += 1;
		return [
			{
				kind: 'civilian-documented',
				witnessId,
				trust: witness.trust,
				stress: witness.stress,
			},
		];
	}

	step(
		player: Player,
		action: ActionMap,
		enemies: CombatEntity[],
		dt: number,
		communication: Pick<EnemyCommunicationNetwork, 'reportLocalIncident'>,
		cohesion: Pick<EnemyCohesionSystem, 'offerStandDown'>
	): CivilianWitnessStepResult {
		const safeDt = Math.max(0, dt);
		const events: CivilianWitnessEvent[] = [];
		const communicationEvents: EnemyCommunicationEvent[] = [];
		const playerX = player.x + player.w / 2;
		const playerY = player.y + player.h / 2;
		const violentAction = action.shootPressed || action.meleePressed;

		for (const witness of this.witnesses) {
			if (witness.state === 'withdrawn') continue;
			if (witness.state === 'evacuating') {
				this.stepEvacuation(witness, safeDt, events);
				continue;
			}
			witness.reportCooldown = Math.max(0, witness.reportCooldown - safeDt);
			const distanceToPlayer = Math.hypot(playerX - witness.x, playerY - witness.y);
			const nearbyLiving = enemies.filter(
				(enemy) =>
					enemy.hp > 0 &&
					Math.hypot(enemy.x + enemy.w / 2 - witness.x, enemy.y + enemy.h / 2 - witness.y) <=
						witness.radius
			);
			const nearbyEngaged = nearbyLiving.some((enemy) => enemy.awarenessState === 'engaged');

			if (violentAction && distanceToPlayer <= witness.radius) {
				const unjustified = !nearbyEngaged;
				witness.stress = clamp01(witness.stress + (unjustified ? 0.34 : 0.18));
				witness.trust = clamp01(witness.trust - (unjustified ? 0.2 : 0.04));
				witness.state = 'documenting';
				witness.documentedIncidents += 1;
				events.push({
					kind: 'civilian-documented',
					witnessId: witness.id,
					trust: witness.trust,
					stress: witness.stress,
				});
			} else {
				witness.stress = Math.max(0, witness.stress - safeDt * 0.06);
				if (witness.state === 'sheltering' && witness.stress < 0.35) witness.state = 'observing';
			}

			if (
				witness.evacuationRoute &&
				witness.stress >= 0.55 &&
				(nearbyEngaged || violentAction)
			) {
				witness.state = 'evacuating';
				witness.evacuationWaypointIndex = nearestWaypointIndex(
					witness.evacuationRoute,
					witness.x,
					witness.y
				);
				if (!witness.evacuationAnnounced) {
					witness.evacuationAnnounced = true;
					events.push({
						kind: 'civilian-evacuating',
						witnessId: witness.id,
						routeId: witness.evacuationRoute.id,
						x: witness.x,
						y: witness.y,
					});
				}
				continue;
			}

			for (const enemy of nearbyLiving) {
				if (
					enemy.cohesionState !== 'wavering' ||
					!enemy.communicationCellId ||
					witness.trust < 0.74 ||
					witness.standDownCells.has(enemy.communicationCellId)
				) {
					continue;
				}
				cohesion.offerStandDown(enemy.communicationCellId, witness.trust);
				witness.standDownCells.add(enemy.communicationCellId);
				events.push({
					kind: 'civilian-stand-down-appeal',
					witnessId: witness.id,
					cellId: enemy.communicationCellId,
					legitimacy: witness.trust,
				});
			}

			if (witness.stress < 0.68 || witness.reportCooldown > 0 || distanceToPlayer > witness.radius) {
				continue;
			}
			const cellIndex = Math.floor(Math.max(0, witness.x) / 460);
			const cellId = `${this.stageId}:cell:${cellIndex}`;
			const misdirect = witness.trust >= 0.62;
			const reportX = misdirect ? Math.max(0, witness.x + witness.decoyOffset) : playerX;
			const reportY = misdirect ? witness.y : playerY;
			communicationEvents.push(
				...communication.reportLocalIncident(
					this.stageId,
					witness.x,
					reportX,
					reportY,
					misdirect ? 0.7 : 0.82,
					witness.id,
					'civilian-witness'
				)
			);
			events.push({
				kind: misdirect ? 'civilian-misdirection' : 'civilian-warning',
				witnessId: witness.id,
				cellId,
				x: reportX,
				y: reportY,
				trust: witness.trust,
			});
			witness.reportCooldown = 6;
			witness.stress *= 0.42;
			witness.state = 'sheltering';

			if (witness.trust < 0.18 && witness.documentedIncidents >= 2) {
				witness.state = 'withdrawn';
				events.push({
					kind: 'civilian-withdrew',
					witnessId: witness.id,
					trust: witness.trust,
					stress: witness.stress,
				});
			}
		}

		return { events, communicationEvents };
	}

	private stepEvacuation(
		witness: CivilianWitnessRuntime,
		dt: number,
		events: CivilianWitnessEvent[]
	): void {
		const route = witness.evacuationRoute;
		if (!route) {
			witness.state = 'sheltering';
			return;
		}
		const target = route.waypoints[witness.evacuationWaypointIndex];
		if (!target) {
			witness.state = 'sheltering';
			events.push({
				kind: 'civilian-sheltered',
				witnessId: witness.id,
				routeId: route.id,
				x: witness.x,
				y: witness.y,
			});
			return;
		}
		const dx = target.x - witness.x;
		const dy = target.y - witness.y;
		const distance = Math.hypot(dx, dy);
		if (distance <= 8) {
			witness.x = target.x;
			witness.y = target.y;
			witness.evacuationWaypointIndex += 1;
			if (witness.evacuationWaypointIndex >= route.waypoints.length) {
				witness.state = 'sheltering';
				events.push({
					kind: 'civilian-sheltered',
					witnessId: witness.id,
					routeId: route.id,
					x: witness.x,
					y: witness.y,
				});
			}
			return;
		}
		const movement = Math.min(distance, Math.max(0, dt) * 76);
		witness.x += (dx / distance) * movement;
		witness.y += (dy / distance) * movement;
		witness.stress = Math.max(0, witness.stress - Math.max(0, dt) * 0.03);
	}

	getSnapshot(): Array<{
		id: string;
		label: string;
		x: number;
		y: number;
		trust: number;
		stress: number;
		state: CivilianWitnessState;
		disposition: CivilianWitnessDisposition;
		documentedIncidents: number;
		evacuationRouteId?: string;
		evacuationWaypointIndex: number;
		evacuationCue?: string;
		evacuationWaypoints: Array<{ x: number; y: number }>;
	}> {
		return this.witnesses.map((witness) => ({
			id: witness.id,
			label: witness.label,
			x: witness.x,
			y: witness.y,
			trust: witness.trust,
			stress: witness.stress,
			state: witness.state,
			disposition: witness.disposition,
			documentedIncidents: witness.documentedIncidents,
			evacuationRouteId: witness.evacuationRoute?.id,
			evacuationWaypointIndex: witness.evacuationWaypointIndex,
			evacuationCue: witness.evacuationRoute?.accessibilityCue,
			evacuationWaypoints:
				witness.evacuationRoute?.waypoints.map((point) => ({ ...point })) ?? [],
		}));
	}
}

function nearestWaypointIndex(route: CivilianEvacuationRoute, x: number, y: number): number {
	let bestIndex = 0;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const [index, point] of route.waypoints.entries()) {
		const distance = Math.hypot(point.x - x, point.y - y);
		if (distance < bestDistance) {
			bestIndex = index;
			bestDistance = distance;
		}
	}
	return bestIndex;
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

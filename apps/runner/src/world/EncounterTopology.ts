import { RESOLUTION_APPROACHES, type ResolutionApproach } from '../game/ResolutionApproach';

export interface EncounterZone {
	id: string;
	label: string;
	x: number;
	y: number;
	w: number;
	h: number;
	major: boolean;
	tags: string[];
}

export interface EncounterTrapDef {
	id: string;
	label: string;
	x: number;
	y: number;
	triggerRadius: number;
	hackRadius: number;
	cooldownSeconds: number;
	intensity: number;
	soundRadius: number;
	decoyOffset: number;
	tags: string[];
}

export interface EncounterPortal {
	id: string;
	fromZoneId: string;
	toZoneId: string;
	x: number;
	y: number;
	w: number;
	h: number;
	visionTransmission: number;
	soundTransmission: number;
	defaultOpen: boolean;
	tags: string[];
}

export interface EncounterOccluder {
	id: string;
	x: number;
	y: number;
	w: number;
	h: number;
	blocksVision: boolean;
	soundLoss: number;
	destructible?: boolean;
	tags: string[];
}

export interface CivilianEvacuationRoute {
	id: string;
	fromZoneId: string;
	toZoneId: string;
	waypoints: Array<{ x: number; y: number }>;
	trigger: 'alarm' | 'combat' | 'retreat' | 'stand-down';
	capacity: number;
	accessibilityCue: string;
}

export interface EncounterApproachPlan {
	id: string;
	zoneId: string;
	label: string;
	approaches: ResolutionApproach[];
	entryPortalIds: string[];
	requiredTags: string[];
	risk: 'low' | 'medium' | 'high';
	playerCue: string;
	worldConsequenceHint: string;
}

export interface StageEncounterTopology {
	stageId: string;
	zones: EncounterZone[];
	portals: EncounterPortal[];
	occluders: EncounterOccluder[];
	traps?: EncounterTrapDef[];
	civilianRoutes: CivilianEvacuationRoute[];
	approachPlans: EncounterApproachPlan[];
}

export interface EncounterPortalState {
	open?: boolean;
	visionTransmission?: number;
	soundTransmission?: number;
}

export interface EncounterRouteResult {
	fromZoneId: string;
	toZoneId: string;
	portalIds: string[];
	transmission: number;
}

export interface EncounterTopologyIssue {
	code:
		| 'duplicate-id'
		| 'invalid-geometry'
		| 'unknown-zone'
		| 'unknown-portal'
		| 'invalid-transmission'
		| 'invalid-approach'
		| 'invalid-trap'
		| 'insufficient-approach-plans'
		| 'duplicate-approach-plan'
		| 'invalid-civilian-route';
	message: string;
	refId: string;
}

const VALID_APPROACHES = new Set<ResolutionApproach>(RESOLUTION_APPROACHES);

export function cloneEncounterTopology(topology: StageEncounterTopology): StageEncounterTopology {
	return {
		stageId: topology.stageId,
		zones: topology.zones.map((zone) => ({ ...zone, tags: [...zone.tags] })),
		portals: topology.portals.map((portal) => ({ ...portal, tags: [...portal.tags] })),
		occluders: topology.occluders.map((occluder) => ({ ...occluder, tags: [...occluder.tags] })),
		traps: (topology.traps ?? []).map((trap) => ({ ...trap, tags: [...trap.tags] })),
		civilianRoutes: topology.civilianRoutes.map((route) => ({
			...route,
			waypoints: route.waypoints.map((point) => ({ ...point })),
		})),
		approachPlans: topology.approachPlans.map((plan) => ({
			...plan,
			approaches: [...plan.approaches],
			entryPortalIds: [...plan.entryPortalIds],
			requiredTags: [...plan.requiredTags],
		})),
	};
}

export function validateEncounterTopology(topology: StageEncounterTopology): EncounterTopologyIssue[] {
	const issues: EncounterTopologyIssue[] = [];
	const allIds = [
		...topology.zones.map((entry) => entry.id),
		...topology.portals.map((entry) => entry.id),
		...topology.occluders.map((entry) => entry.id),
		...(topology.traps ?? []).map((entry) => entry.id),
		...topology.civilianRoutes.map((entry) => entry.id),
		...topology.approachPlans.map((entry) => entry.id),
	];
	for (const id of new Set(allIds)) {
		if (allIds.filter((candidate) => candidate === id).length > 1) {
			issues.push({ code: 'duplicate-id', message: `Encounter topology id ${id} is not unique.`, refId: id });
		}
	}
	for (const trap of topology.traps ?? []) {
		if (
			![trap.x, trap.y, trap.triggerRadius, trap.hackRadius, trap.cooldownSeconds, trap.intensity, trap.soundRadius, trap.decoyOffset].every(Number.isFinite) ||
			trap.triggerRadius <= 0 ||
			trap.hackRadius <= 0 ||
			trap.cooldownSeconds < 0 ||
			trap.intensity < 0 ||
			trap.intensity > 1 ||
			trap.soundRadius <= 0
		) {
			issues.push({ code: 'invalid-trap', message: `Trap ${trap.id} has invalid acoustic geometry.`, refId: trap.id });
		}
	}
	const zoneIds = new Set(topology.zones.map((zone) => zone.id));
	const portalIds = new Set(topology.portals.map((portal) => portal.id));
	for (const zone of topology.zones) {
		if (![zone.x, zone.y, zone.w, zone.h].every(Number.isFinite) || zone.w <= 0 || zone.h <= 0) {
			issues.push({ code: 'invalid-geometry', message: `Zone ${zone.id} has invalid bounds.`, refId: zone.id });
		}
	}
	for (const portal of topology.portals) {
		if (!zoneIds.has(portal.fromZoneId) || !zoneIds.has(portal.toZoneId)) {
			issues.push({ code: 'unknown-zone', message: `Portal ${portal.id} references an unknown zone.`, refId: portal.id });
		}
		if (
			![portal.visionTransmission, portal.soundTransmission].every(
				(value) => Number.isFinite(value) && value >= 0 && value <= 1
			)
		) {
			issues.push({ code: 'invalid-transmission', message: `Portal ${portal.id} has invalid transmission.`, refId: portal.id });
		}
		if (![portal.x, portal.y, portal.w, portal.h].every(Number.isFinite) || portal.w <= 0 || portal.h <= 0) {
			issues.push({ code: 'invalid-geometry', message: `Portal ${portal.id} has invalid bounds.`, refId: portal.id });
		}
	}
	for (const route of topology.civilianRoutes) {
		if (!zoneIds.has(route.fromZoneId) || !zoneIds.has(route.toZoneId) || route.waypoints.length < 2 || route.capacity <= 0) {
			issues.push({ code: 'invalid-civilian-route', message: `Civilian route ${route.id} is incomplete.`, refId: route.id });
		}
	}
	for (const plan of topology.approachPlans) {
		if (!zoneIds.has(plan.zoneId)) {
			issues.push({ code: 'unknown-zone', message: `Approach ${plan.id} references unknown zone ${plan.zoneId}.`, refId: plan.id });
		}
		if (plan.entryPortalIds.some((portalId) => !portalIds.has(portalId))) {
			issues.push({ code: 'unknown-portal', message: `Approach ${plan.id} references an unknown portal.`, refId: plan.id });
		}
		if (plan.approaches.length === 0 || plan.approaches.some((approach) => !VALID_APPROACHES.has(approach))) {
			issues.push({ code: 'invalid-approach', message: `Approach ${plan.id} has no valid resolution method.`, refId: plan.id });
		}
	}
	for (const zone of topology.zones.filter((candidate) => candidate.major)) {
		const plans = topology.approachPlans.filter((plan) => plan.zoneId === zone.id);
		if (plans.length < 2) {
			issues.push({
				code: 'insufficient-approach-plans',
				message: `Major zone ${zone.id} exposes ${plans.length} approach plan(s); two are required.`,
				refId: zone.id,
			});
			continue;
		}
		const signatures = new Set(plans.map((plan) => [...plan.approaches].sort().join('|')));
		if (signatures.size < 2) {
			issues.push({
				code: 'duplicate-approach-plan',
				message: `Major zone ${zone.id} repeats one approach signature.`,
				refId: zone.id,
			});
		}
	}
	return issues.sort((a, b) => a.refId.localeCompare(b.refId) || a.code.localeCompare(b.code));
}

export function getEncounterZoneAtPoint(
	topology: StageEncounterTopology,
	x: number,
	y: number
): EncounterZone | undefined {
	return [...topology.zones]
		.filter((zone) => x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h)
		.sort((a, b) => Number(b.major) - Number(a.major) || a.w * a.h - b.w * b.h || a.id.localeCompare(b.id))[0];
}

export function findEncounterRoute(
	topology: StageEncounterTopology,
	fromZoneId: string,
	toZoneId: string,
	channel: 'vision' | 'sound',
	portalStates: Readonly<Record<string, EncounterPortalState>> = {},
	maxHops = 4
): EncounterRouteResult | null {
	if (fromZoneId === toZoneId) {
		return { fromZoneId, toZoneId, portalIds: [], transmission: 1 };
	}
	const queue: EncounterRouteResult[] = [
		{ fromZoneId, toZoneId: fromZoneId, portalIds: [], transmission: 1 },
	];
	const best = new Map<string, number>([[fromZoneId, 1]]);
	let winner: EncounterRouteResult | null = null;
	while (queue.length > 0) {
		queue.sort(
			(a, b) => b.transmission - a.transmission || a.portalIds.join('|').localeCompare(b.portalIds.join('|'))
		);
		const current = queue.shift() as EncounterRouteResult;
		if (current.portalIds.length >= maxHops) continue;
		const portals = topology.portals
			.filter((portal) => portal.fromZoneId === current.toZoneId || portal.toZoneId === current.toZoneId)
			.sort((a, b) => a.id.localeCompare(b.id));
		for (const portal of portals) {
			const override = portalStates[portal.id];
			const open = override?.open ?? portal.defaultOpen;
			if (!open) continue;
			const transmission =
				channel === 'vision'
					? override?.visionTransmission ?? portal.visionTransmission
					: override?.soundTransmission ?? portal.soundTransmission;
			if (transmission <= 0) continue;
			const nextZoneId =
				portal.fromZoneId === current.toZoneId ? portal.toZoneId : portal.fromZoneId;
			const nextTransmission = current.transmission * transmission;
			if (nextTransmission <= (best.get(nextZoneId) ?? 0)) continue;
			const next: EncounterRouteResult = {
				fromZoneId,
				toZoneId: nextZoneId,
				portalIds: [...current.portalIds, portal.id],
				transmission: nextTransmission,
			};
			best.set(nextZoneId, nextTransmission);
			if (nextZoneId === toZoneId) {
				if (!winner || nextTransmission > winner.transmission) winner = next;
			} else queue.push(next);
		}
	}
	return winner;
}

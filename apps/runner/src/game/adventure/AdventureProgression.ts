import type { StoryProgress } from '../GameFlow';
import { createDefaultAdventureSave, type AdventureSaveV2 } from './AdventureState';
import {
	ADVENTURE_TRAVEL_GRAPH,
	getDistrictForStage,
	type DistrictDef,
	type TravelGraph,
} from './WorldGraph';
import type { WorldCommand } from './WorldDirector';
import { WorldDirector } from './WorldDirector';

export function createAdventureSaveFromStoryProgress(
	storyProgress: StoryProgress,
	graph: TravelGraph = ADVENTURE_TRAVEL_GRAPH
): AdventureSaveV2 {
	const state = createDefaultAdventureSave();
	const world = new WorldDirector(graph, state);
	for (const stageId of storyProgress.completedStageIds) {
		applyStageCompletion(world, stageId, graph, false);
	}
	if (storyProgress.campaignComplete || storyProgress.completedStageIds.includes('asteroid-redoubt')) {
		world.execute({ type: 'discover-location', locationId: 'lower-sprawl:station' });
		world.debugTravelTo('lower-sprawl:station', 'arrival');
		world.execute({
			type: 'set-respawn',
			locationId: 'lower-sprawl:safehouse',
			spawnId: 'respawn',
		});
		return world.getState();
	}
	const current = getDistrictForStage(graph, storyProgress.currentStageId);
	if (current) {
		discoverDistrictApproach(world, current);
		world.debugTravelTo(current.safehouseId, 'arrival');
		world.execute({ type: 'set-respawn', locationId: current.safehouseId, spawnId: 'respawn' });
	}
	return world.getState();
}

export function applyStageCompletion(
	world: WorldDirector,
	stageId: string,
	graph: TravelGraph = ADVENTURE_TRAVEL_GRAPH,
	returnToSafehouse = true
): void {
	const district = getDistrictForStage(graph, stageId);
	if (!district) return;
	for (const command of districtCompletionCommands(graph, district, returnToSafehouse)) {
		world.execute(command);
	}
}

export function districtCompletionCommands(
	graph: TravelGraph,
	district: DistrictDef,
	returnToSafehouse = true
): WorldCommand[] {
	const commands: WorldCommand[] = [];
	for (const locationId of [
		district.safehouseId,
		district.settlementId,
		district.routeId,
		district.strongholdId,
		district.stationId,
	]) {
		commands.push({ type: 'discover-location', locationId });
	}
	for (const route of graph.routes.filter(
		(route) => route.from.startsWith(`${district.id}:`) && route.to.startsWith(`${district.id}:`)
	)) {
		commands.push({ type: 'unlock-route', routeId: route.id });
	}
	commands.push({ type: 'set-district-phase', districtId: district.id, phase: 'transformed' });
	commands.push({ type: 'set-world-flag', flag: `${district.id}:story-complete` });
	if (district.id === 'lower-sprawl') {
		commands.push(
			{ type: 'set-world-flag', flag: 'lower-sprawl:blue-mercy-public' },
			{
				type: 'set-service-level',
				locationId: district.safehouseId,
				serviceId: 'repair-bench',
				level: 1,
			},
			{
				type: 'set-service-level',
				locationId: district.stationId,
				serviceId: 'transit-control',
				level: 1,
			},
			{
				type: 'set-service-level',
				locationId: district.stationId,
				serviceId: 'signal-lab',
				level: 1,
			},
			{ type: 'relocate-npc', npcId: 'sister-version', locationId: district.stationId },
			{ type: 'relocate-npc', npcId: 'murr-murrby', locationId: district.stationId }
		);
	}
	const homecoming = district.id === 'orbital-lift';
	const commonsDawn = district.id === 'asteroid-redoubt';
	if (homecoming) {
		commands.push(
			{ type: 'set-world-flag', flag: 'homecoming:return-delegation-arrived' },
			{ type: 'relocate-npc', npcId: 'rook-null', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'naya-root', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'juno-jar', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'orchid-debt', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'bassie-knot', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'coco-loop', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'portia-drift', locationId: 'orbital-lift:station' },
			{ type: 'relocate-npc', npcId: 'old-quasar-jones', locationId: 'orbital-lift:station' },
			{ type: 'relocate-npc', npcId: 'ames-oxygen', locationId: 'orbital-lift:settlement' },
			{ type: 'relocate-npc', npcId: 'lio-vale', locationId: 'orbital-lift:settlement' }
		);
	}
	if (commonsDawn) {
		commands.push(
			{ type: 'discover-location', locationId: 'lower-sprawl:station' },
			{ type: 'set-world-flag', flag: 'commons:return-signal-open' },
			{ type: 'set-world-flag', flag: 'commons:toolkits-mirrored' },
			{ type: 'relocate-npc', npcId: 'choir-of-static', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'little-ix', locationId: 'lower-sprawl:station' },
			{ type: 'relocate-npc', npcId: 'witness-zero', locationId: 'drainmarket:settlement' },
			{ type: 'relocate-npc', npcId: 'return-signal-sam', locationId: 'asteroid-redoubt:station' },
			{ type: 'relocate-npc', npcId: 'aunt-aster', locationId: 'asteroid-redoubt:safehouse' }
		);
	}
	const returnsToCity = homecoming || commonsDawn;
	commands.push({
		type: 'set-respawn',
		locationId: returnsToCity ? 'lower-sprawl:safehouse' : district.safehouseId,
		spawnId: 'respawn',
	});
	if (returnToSafehouse) {
		commands.push({
			type: 'debug-travel',
			destinationId: returnsToCity ? 'lower-sprawl:station' : district.safehouseId,
			spawnId: returnsToCity ? 'arrival' : 'respawn',
		});
	}

	const index = graph.districts.findIndex((entry) => entry.id === district.id);
	const next = graph.districts[index + 1];
	if (next) {
		for (const locationId of [next.safehouseId, next.settlementId, next.routeId, next.stationId]) {
			commands.push({ type: 'discover-location', locationId });
		}
		const nextRouteIds = [
			`${next.id}:safehouse-settlement`,
			`${next.id}:settlement-route`,
			`${next.id}:settlement-station`,
		];
		if (district.id === 'orbital-lift') {
			nextRouteIds.push(
				'homecoming:orbital-lift:lower-sprawl',
				'launch:lower-sprawl:asteroid-redoubt'
			);
		} else {
			nextRouteIds.push(`transit:${district.id}:${next.id}`);
		}
		for (const routeId of nextRouteIds) {
			commands.push({ type: 'unlock-route', routeId });
		}
		commands.push({ type: 'set-district-phase', districtId: next.id, phase: 'contested' });
	}
	return commands;
}

function discoverDistrictApproach(world: WorldDirector, district: DistrictDef): void {
	for (const locationId of [
		district.safehouseId,
		district.settlementId,
		district.routeId,
		district.stationId,
	]) {
		world.execute({ type: 'discover-location', locationId });
	}
	for (const routeId of [
		`${district.id}:safehouse-settlement`,
		`${district.id}:settlement-route`,
		`${district.id}:settlement-station`,
	]) {
		world.execute({ type: 'unlock-route', routeId });
	}
	world.execute({ type: 'set-district-phase', districtId: district.id, phase: 'contested' });
}

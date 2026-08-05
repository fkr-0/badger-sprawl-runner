import {
	DEFAULT_ADVENTURE_LOCATION_ID,
	DEFAULT_ADVENTURE_SPAWN_ID,
	type DistrictStoryPhase,
} from './AdventureState';

export type LocationKind = 'safehouse' | 'settlement' | 'route' | 'stronghold' | 'station';
export type TravelMode = 'foot' | 'subway' | 'lift' | 'shuttle';

export interface LocationSpawnDef {
	id: string;
	label: string;
}

export interface LocationDef {
	id: string;
	districtId: string;
	stageId: string;
	kind: LocationKind;
	name: string;
	description: string;
	mapX: number;
	mapY: number;
	spawns: LocationSpawnDef[];
	defaultSpawnId: string;
	expeditionStageId?: string;
}

export interface TravelRouteDef {
	id: string;
	from: string;
	to: string;
	mode: TravelMode;
	label: string;
}

export interface DistrictDef {
	id: string;
	stageId: string;
	name: string;
	settlementId: string;
	routeId: string;
	strongholdId: string;
	safehouseId: string;
	stationId: string;
	postStoryPhase: DistrictStoryPhase;
}

export interface TravelGraph {
	revision: number;
	locations: LocationDef[];
	routes: TravelRouteDef[];
	districts: DistrictDef[];
}

interface DistrictBlueprint {
	id: string;
	name: string;
	safehouse: string;
	settlement: string;
	route: string;
	stronghold: string;
	station: string;
	travelModeToNext: TravelMode;
}

const DISTRICT_BLUEPRINTS: DistrictBlueprint[] = [
	{
		id: 'lower-sprawl',
		name: 'Lower Sprawl',
		safehouse: "Auntie Subharmonic's Relay",
		settlement: 'Drainmarket Edge',
		route: 'Neon Awning Mile',
		stronghold: 'Old Toll Office',
		station: 'Toll Line Relay',
		travelModeToNext: 'subway',
	},
	{
		id: 'drainmarket',
		name: 'Drainmarket',
		safehouse: 'Mutual-Aid Clinic Loft',
		settlement: 'Drainmarket Commons',
		route: 'Invoice Canal',
		stronghold: 'Knife-Drone Nest',
		station: 'Floodline Platform',
		travelModeToNext: 'subway',
	},
	{
		id: 'chrome-arcology',
		name: 'Chrome Arcology',
		safehouse: 'Labor Floor B2 Canteen',
		settlement: 'Service Atrium',
		route: 'Glass Freight Spine',
		stronghold: "Madame Vitrine's Gallery",
		station: 'Cargo Lift Interchange',
		travelModeToNext: 'lift',
	},
	{
		id: 'mirror-palace',
		name: 'Mirror Palace',
		safehouse: "Lio's Backstage Room",
		settlement: 'Banquet Servants’ Court',
		route: 'Reflection Switchback',
		stronghold: 'The Contract Ballroom',
		station: 'False-World Tram',
		travelModeToNext: 'shuttle',
	},
	{
		id: 'dub-colony',
		name: 'Dub Colony',
		safehouse: 'Auntie’s Repair Bay',
		settlement: 'Speaker Garden Assembly',
		route: 'Bassline Causeway',
		stronghold: 'King Feedback’s Command Deck',
		station: 'Chorus Rail',
		travelModeToNext: 'subway',
	},
	{
		id: 'antenna-barrens',
		name: 'Antenna Barrens',
		safehouse: 'Pirate Mast Shelter',
		settlement: 'Signal Scavenger Camp',
		route: 'Static Pilgrim Road',
		stronghold: 'Ledger Broadcast Array',
		station: 'Dead-Air Terminal',
		travelModeToNext: 'lift',
	},
	{
		id: 'orbital-lift',
		name: 'Orbital Lift',
		safehouse: 'Cargo Union Galley',
		settlement: 'Freight Worker Concourse',
		route: 'Counterweight Spine',
		stronghold: 'Authority Cargo Crown',
		station: 'Skylock Elevator',
		travelModeToNext: 'shuttle',
	},
	{
		id: 'asteroid-redoubt',
		name: 'Asteroid Redoubt',
		safehouse: 'Free Transmitter Workshop',
		settlement: 'Redoubt Commons',
		route: 'Vacuum Service Ring',
		stronghold: 'The Skylock Core',
		station: 'Return Signal Dock',
		travelModeToNext: 'shuttle',
	},
];

function location(
	district: DistrictBlueprint,
	kind: LocationKind,
	name: string,
	index: number,
	localIndex: number
): LocationDef {
	const id = `${district.id}:${kind}`;
	const descriptions: Record<LocationKind, string> = {
		safehouse: 'Persistent recovery, planning, loadout, and trusted-character space.',
		settlement: 'Civilian services, conversations, rumors, and visible district consequences.',
		route: 'Authored traversal and encounter space with multiple approaches.',
		stronghold: 'District climax, heist objective, and boss-pressure space.',
		station: 'Transit node connecting the district to the expanding network.',
	};
	return {
		id,
		districtId: district.id,
		stageId: district.id,
		kind,
		name,
		description: descriptions[kind],
		mapX: 84 + index * 108 + localIndex * 10,
		mapY: kind === 'station' ? 160 : 250 + localIndex * 46,
		spawns: [
			{ id: 'arrival', label: 'Arrival' },
			{ id: 'respawn', label: 'Recovery point' },
		],
		defaultSpawnId: 'arrival',
		expeditionStageId: kind === 'route' || kind === 'stronghold' ? district.id : undefined,
	};
}

function buildDistrictLocations(district: DistrictBlueprint, index: number): LocationDef[] {
	return [
		location(district, 'safehouse', district.safehouse, index, 0),
		location(district, 'settlement', district.settlement, index, 1),
		location(district, 'route', district.route, index, 2),
		location(district, 'stronghold', district.stronghold, index, 3),
		location(district, 'station', district.station, index, 0),
	];
}

function internalRoutes(district: DistrictBlueprint): TravelRouteDef[] {
	return [
		{
			id: `${district.id}:safehouse-settlement`,
			from: `${district.id}:safehouse`,
			to: `${district.id}:settlement`,
			mode: 'foot',
			label: 'neighborhood route',
		},
		{
			id: `${district.id}:settlement-route`,
			from: `${district.id}:settlement`,
			to: `${district.id}:route`,
			mode: 'foot',
			label: 'field route',
		},
		{
			id: `${district.id}:route-stronghold`,
			from: `${district.id}:route`,
			to: `${district.id}:stronghold`,
			mode: 'foot',
			label: 'stronghold approach',
		},
		{
			id: `${district.id}:settlement-station`,
			from: `${district.id}:settlement`,
			to: `${district.id}:station`,
			mode: 'foot',
			label: 'station access',
		},
	];
}

const locations = DISTRICT_BLUEPRINTS.flatMap(buildDistrictLocations);
const districts: DistrictDef[] = DISTRICT_BLUEPRINTS.map((district) => ({
	id: district.id,
	stageId: district.id,
	name: district.name,
	safehouseId: `${district.id}:safehouse`,
	settlementId: `${district.id}:settlement`,
	routeId: `${district.id}:route`,
	strongholdId: `${district.id}:stronghold`,
	stationId: `${district.id}:station`,
	postStoryPhase: 'transformed',
}));
const routes: TravelRouteDef[] = [
	...DISTRICT_BLUEPRINTS.flatMap(internalRoutes),
	...DISTRICT_BLUEPRINTS.slice(0, -1).flatMap((district, index) => {
		const next = DISTRICT_BLUEPRINTS[index + 1] as DistrictBlueprint;
		if (district.id === 'orbital-lift') return [];
		return [{
			id: `transit:${district.id}:${next.id}`,
			from: `${district.id}:station`,
			to: `${next.id}:station`,
			mode: district.travelModeToNext,
			label: `${district.name} → ${next.name}`,
		} satisfies TravelRouteDef];
	}),
	{
		id: 'homecoming:orbital-lift:lower-sprawl',
		from: 'orbital-lift:station',
		to: 'lower-sprawl:station',
		mode: 'lift',
		label: 'The Long Way Home',
	},
	{
		id: 'launch:lower-sprawl:asteroid-redoubt',
		from: 'lower-sprawl:station',
		to: 'asteroid-redoubt:station',
		mode: 'shuttle',
		label: 'Commons Line Final Launch',
	},
];

export const ADVENTURE_TRAVEL_GRAPH: TravelGraph = {
	revision: 2,
	locations,
	routes,
	districts,
};

export interface WorldGraphValidation {
	valid: boolean;
	errors: string[];
}

export function validateWorldGraph(graph: TravelGraph): WorldGraphValidation {
	const errors: string[] = [];
	const locationIds = new Set<string>();
	const routeIds = new Set<string>();
	for (const entry of graph.locations) {
		if (locationIds.has(entry.id)) errors.push(`duplicate location: ${entry.id}`);
		locationIds.add(entry.id);
		if (!entry.spawns.some((spawn) => spawn.id === entry.defaultSpawnId)) {
			errors.push(`missing default spawn ${entry.defaultSpawnId}: ${entry.id}`);
		}
	}
	for (const route of graph.routes) {
		if (routeIds.has(route.id)) errors.push(`duplicate route: ${route.id}`);
		routeIds.add(route.id);
		if (!locationIds.has(route.from)) errors.push(`route ${route.id} missing from: ${route.from}`);
		if (!locationIds.has(route.to)) errors.push(`route ${route.id} missing to: ${route.to}`);
	}
	if (!locationIds.has(DEFAULT_ADVENTURE_LOCATION_ID)) {
		errors.push(`missing default location: ${DEFAULT_ADVENTURE_LOCATION_ID}`);
	}
	const requiredKinds: LocationKind[] = ['safehouse', 'settlement', 'route', 'stronghold', 'station'];
	for (const district of graph.districts) {
		const districtLocations = graph.locations.filter((entry) => entry.districtId === district.id);
		for (const kind of requiredKinds) {
			if (!districtLocations.some((entry) => entry.kind === kind)) {
				errors.push(`district ${district.id} missing ${kind}`);
			}
		}
	}
	return { valid: errors.length === 0, errors };
}

export function getLocationDef(
	graph: TravelGraph,
	locationId: string
): LocationDef | undefined {
	return graph.locations.find((entry) => entry.id === locationId);
}

export function getDistrictDef(graph: TravelGraph, districtId: string): DistrictDef | undefined {
	return graph.districts.find((entry) => entry.id === districtId);
}

export function getDistrictForStage(graph: TravelGraph, stageId: string): DistrictDef | undefined {
	return graph.districts.find((entry) => entry.stageId === stageId);
}

export function getRoutesForLocation(
	graph: TravelGraph,
	locationId: string
): TravelRouteDef[] {
	return graph.routes.filter((route) => route.from === locationId || route.to === locationId);
}

export function getOtherRouteEndpoint(route: TravelRouteDef, locationId: string): string | null {
	if (route.from === locationId) return route.to;
	if (route.to === locationId) return route.from;
	return null;
}

export function resolveLocationSpawn(
	graph: TravelGraph,
	locationId: string,
	spawnId?: string
): string | null {
	const entry = getLocationDef(graph, locationId);
	if (!entry) return null;
	const requested = spawnId ?? entry.defaultSpawnId ?? DEFAULT_ADVENTURE_SPAWN_ID;
	return entry.spawns.some((spawn) => spawn.id === requested) ? requested : null;
}

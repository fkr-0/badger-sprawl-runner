import type { StoryProgress } from '../GameFlow';
import type { AdventureSaveV2, DistrictStoryPhase } from './AdventureState';
import {
	LATE_ACT_INFRASTRUCTURE_LINKS,
	LATE_ACT_INFRASTRUCTURE_NODES,
} from './LateActInfrastructureContent';

export type InfrastructureKind =
	| 'transit'
	| 'labor'
	| 'care'
	| 'power'
	| 'archive'
	| 'food-air'
	| 'signal'
	| 'lift'
	| 'broadcast';

export type InfrastructureStatus = 'dormant' | 'contested' | 'operational' | 'commons';

export interface InfrastructureNodeDef {
	id: string;
	districtId: string;
	kind: InfrastructureKind;
	label: string;
	description: string;
	operationalFlag?: string;
	commonsFlag?: string;
}

export interface InfrastructureLinkDef {
	id: string;
	fromNodeId: string;
	toNodeId: string;
	label: string;
	message: string;
	requiresFromStatus: Exclude<InfrastructureStatus, 'dormant'>;
	requiresToDiscovered?: boolean;
}

export interface InfrastructureNodeSnapshot extends InfrastructureNodeDef {
	status: InfrastructureStatus;
	discovered: boolean;
}

export interface InfrastructureLinkSnapshot extends InfrastructureLinkDef {
	active: boolean;
}

export interface InfrastructureNetworkSnapshot {
	health: number;
	label: string;
	nodes: InfrastructureNodeSnapshot[];
	links: InfrastructureLinkSnapshot[];
	notices: string[];
}

export const INFRASTRUCTURE_NODES: InfrastructureNodeDef[] = [
	{
		id: 'blue-mercy-line',
		districtId: 'lower-sprawl',
		kind: 'transit',
		label: 'Blue Mercy Line',
		description: 'Night transit, maintenance knowledge, and neighborhood stewardship.',
		operationalFlag: 'lower-sprawl:story-complete',
		commonsFlag: 'lower-sprawl:blue-mercy-public',
	},
	{
		id: 'drainmarket-cold-chain',
		districtId: 'drainmarket',
		kind: 'care',
		label: 'Drainmarket Cold Chain',
		description: 'Medicine, protected patient logistics, and redundant courier handoffs.',
		operationalFlag: 'drainmarket:story-complete',
		commonsFlag: 'drainmarket:open-vein',
	},
	{
		id: 'pump-nine-grid',
		districtId: 'drainmarket',
		kind: 'power',
		label: 'Pump Nine Grid',
		description: 'Flood control, refrigeration current, and contested movement telemetry.',
		operationalFlag: 'drainmarket:knife-weather-broken',
		commonsFlag: 'drainmarket:pump-nine-public',
	},
	{
		id: 'elevator-seed-network',
		districtId: 'chrome-arcology',
		kind: 'lift',
		label: 'Elevator Seed Network',
		description: 'Vertical routing authority converted from property credential to civic instrument.',
		operationalFlag: 'chrome-arcology:story-complete',
		commonsFlag: 'main:elevator-seed-secured',
	},
	{
		id: 'arcology-labor-grid',
		districtId: 'chrome-arcology',
		kind: 'labor',
		label: 'Missing-Floor Labor Grid',
		description: 'Consent-based shift coordination, protected occupancy, meal supply, and lift interruption.',
		operationalFlag: 'rook-shared-negative-map',
		commonsFlag: 'chrome-arcology:vertical-commons',
	},
	{
		id: 'sky-mirror-express',
		districtId: 'mirror-palace',
		kind: 'transit',
		label: 'Sky Mirror Express',
		description: 'Premium ascent route repurposed as the first city-to-orbit passenger corridor.',
		operationalFlag: 'main:elevator-seed-secured',
		commonsFlag: 'main:sky-mirror-broken',
	},
	{
		id: 'mirror-staff-local',
		districtId: 'mirror-palace',
		kind: 'transit',
		label: 'False-World Staff Local',
		description: 'Worker stops, moving-track delay, public transfer priority, and protected orbital passage.',
		operationalFlag: 'mirror-palace:staff-local-open',
		commonsFlag: 'mirror-palace:public-staff-local',
	},
	{
		id: 'refusal-archive-network',
		districtId: 'mirror-palace',
		kind: 'archive',
		label: 'Withdrawable Refusal Archive',
		description: 'Worker testimony with chosen audience, expiry, revision, withdrawal, and protected context.',
		operationalFlag: 'orchid-opened-refusal-table',
		commonsFlag: 'mirror-palace:withdrawable-refusal-archive',
	},
	{
		id: 'dogear-route-archive',
		districtId: 'drainmarket',
		kind: 'archive',
		label: 'Obligation and Route Archive',
		description: 'Mutual promises, predatory contracts, protected routes, and consent records.',
		operationalFlag: 'jane-opened-obligation-archive',
		commonsFlag: 'drainmarket:open-vein',
	},
	{
		id: 'chorus-greenhouse-rail',
		districtId: 'dub-colony',
		kind: 'food-air',
		label: 'Chorus Greenhouse Rail',
		description: 'Food, air, seed stock, and mobile habitat maintenance.',
		operationalFlag: 'dub-colony:story-complete',
		commonsFlag: 'main:colony-charter-written',
	},
	{
		id: 'colony-air-forecast',
		districtId: 'dub-colony',
		kind: 'food-air',
		label: 'Contestable Air Forecast',
		description: 'Habitat demand, reserve pressure, confidence, protected exceptions, and public objections.',
		operationalFlag: 'naya-linked-shield-and-air',
		commonsFlag: 'dub-colony:public-air-forecast',
	},
	{
		id: 'rotating-fader-network',
		districtId: 'dub-colony',
		kind: 'broadcast',
		label: 'Rotating Fader Network',
		description: 'Task-scoped emergency authority with expiry, interruption, and cross-room objections.',
		operationalFlag: 'dub-colony:story-complete',
		commonsFlag: 'dub-colony:commons-governance',
	},
	{
		id: 'bidirectional-return-line',
		districtId: 'dub-colony',
		kind: 'transit',
		label: 'Bidirectional Return Line',
		description: 'City and colony passenger route that either endpoint may interrupt, revise, or refuse.',
		operationalFlag: 'dub-colony:return-coupler-ready',
		commonsFlag: 'main:chorus-commons',
	},
	{
		id: 'public-forecast-array',
		districtId: 'antenna-barrens',
		kind: 'signal',
		label: 'Public Forecast Array',
		description: 'Route prediction with visible assumptions, uncertainty, and objections.',
		operationalFlag: 'antenna-barrens:story-complete',
		commonsFlag: 'main:forecast-public',
	},
	{
		id: 'homecoming-lift',
		districtId: 'orbital-lift',
		kind: 'lift',
		label: 'Homecoming Lift',
		description: 'Downbound passage for freed cargo, passengers, tools, seeds, and testimony.',
		operationalFlag: 'orbital-lift:story-complete',
		commonsFlag: 'main:homecoming',
	},
	{
		id: 'commons-transmitter',
		districtId: 'asteroid-redoubt',
		kind: 'broadcast',
		label: 'Commons Transmitter',
		description: 'Final authorship layer for evidence, tools, and the abolition of master locks.',
		operationalFlag: 'asteroid-redoubt:story-complete',
		commonsFlag: 'main:commons-line',
	},
	...LATE_ACT_INFRASTRUCTURE_NODES,
];

export const INFRASTRUCTURE_LINKS: InfrastructureLinkDef[] = [
	{
		id: 'blue-mercy-to-cold-chain',
		fromNodeId: 'blue-mercy-line',
		toNodeId: 'drainmarket-cold-chain',
		label: 'Night medicine service',
		message: 'Blue Mercy carries clinic stock and redundant couriers toward Drainmarket.',
		requiresFromStatus: 'operational',
		requiresToDiscovered: true,
	},
	{
		id: 'blue-mercy-to-labor-grid',
		fromNodeId: 'blue-mercy-line',
		toNodeId: 'arcology-labor-grid',
		label: 'Night-shift passenger service',
		message: 'Blue Mercy carries workers to floors the public map still denies.',
		requiresFromStatus: 'operational',
		requiresToDiscovered: true,
	},
	{
		id: 'cold-chain-to-labor-grid',
		fromNodeId: 'drainmarket-cold-chain',
		toNodeId: 'arcology-labor-grid',
		label: 'Canteen and clinic supply',
		message: 'The Open Vein supplies medicine and food to the missing labor floors.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'labor-grid-to-elevator-seed',
		fromNodeId: 'arcology-labor-grid',
		toNodeId: 'elevator-seed-network',
		label: 'Worker-authored interruption charter',
		message: 'The Elevator Seed inherits worker interruption rights instead of executive priority defaults.',
		requiresFromStatus: 'commons',
	},
	{
		id: 'elevator-seed-to-sky-mirror',
		fromNodeId: 'elevator-seed-network',
		toNodeId: 'sky-mirror-express',
		label: 'Public ascent route',
		message: 'The subway map bends upward through a route no longer reserved for premium ascent.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'elevator-seed-to-colony',
		fromNodeId: 'elevator-seed-network',
		toNodeId: 'chorus-greenhouse-rail',
		label: 'City-to-colony expedition charter',
		message: 'The Elevator Seed carries public failure rules and interruption rights into the colony expedition.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'sky-mirror-to-staff-local',
		fromNodeId: 'sky-mirror-express',
		toNodeId: 'mirror-staff-local',
		label: 'Express yields to the local',
		message: 'The orbital express waits for worker transfers and publishes the cost of its former punctuality.',
		requiresFromStatus: 'operational',
		requiresToDiscovered: true,
	},
	{
		id: 'refusal-archive-to-staff-local',
		fromNodeId: 'refusal-archive-network',
		toNodeId: 'mirror-staff-local',
		label: 'Chosen testimony governs service',
		message: 'Staff-route decisions cite testimony whose audience and withdrawal rights remain visible.',
		requiresFromStatus: 'operational',
		requiresToDiscovered: true,
	},
	{
		id: 'staff-local-to-chorus-rail',
		fromNodeId: 'mirror-staff-local',
		toNodeId: 'chorus-greenhouse-rail',
		label: 'Peer orbital connection',
		message: 'The False-World Local reaches Chorus Rail as a revisable peer route, not a resort extension.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'pump-nine-to-cold-chain',
		fromNodeId: 'pump-nine-grid',
		toNodeId: 'drainmarket-cold-chain',
		label: 'Refrigeration current',
		message: 'Pump Nine publishes the power margin keeping medicine cold.',
		requiresFromStatus: 'operational',
	},
	{
		id: 'archive-to-elevator-seed',
		fromNodeId: 'dogear-route-archive',
		toNodeId: 'elevator-seed-network',
		label: 'Consent-aware routing',
		message: 'Protected-route rules from the market travel upward with the Elevator Seed.',
		requiresFromStatus: 'operational',
		requiresToDiscovered: true,
	},
	{
		id: 'cold-chain-to-greenhouse',
		fromNodeId: 'drainmarket-cold-chain',
		toNodeId: 'chorus-greenhouse-rail',
		label: 'Medicinal cuttings',
		message: 'Drainmarket prepares medicinal moss and cold-chain practice for Dub Colony.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'cold-chain-to-air-forecast',
		fromNodeId: 'drainmarket-cold-chain',
		toNodeId: 'colony-air-forecast',
		label: 'Protected medical air exceptions',
		message: 'Drainmarket privacy practice shapes colony medical-air priority without exposing patients.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'greenhouse-to-air-forecast',
		fromNodeId: 'chorus-greenhouse-rail',
		toNodeId: 'colony-air-forecast',
		label: 'Food and air share one forecast',
		message: 'Greenhouse demand and habitat breathing enter one public schedule with visible tradeoffs.',
		requiresFromStatus: 'operational',
		requiresToDiscovered: true,
	},
	{
		id: 'rotating-fader-to-air-forecast',
		fromNodeId: 'rotating-fader-network',
		toNodeId: 'colony-air-forecast',
		label: 'Emergency authority can be interrupted',
		message: 'No emergency voice may silently overwrite the public oxygen forecast.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'air-forecast-to-return-line',
		fromNodeId: 'colony-air-forecast',
		toNodeId: 'bidirectional-return-line',
		label: 'Passenger capacity with visible assumptions',
		message: 'Homecoming capacity shows pressure, confidence, protected exceptions, and objections.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'chorus-rail-to-return-line',
		fromNodeId: 'chorus-greenhouse-rail',
		toNodeId: 'bidirectional-return-line',
		label: 'Greenhouse and passenger coupler',
		message: 'Chorus Rail couples greenhouse, workshop, and passenger cars to a route either end may revise.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'greenhouse-to-blue-mercy',
		fromNodeId: 'chorus-greenhouse-rail',
		toNodeId: 'blue-mercy-line',
		label: 'Homecoming greenhouse depots',
		message: 'Colony greenhouse methods return to abandoned city platforms.',
		requiresFromStatus: 'operational',
	},
	{
		id: 'return-line-to-homecoming-lift',
		fromNodeId: 'bidirectional-return-line',
		toNodeId: 'homecoming-lift',
		label: 'Colony-authored descent',
		message: 'The homecoming descent carries colony interruption rights instead of treating return as annexation.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'refusal-archive-to-homecoming',
		fromNodeId: 'refusal-archive-network',
		toNodeId: 'homecoming-lift',
		label: 'Chosen testimony travels home',
		message: 'Only testimony whose speakers chose the city audience boards the homecoming archive car.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	{
		id: 'forecast-to-transit',
		fromNodeId: 'public-forecast-array',
		toNodeId: 'blue-mercy-line',
		label: 'Contestable arrival forecast',
		message: 'Blue Mercy publishes why service changes and how passengers may object.',
		requiresFromStatus: 'commons',
	},
	{
		id: 'forecast-to-homecoming',
		fromNodeId: 'public-forecast-array',
		toNodeId: 'homecoming-lift',
		label: 'Public descent forecast',
		message: 'The city can see the Lift’s predicted descent, risk, cargo, and uncertainty.',
		requiresFromStatus: 'operational',
		requiresToDiscovered: true,
	},
	{
		id: 'homecoming-to-blue-mercy',
		fromNodeId: 'homecoming-lift',
		toNodeId: 'blue-mercy-line',
		label: 'The long way home',
		message: 'Freed passengers, tools, seeds, and unresolved arguments descend to Blue Mercy.',
		requiresFromStatus: 'commons',
	},
	{
		id: 'coalition-to-transmitter',
		fromNodeId: 'blue-mercy-line',
		toNodeId: 'commons-transmitter',
		label: 'Commons Line final launch',
		message: 'The final expedition launches from a city network already practicing shared authorship.',
		requiresFromStatus: 'commons',
		requiresToDiscovered: true,
	},
	...LATE_ACT_INFRASTRUCTURE_LINKS,
];

export function resolveInfrastructureNetwork(
	adventure: AdventureSaveV2,
	story: StoryProgress
): InfrastructureNetworkSnapshot {
	const flags = new Set(adventure.worldFlags);
	const completed = new Set(story.completedStageIds);
	const discoveredDistricts = new Set(
		adventure.discoveredLocationIds.map((locationId) => locationId.split(':')[0])
	);
	const nodes = INFRASTRUCTURE_NODES.map((node) => {
		const phase = adventure.districtPhases[node.districtId] ?? 'unvisited';
		const discovered = discoveredDistricts.has(node.districtId);
		return {
			...node,
			discovered,
			status: resolveNodeStatus(node, phase, discovered, flags, completed),
		};
	});
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const links = INFRASTRUCTURE_LINKS.map((link) => {
		const from = byId.get(link.fromNodeId);
		const to = byId.get(link.toNodeId);
		return {
			...link,
			active: Boolean(
				from &&
				to &&
				statusRank(from.status) >= statusRank(link.requiresFromStatus) &&
				(!link.requiresToDiscovered || to.discovered)
			),
		};
	});
	const discoveredNodes = nodes.filter((node) => node.discovered);
	const activeWeight = discoveredNodes.reduce((total, node) => total + statusRank(node.status), 0);
	const maximumWeight = Math.max(1, discoveredNodes.length * statusRank('commons'));
	const health = Math.round((activeWeight / maximumWeight) * 100);
	return {
		health,
		label: networkLabel(health, nodes),
		nodes,
		links,
		notices: links.filter((link) => link.active).map((link) => link.message),
	};
}

export function getInfrastructureNoticesForDistrict(
	network: InfrastructureNetworkSnapshot,
	districtId: string
): string[] {
	const localNodeIds = new Set(
		network.nodes.filter((node) => node.districtId === districtId).map((node) => node.id)
	);
	return network.links
		.filter(
			(link) =>
				link.active &&
				(localNodeIds.has(link.fromNodeId) || localNodeIds.has(link.toNodeId))
		)
		.map((link) => link.message);
}

export function validateInfrastructureNetwork(): string[] {
	const errors: string[] = [];
	const nodeIds = new Set<string>();
	const linkIds = new Set<string>();
	for (const node of INFRASTRUCTURE_NODES) {
		if (nodeIds.has(node.id)) errors.push(`duplicate infrastructure node: ${node.id}`);
		nodeIds.add(node.id);
	}
	for (const link of INFRASTRUCTURE_LINKS) {
		if (linkIds.has(link.id)) errors.push(`duplicate infrastructure link: ${link.id}`);
		linkIds.add(link.id);
		if (!nodeIds.has(link.fromNodeId)) errors.push(`${link.id}: unknown from node ${link.fromNodeId}`);
		if (!nodeIds.has(link.toNodeId)) errors.push(`${link.id}: unknown to node ${link.toNodeId}`);
	}
	return errors;
}

function resolveNodeStatus(
	node: InfrastructureNodeDef,
	phase: DistrictStoryPhase,
	discovered: boolean,
	flags: ReadonlySet<string>,
	completed: ReadonlySet<string>
): InfrastructureStatus {
	if (!discovered) return 'dormant';
	if (node.commonsFlag && flags.has(node.commonsFlag)) return 'commons';
	if (
		(node.operationalFlag && flags.has(node.operationalFlag)) ||
		completed.has(node.districtId) ||
		phase === 'transformed'
	) {
		return 'operational';
	}
	return phase === 'contested' || phase === 'liberated' ? 'contested' : 'dormant';
}

function statusRank(status: InfrastructureStatus): number {
	return status === 'commons' ? 3 : status === 'operational' ? 2 : status === 'contested' ? 1 : 0;
}

function networkLabel(health: number, nodes: InfrastructureNodeSnapshot[]): string {
	if (nodes.some((node) => node.id === 'commons-transmitter' && node.status === 'commons')) {
		return 'COMMONS LINE // NO PERMANENT CENTER';
	}
	if (health >= 75) return 'COALITION NETWORK // STRONG, CONTESTED, REVISABLE';
	if (health >= 45) return 'PUBLIC LINKS GROWING THROUGH THE PRIVATE GRID';
	if (health > 0) return 'FRAGMENTED SERVICE // LOCAL SYSTEMS ANSWER BACK';
	return 'METERED SILENCE // NO PUBLIC DEPENDENCY MAP';
}

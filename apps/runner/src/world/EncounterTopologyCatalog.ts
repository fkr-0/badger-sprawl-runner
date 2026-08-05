import type { ResolutionApproach } from '../game/ResolutionApproach';
import {
	cloneEncounterTopology,
	type EncounterApproachPlan,
	type StageEncounterTopology,
} from './EncounterTopology';
import type { RuntimeStageId } from './stageLayoutRegistry';

interface AuthoredApproachSpec {
	label: string;
	approaches: ResolutionApproach[];
	risk: EncounterApproachPlan['risk'];
	playerCue: string;
	worldConsequenceHint: string;
	requiredTags?: string[];
}

function buildAntennaBarrensTopology(spec: EncounterStageSpec): StageEncounterTopology {
	const stageId: RuntimeStageId = 'antenna-barrens';
	const entry = `${stageId}:entry`;
	const work = `${stageId}:work`;
	const stronghold = `${stageId}:stronghold`;
	const dishCut = `${stageId}:dish-shadow-cut`;
	const mastTrench = `${stageId}:mast-trench`;
	const confidenceGate = `${stageId}:confidence-gate`;
	return {
		stageId,
		zones: [
			{ id: entry, label: spec.entryLabel, x: 0, y: 230, w: 430, h: 264, major: false, tags: ['entry', 'scrap-camp', 'low-ground'] },
			{ id: work, label: spec.workLabel, x: 430, y: 120, w: 810, h: 374, major: true, tags: ['work', 'dish-shadow', 'civilian-presence'] },
			{ id: stronghold, label: spec.strongholdLabel, x: 1240, y: 80, w: 660, h: 414, major: true, tags: ['stronghold', 'forecast-array', 'relay-node'] },
		],
		portals: [
			{ id: dishCut, fromZoneId: entry, toZoneId: work, x: 404, y: 318, w: 52, h: 176, visionTransmission: 0.38, soundTransmission: 0.54, defaultOpen: false, tags: ['door', 'dish-shadow', 'wind-baffle'] },
			{ id: mastTrench, fromZoneId: work, toZoneId: stronghold, x: 1214, y: 360, w: 52, h: 134, visionTransmission: 0.22, soundTransmission: 0.42, defaultOpen: true, tags: ['trench', 'maintenance', 'low-route'] },
			{ id: confidenceGate, fromZoneId: work, toZoneId: stronghold, x: 1216, y: 156, w: 48, h: 186, visionTransmission: 0.68, soundTransmission: 0.72, defaultOpen: false, tags: ['security', 'gate', 'confidence-display'] },
		],
		occluders: [
			{ id: `${stageId}:rotating-dish`, x: 690, y: 214, w: 126, h: 280, blocksVision: true, soundLoss: 0.26, tags: ['dish', 'moving-shadow'] },
			{ id: `${stageId}:cold-store`, x: 1488, y: 242, w: 96, h: 252, blocksVision: true, soundLoss: 0.34, destructible: false, tags: ['archive', 'preserve'] },
		],
		traps: [
			{ id: `${stageId}:sweep-chime`, label: 'Forecast sweep chime', x: 920, y: 408, triggerRadius: 82, hackRadius: 104, cooldownSeconds: 2.8, intensity: 0.7, soundRadius: 680, decoyOffset: -360, tags: ['forecast', 'tripwire'] },
			{ id: `${stageId}:confidence-ping`, label: 'Confidence-gate ping', x: 1390, y: 394, triggerRadius: 76, hackRadius: 96, cooldownSeconds: 3.1, intensity: 0.58, soundRadius: 560, decoyOffset: 300, tags: ['gate', 'provenance'] },
		],
		civilianRoutes: [{ id: `${stageId}:evacuation-main`, fromZoneId: stronghold, toZoneId: entry, waypoints: [{ x: 1640, y: 444 }, { x: 1190, y: 454 }, { x: 760, y: 454 }, { x: 190, y: 454 }], trigger: 'alarm', capacity: 8, accessibilityCue: spec.civilianCue }],
		approachPlans: [
			...spec.workPlans.map((entryPlan, index) => approach(`${stageId}:work-plan-${index + 1}`, work, [dishCut], entryPlan)),
			approach(`${stageId}:stronghold-plan-1`, stronghold, [confidenceGate], spec.strongholdPlans[0]),
			approach(`${stageId}:stronghold-plan-2`, stronghold, [mastTrench], spec.strongholdPlans[1]),
		],
	};
}

function buildOrbitalLiftTopology(spec: EncounterStageSpec): StageEncounterTopology {
	const stageId: RuntimeStageId = 'orbital-lift';
	const entry = `${stageId}:entry`;
	const work = `${stageId}:work`;
	const stronghold = `${stageId}:stronghold`;
	const manifestDoor = `${stageId}:manifest-door`;
	const crawlIris = `${stageId}:crawl-iris`;
	const authorityLock = `${stageId}:authority-lock`;
	return {
		stageId,
		zones: [
			{ id: entry, label: spec.entryLabel, x: 0, y: 276, w: 470, h: 218, major: false, tags: ['entry', 'passenger-deck'] },
			{ id: work, label: spec.workLabel, x: 470, y: 110, w: 860, h: 384, major: true, tags: ['work', 'cargo-spine', 'counterweight'] },
			{ id: stronghold, label: spec.strongholdLabel, x: 1330, y: 54, w: 570, h: 440, major: true, tags: ['stronghold', 'elevator-control', 'relay-node'] },
		],
		portals: [
			{ id: manifestDoor, fromZoneId: entry, toZoneId: work, x: 442, y: 308, w: 56, h: 186, visionTransmission: 0.5, soundTransmission: 0.7, defaultOpen: false, tags: ['door', 'manifest', 'passenger-claim'] },
			{ id: crawlIris, fromZoneId: work, toZoneId: stronghold, x: 1300, y: 352, w: 60, h: 142, visionTransmission: 0.18, soundTransmission: 0.36, defaultOpen: false, tags: ['iris', 'maintenance', 'crawl-route'] },
			{ id: authorityLock, fromZoneId: work, toZoneId: stronghold, x: 1308, y: 118, w: 44, h: 212, visionTransmission: 0.74, soundTransmission: 0.82, defaultOpen: false, tags: ['security', 'authority', 'counterweight-window'] },
		],
		occluders: [
			{ id: `${stageId}:witness-car`, x: 760, y: 332, w: 210, h: 162, blocksVision: true, soundLoss: 0.3, tags: ['passenger', 'protected'] },
			{ id: `${stageId}:counterweight-bank`, x: 1500, y: 174, w: 112, h: 320, blocksVision: true, soundLoss: 0.22, destructible: true, tags: ['counterweight', 'safe-impact-window'] },
		],
		traps: [
			{ id: `${stageId}:cargo-status-bell`, label: 'Cargo-status bell', x: 660, y: 414, triggerRadius: 88, hackRadius: 110, cooldownSeconds: 2.4, intensity: 0.72, soundRadius: 720, decoyOffset: 390, tags: ['manifest', 'classification'] },
			{ id: `${stageId}:counterweight-clack`, label: 'Counterweight claim clack', x: 1180, y: 390, triggerRadius: 80, hackRadius: 104, cooldownSeconds: 2.9, intensity: 0.64, soundRadius: 650, decoyOffset: -340, tags: ['counterweight', 'maintenance'] },
		],
		civilianRoutes: [{ id: `${stageId}:evacuation-main`, fromZoneId: stronghold, toZoneId: entry, waypoints: [{ x: 1700, y: 438 }, { x: 1280, y: 454 }, { x: 850, y: 454 }, { x: 210, y: 454 }], trigger: 'alarm', capacity: 10, accessibilityCue: spec.civilianCue }],
		approachPlans: [
			...spec.workPlans.map((entryPlan, index) => approach(`${stageId}:work-plan-${index + 1}`, work, [manifestDoor], entryPlan)),
			approach(`${stageId}:stronghold-plan-1`, stronghold, [authorityLock], spec.strongholdPlans[0]),
			approach(`${stageId}:stronghold-plan-2`, stronghold, [crawlIris], spec.strongholdPlans[1]),
		],
	};
}

function buildAsteroidRedoubtTopology(spec: EncounterStageSpec): StageEncounterTopology {
	const stageId: RuntimeStageId = 'asteroid-redoubt';
	const entry = `${stageId}:entry`;
	const work = `${stageId}:work`;
	const stronghold = `${stageId}:stronghold`;
	const witnessCorridor = `${stageId}:witness-corridor`;
	const doctrineSeal = `${stageId}:doctrine-seal`;
	const serviceBypass = `${stageId}:service-bypass`;
	return {
		stageId,
		zones: [
			{ id: entry, label: spec.entryLabel, x: 0, y: 292, w: 410, h: 202, major: false, tags: ['entry', 'signal-dock', 'return-car'] },
			{ id: work, label: spec.workLabel, x: 410, y: 138, w: 840, h: 356, major: true, tags: ['work', 'commons', 'protected-routes'] },
			{ id: stronghold, label: spec.strongholdLabel, x: 1250, y: 78, w: 650, h: 416, major: true, tags: ['stronghold', 'transmitter-root', 'relay-node'] },
		],
		portals: [
			{ id: witnessCorridor, fromZoneId: entry, toZoneId: work, x: 382, y: 324, w: 56, h: 170, visionTransmission: 0.42, soundTransmission: 0.58, defaultOpen: false, tags: ['door', 'witness', 'protected-blank'] },
			{ id: doctrineSeal, fromZoneId: work, toZoneId: stronghold, x: 1222, y: 142, w: 56, h: 220, visionTransmission: 0.76, soundTransmission: 0.8, defaultOpen: false, tags: ['security', 'broadcast', 'doctrine'] },
			{ id: serviceBypass, fromZoneId: work, toZoneId: stronghold, x: 1220, y: 372, w: 60, h: 122, visionTransmission: 0.16, soundTransmission: 0.3, defaultOpen: true, tags: ['maintenance', 'toolkit', 'refusal-route'] },
		],
		occluders: [
			{ id: `${stageId}:protected-map-shutter`, x: 720, y: 262, w: 130, h: 232, blocksVision: true, soundLoss: 0.32, tags: ['protected-route', 'public-blank'] },
			{ id: `${stageId}:transmitter-cooling-root`, x: 1510, y: 190, w: 118, h: 304, blocksVision: true, soundLoss: 0.28, destructible: false, tags: ['transmitter', 'preserve'] },
		],
		traps: [
			{ id: `${stageId}:doctrine-recorder`, label: 'Doctrine recorder', x: 980, y: 406, triggerRadius: 84, hackRadius: 108, cooldownSeconds: 3, intensity: 0.68, soundRadius: 690, decoyOffset: -420, tags: ['recording', 'authorship'] },
			{ id: `${stageId}:broadcast-recoil`, label: 'Broadcast recoil sensor', x: 1420, y: 382, triggerRadius: 78, hackRadius: 102, cooldownSeconds: 2.7, intensity: 0.74, soundRadius: 740, decoyOffset: 360, tags: ['broadcast', 'recoil'] },
		],
		civilianRoutes: [{ id: `${stageId}:evacuation-main`, fromZoneId: stronghold, toZoneId: entry, waypoints: [{ x: 1710, y: 444 }, { x: 1200, y: 454 }, { x: 720, y: 454 }, { x: 170, y: 454 }], trigger: 'alarm', capacity: 8, accessibilityCue: spec.civilianCue }],
		approachPlans: [
			...spec.workPlans.map((entryPlan, index) => approach(`${stageId}:work-plan-${index + 1}`, work, [witnessCorridor], entryPlan)),
			approach(`${stageId}:stronghold-plan-1`, stronghold, [doctrineSeal], spec.strongholdPlans[0]),
			approach(`${stageId}:stronghold-plan-2`, stronghold, [serviceBypass], spec.strongholdPlans[1]),
		],
	};
}

interface EncounterStageSpec {
	width: number;
	entryLabel: string;
	workLabel: string;
	strongholdLabel: string;
	portalALabel: string;
	portalBLabel: string;
	workPlans: [AuthoredApproachSpec, AuthoredApproachSpec];
	strongholdPlans: [AuthoredApproachSpec, AuthoredApproachSpec];
	civilianCue: string;
}

const SPECS: Record<RuntimeStageId, EncounterStageSpec> = {
	'lower-sprawl': {
		width: 1900,
		entryLabel: 'Blue Mercy service mouth',
		workLabel: 'Meter market and toll queue',
		strongholdLabel: 'Captain Grin collection house',
		portalALabel: 'Maintenance shutter',
		portalBLabel: 'Fare-audit gate',
		workPlans: [
			plan('Ride the dead signal', ['ghoststep', 'hacking'], 'low', 'Muted relay lamps mark a route above the queue.', 'The market remembers that quiet access can be public infrastructure.'),
			plan('Enter through the argument', ['social', 'claw'], 'medium', 'The queue opens when witnesses gather around a contested meter.', 'Visible resistance strengthens later stand-down legitimacy.'),
		],
		strongholdPlans: [
			plan('Rewire the toll brain', ['repair', 'hacking'], 'medium', 'Maintenance labels reveal a reversible control seam.', 'The station inherits a serviceable public gate instead of rubble.'),
			plan('Break the collection rhythm', ['ballistics', 'claw'], 'high', 'Relay armor flashes between enforcement beats.', 'Fast force wins the room but raises repair strain on Blue Mercy.'),
		],
		civilianCue: 'Chalk arrows under the platform lip lead away from the collection house.',
	},
	drainmarket: {
		width: 2020,
		entryLabel: 'Floodline culvert',
		workLabel: 'Clinic crossing and invoice weather',
		strongholdLabel: 'Knife-drone nest exchange',
		portalALabel: 'Pump Nine sluice',
		portalBLabel: 'Cold-chain lock',
		workPlans: [
			plan('Follow the honest waterline', ['exploration', 'ghoststep'], 'low', 'Gauge paint reveals a dry ledge behind the loud route.', 'Temple Gauge can preserve the route without falsifying new casualties.'),
			plan('Move as a clinic convoy', ['social', 'repair'], 'medium', 'Supply carriers signal a protected crossing window.', 'The clinic gains witnesses and a stronger claim on transit priority.'),
		],
		strongholdPlans: [
			plan('Spoof the knife weather', ['hacking', 'ghoststep'], 'medium', 'Drone shadows repeat a pattern around the cold-chain lock.', 'The nest can be converted into a local warning system.'),
			plan('Ground the swarm safely', ['ballistics', 'repair'], 'high', 'Insulated drainage cages can catch disabled drones.', 'Recovered parts reduce later greenhouse and clinic strain.'),
		],
		civilianCue: 'Clinic tape and low lamps mark a flood-safe evacuation line.',
	},
	'chrome-arcology': {
		width: 2320,
		entryLabel: 'Labor Floor B2 intake',
		workLabel: 'Missing floors and service guts',
		strongholdLabel: 'Elevator Seed vault',
		portalALabel: 'Shift-change iris',
		portalBLabel: 'Glass audit vestibule',
		workPlans: [
			plan('Climb the floors that do not exist', ['ghoststep', 'exploration'], 'low', 'Unnumbered service ladders interrupt the polished floor count.', 'Missing workers gain a route that cannot be deleted by a directory edit.'),
			plan('Make the roster contradict the building', ['social', 'hacking'], 'medium', 'Break-room copies disagree with the executive directory.', 'The exposure becomes worker testimony rather than stolen spectacle.'),
		],
		strongholdPlans: [
			plan('Pierce the sightline contract', ['ballistics', 'hacking'], 'high', 'Glass relays share one timing seam across the atrium.', 'The Seed is extracted with evidence of how surveillance was financed.'),
			plan('Walk the vault out on shift change', ['claw', 'social'], 'medium', 'Service crews can turn a security handoff into a labor procession.', 'The upward route begins as collective custody.'),
		],
		civilianCue: 'Emergency floor numbers appear only at knee height, where management cameras rarely look.',
	},
	'mirror-palace': {
		width: 2580,
		entryLabel: 'Servants’ receiving court',
		workLabel: 'Contract gallery and mirrored kitchens',
		strongholdLabel: 'Banquet reflection chamber',
		portalALabel: 'Silver service mirror',
		portalBLabel: 'Guest-profile prism',
		workPlans: [
			plan('Use the mirrors that labor cleans', ['ghoststep', 'hacking'], 'low', 'Cleaning marks reveal which reflections are doors.', 'Staff routes remain useful after the gala collapses.'),
			plan('Follow the people omitted from the invitation', ['social', 'exploration'], 'medium', 'Kitchen call-and-response carries names the guest ledger erases.', 'The archive records labor without exposing protected identities.'),
		],
		strongholdPlans: [
			plan('Refuse the role in public', ['claw', 'social'], 'medium', 'The reflection judge pauses when witnesses answer in chorus.', 'Lio’s choice remains legible as a choice, not a boss-state toggle.'),
			plan('Shatter only the coercive image', ['ballistics', 'ghoststep'], 'high', 'Prism seams separate surveillance glass from load-bearing walls.', 'The palace survives as housing while its profile machinery fails.'),
		],
		civilianCue: 'Service bells switch from orders to evacuation rhythm when the guest prism turns red.',
	},
	'dub-colony': {
		width: 2820,
		entryLabel: 'Greenhouse tram lock',
		workLabel: 'Studio temple and oxygen commons',
		strongholdLabel: 'Bass reactor assembly deck',
		portalALabel: 'Air-accounting diaphragm',
		portalBLabel: 'Reactor chorus gate',
		workPlans: [
			plan('Ride the greenhouse maintenance beat', ['repair', 'exploration'], 'low', 'Irrigation pulses expose a route between pressure cycles.', 'The colony keeps a repairable food-and-air link to the city.'),
			plan('Cross under assembly protection', ['social', 'ghoststep'], 'medium', 'Public speakers announce a movement corridor instead of an alarm.', 'The assembly learns how to protect passage without becoming police.'),
		],
		strongholdPlans: [
			plan('Retune the reactor covenant', ['hacking', 'repair'], 'medium', 'Bass harmonics reveal where emergency authority became permanent.', 'Power control returns with revision history and expiry.'),
			plan('Challenge the crown on the one', ['claw', 'social'], 'high', 'King Feedback’s guard opens on the downbeat before each decree.', 'The confrontation becomes a governance decision witnessed by the colony.'),
		],
		civilianCue: 'Oxygen lamps pulse a slow bassline toward the greenhouse tram.',
	},
	'antenna-barrens': {
		width: 1900,
		entryLabel: 'Forecast scrap camp',
		workLabel: 'Error-bar field',
		strongholdLabel: 'Black-Ice forecast array',
		portalALabel: 'Dish-shadow cut',
		portalBLabel: 'Confidence gate',
		workPlans: [
			plan('Walk the model’s blind interval', ['exploration', 'repair'], 'low', 'Dish motors create predictable shadows between sweeps.', 'Public maintenance notes become a route instead of a vulnerability sale.'),
			plan('Move inside the noise floor', ['hacking', 'ghoststep'], 'medium', 'Contradictory forecasts briefly lower sensor trust.', 'The contest proves uncertainty can protect rather than merely fail.'),
		],
		strongholdPlans: [
			plan('Publish the confidence argument', ['social', 'hacking'], 'medium', 'The array accepts provenance, uncertainty, and a public challenge path.', 'Forecast power becomes contestable civic knowledge.'),
			plan('Disable the coercive dish, not the archive', ['ballistics', 'repair'], 'high', 'Actuator housings are separable from cold storage.', 'The city keeps the model history without the targeting beam.'),
		],
		civilianCue: 'Scavenger flags point perpendicular to the current surveillance sweep.',
	},
	'orbital-lift': {
		width: 1900,
		entryLabel: 'Passenger cooperative deck',
		workLabel: 'Cargo authority spine',
		strongholdLabel: 'Skylock elevator control',
		portalALabel: 'Maintenance crawl iris',
		portalBLabel: 'Authority transfer lock',
		workPlans: [
			plan('Crawl with the people who keep it moving', ['repair', 'exploration'], 'low', 'Grease-pencil diagrams identify spaces outside passenger scoring.', 'Maintenance knowledge returns to Blue Mercy after homecoming.'),
			plan('Cross as a passenger assembly', ['social', 'ghoststep'], 'medium', 'Manifest disputes create a protected boarding interval.', 'The upward route recognizes riders as authors of the timetable.'),
		],
		strongholdPlans: [
			plan('Rotate elevator authority', ['hacking', 'social'], 'medium', 'The control desk exposes scope, expiry, replacement, and interruption ports.', 'Skylock becomes a revisable public office.'),
			plan('Brake the coercive cable', ['ballistics', 'claw'], 'high', 'Counterweights expose a safe impact window between passenger cars.', 'The lift survives, but repair crews inherit visible strain.'),
		],
		civilianCue: 'Passenger claim tickets double as arrows toward the protected return car.',
	},
	'asteroid-redoubt': {
		width: 1900,
		entryLabel: 'Prisoner signal dock',
		workLabel: 'Redoubt commons and protected routes',
		strongholdLabel: 'Director Vane transmitter court',
		portalALabel: 'Witness-zero corridor',
		portalBLabel: 'Broadcast doctrine seal',
		workPlans: [
			plan('Follow the route that refuses to be mapped', ['exploration', 'ghoststep'], 'low', 'Protected blanks repeat around prisoner support caches.', 'The final toolkit preserves necessary opacity.'),
			plan('Build the commons while moving', ['social', 'repair'], 'medium', 'Relay parts are labeled by the people who can safely maintain them.', 'The transmitter has successors before the final confrontation.'),
		],
		strongholdPlans: [
			plan('Publish tools, limits, and refusal', ['hacking', 'social'], 'medium', 'The doctrine console accepts revision history and protected omissions.', 'The ending becomes an institution that can disagree with itself.'),
			plan('Break Vane’s monopoly on force', ['ballistics', 'claw'], 'high', 'Command armor separates from the transmitter root on every broadcast recoil.', 'The public signal survives a violent transfer with costly repairs.'),
		],
		civilianCue: 'Prisoner radio clicks count down a route back toward the city-bound car.',
	},
};

export function getStageEncounterTopology(stageId: RuntimeStageId): StageEncounterTopology {
	const topology =
		stageId === 'antenna-barrens'
			? buildAntennaBarrensTopology(SPECS[stageId])
			: stageId === 'orbital-lift'
				? buildOrbitalLiftTopology(SPECS[stageId])
				: stageId === 'asteroid-redoubt'
					? buildAsteroidRedoubtTopology(SPECS[stageId])
					: buildTopology(stageId, SPECS[stageId]);
	return cloneEncounterTopology(topology);
}

function buildTopology(stageId: RuntimeStageId, spec: EncounterStageSpec): StageEncounterTopology {
	const splitA = Math.round(spec.width * 0.34);
	const splitB = Math.round(spec.width * 0.68);
	const portalA = `${stageId}:portal-a`;
	const portalB = `${stageId}:portal-b`;
	const entryZone = `${stageId}:entry`;
	const workZone = `${stageId}:work`;
	const strongholdZone = `${stageId}:stronghold`;
	return {
		stageId,
		zones: [
			{ id: entryZone, label: spec.entryLabel, x: 0, y: 100, w: splitA, h: 394, major: false, tags: ['entry', 'recovery'] },
			{ id: workZone, label: spec.workLabel, x: splitA, y: 100, w: splitB - splitA, h: 394, major: true, tags: ['work', 'civilian-presence'] },
			{ id: strongholdZone, label: spec.strongholdLabel, x: splitB, y: 100, w: spec.width - splitB, h: 394, major: true, tags: ['stronghold', 'relay-node'] },
		],
		portals: [
			{ id: portalA, fromZoneId: entryZone, toZoneId: workZone, x: splitA - 18, y: 238, w: 36, h: 256, visionTransmission: 0.72, soundTransmission: 0.78, defaultOpen: true, tags: ['door', 'local-boundary', spec.portalALabel] },
			{ id: portalB, fromZoneId: workZone, toZoneId: strongholdZone, x: splitB - 18, y: 220, w: 36, h: 274, visionTransmission: 0.56, soundTransmission: 0.64, defaultOpen: true, tags: ['security', 'relay-boundary', spec.portalBLabel] },
		],
		occluders: [
			{ id: `${stageId}:cover-work`, x: Math.round(spec.width * 0.49), y: 330, w: 42, h: 164, blocksVision: true, soundLoss: 0.12, tags: ['cover', 'work-infrastructure'] },
			{ id: `${stageId}:cover-stronghold`, x: Math.round(spec.width * 0.82), y: 292, w: 54, h: 202, blocksVision: true, soundLoss: 0.18, destructible: true, tags: ['cover', 'alarm-support'] },
		],
		traps: [
			{
				id: `${stageId}:acoustic-tripwire`,
				label: `${spec.workLabel} tripwire`,
				x: Math.round(spec.width * 0.57),
				y: 430,
				triggerRadius: 74,
				hackRadius: 94,
				cooldownSeconds: 2.6,
				intensity: 0.66,
				soundRadius: 610,
				decoyOffset: -280,
				tags: ['acoustic', 'local-knowledge'],
			},
		],
		civilianRoutes: [
			{
				id: `${stageId}:evacuation-main`,
				fromZoneId: strongholdZone,
				toZoneId: entryZone,
				waypoints: [
					{ x: Math.round(spec.width * 0.88), y: 450 },
					{ x: splitB - 45, y: 450 },
					{ x: splitA - 45, y: 450 },
					{ x: Math.round(spec.width * 0.08), y: 450 },
				],
				trigger: 'alarm',
				capacity: 8,
				accessibilityCue: spec.civilianCue,
			},
		],
		approachPlans: [
			...spec.workPlans.map((entry, index) => approach(`${stageId}:work-plan-${index + 1}`, workZone, [portalA], entry)),
			...spec.strongholdPlans.map((entry, index) => approach(`${stageId}:stronghold-plan-${index + 1}`, strongholdZone, [portalB], entry)),
		],
	};
}

function plan(
	label: string,
	approaches: ResolutionApproach[],
	risk: EncounterApproachPlan['risk'],
	playerCue: string,
	worldConsequenceHint: string,
	requiredTags: string[] = []
): AuthoredApproachSpec {
	return { label, approaches, risk, playerCue, worldConsequenceHint, requiredTags };
}

function approach(
	id: string,
	zoneId: string,
	entryPortalIds: string[],
	spec: AuthoredApproachSpec
): EncounterApproachPlan {
	return {
		id,
		zoneId,
		label: spec.label,
		approaches: [...spec.approaches],
		entryPortalIds: [...entryPortalIds],
		requiredTags: [...(spec.requiredTags ?? [])],
		risk: spec.risk,
		playerCue: spec.playerCue,
		worldConsequenceHint: spec.worldConsequenceHint,
	};
}

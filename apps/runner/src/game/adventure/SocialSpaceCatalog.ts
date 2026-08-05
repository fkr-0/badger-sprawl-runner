import { ANTENNA_BARRENS_SOCIAL_SPACES } from './AntennaBarrensSocialSpaces';
import { ASTEROID_REDOUBT_SOCIAL_SPACES } from './AsteroidRedoubtSocialSpaces';
import { ORBITAL_LIFT_SOCIAL_SPACES } from './OrbitalLiftSocialSpaces';

export type SocialAnchorKind = 'npc' | 'service';
export type SocialPropKind =
	| 'bench'
	| 'console'
	| 'stall'
	| 'archive'
	| 'clinic'
	| 'train'
	| 'greenery'
	| 'light'
	| 'barrier';

export interface SocialAnchorDef {
	id: string;
	kind: SocialAnchorKind;
	x: number;
}

export interface SocialPropDef {
	id: string;
	kind: SocialPropKind;
	x: number;
	width: number;
	height: number;
	label?: string;
}

export interface SocialSpaceLayoutDef {
	locationId: string;
	width: number;
	floorY: number;
	spawnX: number;
	walkSpeed: number;
	interactionRadius: number;
	anchors: SocialAnchorDef[];
	props: SocialPropDef[];
	farLayer: string;
	midLayer: string;
}

export const SOCIAL_SPACE_CATALOG: SocialSpaceLayoutDef[] = [
	{
		locationId: 'lower-sprawl:safehouse',
		width: 1320,
		floorY: 352,
		spawnX: 160,
		walkSpeed: 205,
		interactionRadius: 86,
		farLayer: 'Rain moves behind frosted laundromat windows.',
		midLayer: 'Signal valves, kitchen steam, route maps, and repaired speakers share one wall.',
		anchors: [
			{ id: 'loadout-locker', kind: 'service', x: 250 },
			{ id: 'auntie-subharmonic', kind: 'npc', x: 520 },
			{ id: 'repair-bench', kind: 'service', x: 720 },
			{ id: 'skill-mentor', kind: 'service', x: 930 },
			{ id: 'switchman-zed', kind: 'npc', x: 1120 },
		],
		props: [
			{ id: 'laundry-window', kind: 'light', x: 70, width: 150, height: 116, label: 'LAUNDRY' },
			{ id: 'public-locker', kind: 'archive', x: 210, width: 95, height: 118, label: 'LOCKER' },
			{ id: 'relay-table', kind: 'console', x: 640, width: 170, height: 86, label: 'BLUE MERCY RELAY' },
			{ id: 'lesson-speakers', kind: 'bench', x: 900, width: 150, height: 72, label: 'LOW NOTES' },
		],
	},
	{
		locationId: 'lower-sprawl:settlement',
		width: 1840,
		floorY: 354,
		spawnX: 160,
		walkSpeed: 220,
		interactionRadius: 92,
		farLayer: 'Elevated rails divide the rain into silver bars.',
		midLayer: 'Neon awnings overlap like improvised treaties between vendors.',
		anchors: [
			{ id: 'murr-murrby', kind: 'npc', x: 300 },
			{ id: 'field-shop', kind: 'service', x: 410 },
			{ id: 'mercy-quill', kind: 'npc', x: 720 },
			{ id: 'legal-aid', kind: 'service', x: 825 },
			{ id: 'lio-vale', kind: 'npc', x: 1080 },
			{ id: 'ossie-blue', kind: 'npc', x: 1330 },
			{ id: 'rumor-board', kind: 'service', x: 1580 },
		],
		props: [
			{ id: 'murr-stall', kind: 'stall', x: 230, width: 270, height: 132, label: 'SURVIVAL RETAIL' },
			{ id: 'mercy-table', kind: 'archive', x: 660, width: 230, height: 94, label: 'PUBLIC CASES' },
			{ id: 'camera-pole', kind: 'console', x: 990, width: 58, height: 180, label: 'SMILE' },
			{ id: 'warrant-wall', kind: 'archive', x: 1270, width: 170, height: 124, label: 'IMPOSSIBLE WARRANTS' },
			{ id: 'rumor-wall', kind: 'barrier', x: 1500, width: 190, height: 142, label: 'WHO NEEDS WHAT' },
		],
	},
	{
		locationId: 'lower-sprawl:station',
		width: 3660,
		floorY: 358,
		spawnX: 220,
		walkSpeed: 225,
		interactionRadius: 96,
		farLayer: 'Blue tile and black tunnel mouth hold the reflection of a train not yet present.',
		midLayer: 'Dead clocks, brass cabinets, tea steam, and handwritten timetables occupy the platform.',
		anchors: [
			{ id: 'big-esther-static', kind: 'npc', x: 360 },
			{ id: 'conductor-oona-bell', kind: 'npc', x: 650 },
			{ id: 'transit-control', kind: 'service', x: 820 },
			{ id: 'switchman-zed', kind: 'npc', x: 1100 },
			{ id: 'repair-bench', kind: 'service', x: 1240 },
			{ id: 'sister-version', kind: 'npc', x: 1510 },
			{ id: 'signal-lab', kind: 'service', x: 1630 },
			{ id: 'murr-murrby', kind: 'npc', x: 1810 },
			{ id: 'marlo-turnstile', kind: 'npc', x: 1940 },
			{ id: 'rook-null', kind: 'npc', x: 2040 },
			{ id: 'naya-root', kind: 'npc', x: 2220 },
			{ id: 'juno-jar', kind: 'npc', x: 2400 },
			{ id: 'orchid-debt', kind: 'npc', x: 2590 },
			{ id: 'bassie-knot', kind: 'npc', x: 2780 },
			{ id: 'coco-loop', kind: 'npc', x: 2990 },
			{ id: 'choir-of-static', kind: 'npc', x: 3220 },
			{ id: 'little-ix', kind: 'npc', x: 3450 },
			{ id: 'vera-counterweight', kind: 'npc', x: 3550 },
		],
		props: [
			{ id: 'tea-shield', kind: 'stall', x: 280, width: 180, height: 92, label: 'TEA / STEWARDSHIP' },
			{ id: 'signal-booth', kind: 'console', x: 750, width: 170, height: 152, label: 'BLUE MERCY' },
			{ id: 'maintenance-bay', kind: 'bench', x: 1160, width: 180, height: 82, label: 'TRACK NINE' },
			{ id: 'pirate-booth', kind: 'console', x: 1450, width: 240, height: 126, label: 'SECOND DRAFT RADIO' },
			{ id: 'ghost-train', kind: 'train', x: 30, width: 420, height: 120, label: 'NO OFFICIAL SERVICE' },
			{ id: 'colony-glass-repair', kind: 'light', x: 1990, width: 240, height: 150, label: 'REPAIRED IN ORBIT' },
			{ id: 'platform-greenhouse', kind: 'greenery', x: 2180, width: 310, height: 160, label: 'GREENHOUSE DEPOT' },
			{ id: 'homecoming-archive', kind: 'archive', x: 2510, width: 330, height: 144, label: 'CHOSEN TESTIMONY' },
			{ id: 'circular-child-map', kind: 'archive', x: 2880, width: 240, height: 136, label: 'NO CENTER' },
			{ id: 'commons-choir-stage', kind: 'console', x: 3120, width: 270, height: 150, label: 'TEMPORARY SOLO' },
			{ id: 'protected-map-desk', kind: 'archive', x: 3380, width: 230, height: 142, label: 'PRESENT / PROTECTED' },
			{ id: 'toolkit-checksum', kind: 'light', x: 3520, width: 120, height: 168, label: 'LOCAL COPY OK' },
		],
	},
	{
		locationId: 'drainmarket:safehouse',
		width: 1440,
		floorY: 354,
		spawnX: 160,
		walkSpeed: 205,
		interactionRadius: 88,
		farLayer: 'Floodwater shivers two floors below the clinic grating.',
		midLayer: 'Herb lamps, surgical steel, battery vines, and handwritten triage rules divide the loft.',
		anchors: [
			{ id: 'dr-calyx-reed', kind: 'npc', x: 430 },
			{ id: 'clinic', kind: 'service', x: 570 },
			{ id: 'silk-suture', kind: 'npc', x: 820 },
			{ id: 'greenhouse', kind: 'service', x: 1010 },
			{ id: 'loadout-locker', kind: 'service', x: 1230 },
		],
		props: [
			{ id: 'triage-cots', kind: 'clinic', x: 260, width: 330, height: 90, label: 'NO CAMERA TRIAGE' },
			{ id: 'herb-wall', kind: 'greenery', x: 900, width: 220, height: 150, label: 'MEDICINAL MOSS' },
			{ id: 'supply-locker', kind: 'archive', x: 1190, width: 110, height: 132, label: 'COLD CHAIN' },
		],
	},
	{
		locationId: 'drainmarket:settlement',
		width: 2040,
		floorY: 356,
		spawnX: 180,
		walkSpeed: 215,
		interactionRadius: 92,
		farLayer: 'Invoices drift on black water beneath suspended market bridges.',
		midLayer: 'Boat stalls, pump cables, food steam, and debt auctions compete for the same narrow air.',
		anchors: [
			{ id: 'temple-gauge', kind: 'npc', x: 340 },
			{ id: 'rumor-board', kind: 'service', x: 520 },
			{ id: 'jane-dogear', kind: 'npc', x: 780 },
			{ id: 'archive', kind: 'service', x: 930 },
			{ id: 'bishop-fuse', kind: 'npc', x: 1190 },
			{ id: 'field-shop', kind: 'service', x: 1370 },
			{ id: 'legal-aid', kind: 'service', x: 1580 },
			{ id: 'dr-calyx-reed', kind: 'npc', x: 1810 },
		],
		props: [
			{ id: 'pump-map', kind: 'console', x: 250, width: 190, height: 128, label: 'PUMP WEATHER' },
			{ id: 'book-barge', kind: 'archive', x: 700, width: 290, height: 118, label: 'DOG-EARED DEBTS' },
			{ id: 'fuse-coop', kind: 'bench', x: 1120, width: 210, height: 100, label: 'CURRENT COMMONS' },
			{ id: 'supply-stall', kind: 'stall', x: 1320, width: 230, height: 126, label: 'CLINIC STOCK' },
		],
	},
	{
		locationId: 'drainmarket:station',
		width: 1780,
		floorY: 360,
		spawnX: 180,
		walkSpeed: 220,
		interactionRadius: 94,
		farLayer: 'The submerged rail glows under boat wakes like a sentence under erasure.',
		midLayer: 'Flood gauges, cargo hooks, clinic crates, and passenger ropes turn one platform into three kinds of port.',
		anchors: [
			{ id: 'temple-gauge', kind: 'npc', x: 390 },
			{ id: 'transit-control', kind: 'service', x: 620 },
			{ id: 'silk-suture', kind: 'npc', x: 930 },
			{ id: 'clinic', kind: 'service', x: 1110 },
			{ id: 'bishop-fuse', kind: 'npc', x: 1420 },
			{ id: 'repair-bench', kind: 'service', x: 1580 },
		],
		props: [
			{ id: 'flood-gauge', kind: 'console', x: 310, width: 150, height: 170, label: 'WATER / TRACK' },
			{ id: 'dispatch-booth', kind: 'console', x: 540, width: 170, height: 140, label: 'FLOODLINE' },
			{ id: 'clinic-crates', kind: 'clinic', x: 1030, width: 220, height: 102, label: 'MEDICINE FIRST?' },
			{ id: 'pump-cart', kind: 'bench', x: 1500, width: 170, height: 88, label: 'PUMP NINE' },
		],
	},
	{
		locationId: 'chrome-arcology:safehouse',
		width: 1760,
		floorY: 356,
		spawnX: 170,
		walkSpeed: 210,
		interactionRadius: 90,
		farLayer: 'Freight fans rotate behind walls whose floor number has been ground away.',
		midLayer: 'Soup steam, erased rosters, cargo tools, and negative-space maps occupy the hidden canteen.',
		anchors: [
			{ id: 'odessa-stack', kind: 'npc', x: 330 },
			{ id: 'rumor-board', kind: 'service', x: 490 },
			{ id: 'rook-null', kind: 'npc', x: 760 },
			{ id: 'archive', kind: 'service', x: 910 },
			{ id: 'brother-pallet', kind: 'npc', x: 1190 },
			{ id: 'repair-bench', kind: 'service', x: 1360 },
			{ id: 'loadout-locker', kind: 'service', x: 1570 },
		],
		props: [
			{ id: 'soup-line', kind: 'stall', x: 250, width: 320, height: 106, label: 'THIRD SHIFT SOUP' },
			{ id: 'negative-map', kind: 'archive', x: 690, width: 280, height: 150, label: 'MISSING FLOORS' },
			{ id: 'freight-bench', kind: 'bench', x: 1120, width: 290, height: 98, label: 'PERSON / EQUIPMENT' },
			{ id: 'worker-locker', kind: 'archive', x: 1510, width: 120, height: 142, label: 'UNMANIFESTED' },
		],
	},
	{
		locationId: 'chrome-arcology:settlement',
		width: 2180,
		floorY: 356,
		spawnX: 180,
		walkSpeed: 218,
		interactionRadius: 94,
		farLayer: 'Glass elevators move behind indoor trees with licensed shadows.',
		midLayer: 'Concierge desks, access appeals, premium seating, and service corridors share an immaculate public floor.',
		anchors: [
			{ id: 'velvet-decimal', kind: 'npc', x: 340 },
			{ id: 'field-shop', kind: 'service', x: 520 },
			{ id: 'legal-aid', kind: 'service', x: 790 },
			{ id: 'lio-vale', kind: 'npc', x: 1070 },
			{ id: 'archive', kind: 'service', x: 1260 },
			{ id: 'madame-vitrine', kind: 'npc', x: 1550 },
			{ id: 'rumor-board', kind: 'service', x: 1830 },
		],
		props: [
			{ id: 'velvet-rope', kind: 'barrier', x: 250, width: 360, height: 96, label: 'IMPROPER ACCESS' },
			{ id: 'appeal-desk', kind: 'archive', x: 710, width: 190, height: 118, label: 'PUBLIC APPEAL' },
			{ id: 'family-contract', kind: 'console', x: 1160, width: 210, height: 130, label: 'PROTECTED ADDRESS' },
			{ id: 'vitrine-display', kind: 'light', x: 1460, width: 260, height: 180, label: 'HUMAN DISPLAY' },
		],
	},
	{
		locationId: 'chrome-arcology:station',
		width: 2060,
		floorY: 360,
		spawnX: 190,
		walkSpeed: 220,
		interactionRadius: 96,
		farLayer: 'Lift cables disappear upward while a subway-blue maintenance car waits at floor level.',
		midLayer: 'Freight cages, route test consoles, worker manifests, and premium ascent capsules converge.',
		anchors: [
			{ id: 'tern-spoke', kind: 'npc', x: 350 },
			{ id: 'transit-control', kind: 'service', x: 550 },
			{ id: 'brother-pallet', kind: 'npc', x: 850 },
			{ id: 'repair-bench', kind: 'service', x: 1040 },
			{ id: 'rook-null', kind: 'npc', x: 1320 },
			{ id: 'signal-lab', kind: 'service', x: 1510 },
			{ id: 'loadout-locker', kind: 'service', x: 1810 },
		],
		props: [
			{ id: 'public-interrupt', kind: 'console', x: 270, width: 360, height: 152, label: 'WHO MAY INTERRUP?' },
			{ id: 'sealed-car', kind: 'train', x: 720, width: 340, height: 140, label: 'SEALED FREIGHT' },
			{ id: 'seed-cradle', kind: 'console', x: 1260, width: 340, height: 168, label: 'ELEVATOR SEED' },
			{ id: 'skybound-indicator', kind: 'light', x: 1700, width: 220, height: 130, label: 'ORBITAL EXPRESS' },
		],
	},
	{
		locationId: 'mirror-palace:safehouse',
		width: 1880,
		floorY: 356,
		spawnX: 170,
		walkSpeed: 212,
		interactionRadius: 90,
		farLayer: 'Banquet scenery rotates behind frosted service glass while Earth turns silently beyond it.',
		midLayer: 'Costume rails, route ledgers, magnetic boots, testimony cards, and repair schedules fill the backstage room.',
		anchors: [
			{ id: 'sable-meridian', kind: 'npc', x: 310 },
			{ id: 'rumor-board', kind: 'service', x: 480 },
			{ id: 'lio-vale', kind: 'npc', x: 770 },
			{ id: 'legal-aid', kind: 'service', x: 950 },
			{ id: 'orchid-debt', kind: 'npc', x: 1240 },
			{ id: 'archive', kind: 'service', x: 1430 },
			{ id: 'loadout-locker', kind: 'service', x: 1690 },
		],
		props: [
			{ id: 'identity-rail', kind: 'archive', x: 230, width: 250, height: 138, label: 'STAFF IDENTITIES' },
			{ id: 'closed-routes', kind: 'console', x: 700, width: 260, height: 150, label: 'CLOSED / DELIVERED' },
			{ id: 'refusal-table', kind: 'archive', x: 1160, width: 300, height: 104, label: 'AUDIENCE / EXPIRY' },
			{ id: 'magnetic-locker', kind: 'archive', x: 1640, width: 120, height: 150, label: 'CREW LOADOUT' },
		],
	},
	{
		locationId: 'mirror-palace:settlement',
		width: 2260,
		floorY: 354,
		spawnX: 170,
		walkSpeed: 218,
		interactionRadius: 94,
		farLayer: 'A luxury ballroom repeats in mirrored panels while service lifts move behind the reflections.',
		midLayer: 'Worker benches, lounge microphones, contract menus, guest-profile mirrors, and loading carts share one hidden court.',
		anchors: [
			{ id: 'orchid-debt', kind: 'npc', x: 320 },
			{ id: 'archive', kind: 'service', x: 520 },
			{ id: 'mister-vellum', kind: 'npc', x: 790 },
			{ id: 'field-shop', kind: 'service', x: 970 },
			{ id: 'legal-aid', kind: 'service', x: 1210 },
			{ id: 'reflection-judge', kind: 'npc', x: 1510 },
			{ id: 'sable-meridian', kind: 'npc', x: 1790 },
			{ id: 'rumor-board', kind: 'service', x: 1980 },
		],
		props: [
			{ id: 'premium-stage', kind: 'light', x: 230, width: 330, height: 180, label: 'AUTHENTICITY SET' },
			{ id: 'contract-pairing', kind: 'stall', x: 700, width: 330, height: 118, label: 'BINDING TERMS' },
			{ id: 'guest-profile-mirror', kind: 'console', x: 1410, width: 260, height: 190, label: 'AUTHENTICATED SELF' },
			{ id: 'service-action-board', kind: 'archive', x: 1870, width: 260, height: 140, label: 'UNSCHEDULED' },
		],
	},
	{
		locationId: 'mirror-palace:station',
		width: 2180,
		floorY: 360,
		spawnX: 180,
		walkSpeed: 222,
		interactionRadius: 96,
		farLayer: 'Earth and stars slide behind a moving orbital rail whose geometry refuses to remain still.',
		midLayer: 'A glamorous express platform overlays deleted staff stops, paper timetables, brake keys, and a colony signal disguised as entertainment.',
		anchors: [
			{ id: 'portia-drift', kind: 'npc', x: 340 },
			{ id: 'transit-control', kind: 'service', x: 560 },
			{ id: 'sable-meridian', kind: 'npc', x: 860 },
			{ id: 'repair-bench', kind: 'service', x: 1080 },
			{ id: 'orchid-debt', kind: 'npc', x: 1370 },
			{ id: 'signal-lab', kind: 'service', x: 1570 },
			{ id: 'loadout-locker', kind: 'service', x: 1900 },
		],
		props: [
			{ id: 'staff-local-car', kind: 'train', x: 220, width: 420, height: 144, label: 'FALSE-WORLD LOCAL' },
			{ id: 'deleted-stop-board', kind: 'console', x: 760, width: 300, height: 168, label: '11 STOPS / 0 PUBLIC' },
			{ id: 'moving-rail-bench', kind: 'bench', x: 1030, width: 230, height: 94, label: 'SYNC WINDOW' },
			{ id: 'colony-signal', kind: 'light', x: 1490, width: 300, height: 150, label: 'AMBIENT DUB EXPERIENCE' },
		],
	},
	{
		locationId: 'dub-colony:safehouse',
		width: 1940,
		floorY: 358,
		spawnX: 170,
		walkSpeed: 214,
		interactionRadius: 92,
		farLayer: 'Solar fabric and habitat windows drift beyond two welded maintenance cars.',
		midLayer: 'Vacuum welders, route charters, plant cuttings, magnetic lockers, and the Elevator Seed fill the repair bay.',
		anchors: [
			{ id: 'juno-jar', kind: 'npc', x: 330 },
			{ id: 'repair-bench', kind: 'service', x: 520 },
			{ id: 'auntie-subharmonic', kind: 'npc', x: 820 },
			{ id: 'archive', kind: 'service', x: 1030 },
			{ id: 'lio-vale', kind: 'npc', x: 1300 },
			{ id: 'field-shop', kind: 'service', x: 1510 },
			{ id: 'loadout-locker', kind: 'service', x: 1760 },
		],
		props: [
			{ id: 'impossible-coupler', kind: 'bench', x: 240, width: 380, height: 116, label: 'BIDIRECTIONAL?' },
			{ id: 'seed-adapter', kind: 'console', x: 720, width: 330, height: 170, label: 'SEED / CHORUS' },
			{ id: 'repair-schedule', kind: 'archive', x: 1220, width: 250, height: 144, label: 'CONFESSION → WORK' },
			{ id: 'crew-locker', kind: 'archive', x: 1710, width: 110, height: 150, label: 'MAG BOOTS' },
		],
	},
	{
		locationId: 'dub-colony:settlement',
		width: 2380,
		floorY: 356,
		spawnX: 180,
		walkSpeed: 216,
		interactionRadius: 96,
		farLayer: 'Greenhouse cars, speaker roots, solar petals, and pressure habitats curve into a loop without a visible center.',
		midLayer: 'Assembly circles, oxygen ledgers, seed routes, shield stations, and emergency speakers occupy the garden commons.',
		anchors: [
			{ id: 'bassie-knot', kind: 'npc', x: 320 },
			{ id: 'rumor-board', kind: 'service', x: 500 },
			{ id: 'naya-root', kind: 'npc', x: 790 },
			{ id: 'greenhouse', kind: 'service', x: 990 },
			{ id: 'ames-oxygen', kind: 'npc', x: 1280 },
			{ id: 'legal-aid', kind: 'service', x: 1470 },
			{ id: 'coco-loop', kind: 'npc', x: 1770 },
			{ id: 'archive', kind: 'service', x: 1960 },
			{ id: 'skill-mentor', kind: 'service', x: 2210 },
		],
		props: [
			{ id: 'unfinished-assembly', kind: 'bench', x: 240, width: 390, height: 104, label: 'NO FINAL DOWNBEAT' },
			{ id: 'speaker-garden', kind: 'greenery', x: 700, width: 390, height: 184, label: 'AIR / FOOD / SHIELD' },
			{ id: 'breath-ledger', kind: 'console', x: 1190, width: 340, height: 170, label: 'BREATHABLE EXCEPTIONS' },
			{ id: 'circular-map', kind: 'archive', x: 1690, width: 300, height: 150, label: 'NO CENTER' },
			{ id: 'master-fader', kind: 'console', x: 2110, width: 190, height: 194, label: 'EMERGENCY CHANNEL' },
		],
	},
	{
		locationId: 'dub-colony:station',
		width: 2260,
		floorY: 360,
		spawnX: 190,
		walkSpeed: 220,
		interactionRadius: 98,
		farLayer: 'Greenhouse, workshop, passenger, air-reserve, and solar-control cars circle the colony against black space.',
		midLayer: 'Switch clocks, route windows, cutting racks, public override logs, and the homecoming coupler fill Chorus Rail.',
		anchors: [
			{ id: 'old-quasar-jones', kind: 'npc', x: 340 },
			{ id: 'transit-control', kind: 'service', x: 570 },
			{ id: 'juno-jar', kind: 'npc', x: 870 },
			{ id: 'vera-counterweight', kind: 'npc', x: 990 },
			{ id: 'repair-bench', kind: 'service', x: 1080 },
			{ id: 'naya-root', kind: 'npc', x: 1390 },
			{ id: 'greenhouse', kind: 'service', x: 1590 },
			{ id: 'coco-loop', kind: 'npc', x: 1840 },
			{ id: 'signal-lab', kind: 'service', x: 2050 },
		],
		props: [
			{ id: 'chorus-train', kind: 'train', x: 220, width: 470, height: 148, label: 'COMMONS LOOP' },
			{ id: 'three-clocks', kind: 'console', x: 750, width: 280, height: 160, label: 'TIMETABLE WEATHER' },
			{ id: 'return-coupler', kind: 'bench', x: 1060, width: 360, height: 116, label: 'CITY ↔ COLONY' },
			{ id: 'cutting-car', kind: 'greenery', x: 1480, width: 330, height: 160, label: 'DRAINMARKET CUTTINGS' },
			{ id: 'homecoming-board', kind: 'light', x: 1900, width: 260, height: 150, label: 'CARGO → PASSENGERS' },
		],
	},
	...ANTENNA_BARRENS_SOCIAL_SPACES,
	...ORBITAL_LIFT_SOCIAL_SPACES,
	...ASTEROID_REDOUBT_SOCIAL_SPACES,
];

export function getSocialSpaceLayout(locationId: string): SocialSpaceLayoutDef | undefined {
	return SOCIAL_SPACE_CATALOG.find((layout) => layout.locationId === locationId);
}

export function validateSocialSpaceCatalog(): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();
	for (const layout of SOCIAL_SPACE_CATALOG) {
		if (ids.has(layout.locationId)) errors.push(`duplicate social layout: ${layout.locationId}`);
		ids.add(layout.locationId);
		if (layout.width < 960) errors.push(`${layout.locationId}: layout width below viewport`);
		if (layout.spawnX < 0 || layout.spawnX > layout.width) {
			errors.push(`${layout.locationId}: spawn outside layout`);
		}
		for (const anchor of layout.anchors) {
			if (anchor.x < 0 || anchor.x > layout.width) {
				errors.push(`${layout.locationId}: anchor ${anchor.id} outside layout`);
			}
		}
	}
	return errors;
}

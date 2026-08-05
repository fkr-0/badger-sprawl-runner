import type { DistrictStoryPhase } from './AdventureState';
import { ANTENNA_BARRENS_PLACES } from './AntennaBarrensPlaceContent';
import { ASTEROID_REDOUBT_PLACES } from './AsteroidRedoubtPlaceContent';
import type { NpcServiceId } from './NpcCatalog';
import { ORBITAL_LIFT_PLACES } from './OrbitalLiftPlaceContent';

export type PlaceSafety = 'sanctuary' | 'civilian' | 'contested-civilian';
export type ViolencePolicy = 'disabled' | 'draw-disabled' | 'defensive-only';

export interface PlaceServiceDef {
	id: NpcServiceId;
	label: string;
	description: string;
	minimumLevel: number;
	providerNpcId?: string;
}

export interface PlacePhaseVariant {
	phase: DistrictStoryPhase;
	titleSuffix?: string;
	atmosphere: string;
	ambientLines: string[];
	npcIds: string[];
	serviceIds: NpcServiceId[];
}

export interface PlaceDef {
	locationId: string;
	name: string;
	districtId: string;
	safety: PlaceSafety;
	violencePolicy: ViolencePolicy;
	musicCue: string;
	visualMotif: string;
	interactionHint: string;
	services: PlaceServiceDef[];
	variants: PlacePhaseVariant[];
}

const LOWER_SPRAWL_SERVICES: PlaceServiceDef[] = [
	{
		id: 'repair-bench',
		label: 'Auntie’s Relay Bench',
		description: 'Repair durable gear and inspect modifications without entering an expedition.',
		minimumLevel: 0,
		providerNpcId: 'auntie-subharmonic',
	},
	{
		id: 'loadout-locker',
		label: 'Public Loadout Locker',
		description: 'Change equipped tools at a trusted recovery point.',
		minimumLevel: 0,
		providerNpcId: 'auntie-subharmonic',
	},
	{
		id: 'skill-mentor',
		label: 'Low-Frequency Lessons',
		description: 'Open skill planning and training access.',
		minimumLevel: 0,
		providerNpcId: 'auntie-subharmonic',
	},
	{
		id: 'field-shop',
		label: 'Murr’s Folding Roof Stall',
		description: 'Buy field supplies and sell selected salvage.',
		minimumLevel: 0,
		providerNpcId: 'murr-murrby',
	},
	{
		id: 'legal-aid',
		label: 'Mercy’s Public Case Desk',
		description: 'Review evidence, privacy choices, and legal consequences.',
		minimumLevel: 0,
		providerNpcId: 'mercy-quill',
	},
	{
		id: 'rumor-board',
		label: 'Rainproof Rumor Board',
		description: 'Discover local side quests and repeatable maintenance contracts.',
		minimumLevel: 0,
	},
	{
		id: 'transit-control',
		label: 'Blue Mercy Signal Booth',
		description: 'Inspect line health, route ownership, and public transit decisions.',
		minimumLevel: 0,
		providerNpcId: 'conductor-oona-bell',
	},
	{
		id: 'signal-lab',
		label: 'Sister Version’s Pirate Booth',
		description: 'Review intercepted signals and broadcast consequences.',
		minimumLevel: 1,
		providerNpcId: 'sister-version',
	},
];

const DRAINMARKET_SERVICES: PlaceServiceDef[] = [
	{
		id: 'clinic',
		label: 'Calyx Night Clinic',
		description: 'Recover, review field injuries, and allocate scarce medical supplies without surrendering patient data.',
		minimumLevel: 0,
		providerNpcId: 'dr-calyx-reed',
	},
	{
		id: 'greenhouse',
		label: 'Medicinal Moss Wall',
		description: 'Inspect local cultivation, clinic shortages, and future colony agriculture links.',
		minimumLevel: 0,
		providerNpcId: 'dr-calyx-reed',
	},
	{
		id: 'loadout-locker',
		label: 'Cold-Chain Courier Locker',
		description: 'Equip persistent field gear beside the clinic dispatch board.',
		minimumLevel: 0,
		providerNpcId: 'silk-suture',
	},
	{
		id: 'rumor-board',
		label: 'Pump Weather Board',
		description: 'Read flood forecasts, missing deliveries, and local maintenance contracts.',
		minimumLevel: 0,
		providerNpcId: 'temple-gauge',
	},
	{
		id: 'archive',
		label: 'Dog-Eared Obligation Archive',
		description: 'Compare mutual promises with predatory contracts before deciding what evidence to publish.',
		minimumLevel: 0,
		providerNpcId: 'jane-dogear',
	},
	{
		id: 'legal-aid',
		label: 'Floating Contract Clinic',
		description: 'Challenge repossession authority and protect patient identities.',
		minimumLevel: 0,
		providerNpcId: 'jane-dogear',
	},
	{
		id: 'field-shop',
		label: 'Clinic Supply Counter',
		description: 'Buy limited field supplies from stock whose scarcity remains visible.',
		minimumLevel: 0,
		providerNpcId: 'jane-dogear',
	},
	{
		id: 'transit-control',
		label: 'Floodline Dispatch',
		description: 'Negotiate medicine, passengers, market cargo, and flood-control priority on shared track.',
		minimumLevel: 0,
		providerNpcId: 'temple-gauge',
	},
	{
		id: 'repair-bench',
		label: 'Current Commons Work Cart',
		description: 'Repair field equipment against a public parts and power budget.',
		minimumLevel: 0,
		providerNpcId: 'bishop-fuse',
	},
];

const CHROME_ARCOLOGY_SERVICES: PlaceServiceDef[] = [
	{
		id: 'archive',
		label: 'Rook’s Negative-Space Archive',
		description: 'Inspect deleted floors, protected occupancy, route evidence, and publication consent.',
		minimumLevel: 0,
		providerNpcId: 'rook-null',
	},
	{
		id: 'repair-bench',
		label: 'Brother Pallet’s Freight Bench',
		description: 'Repair field gear with reclaimed lift and freight parts.',
		minimumLevel: 0,
		providerNpcId: 'brother-pallet',
	},
	{
		id: 'loadout-locker',
		label: 'Unmanifested Worker Locker',
		description: 'Change persistent equipment without adding the loadout to an employer profile.',
		minimumLevel: 0,
		providerNpcId: 'brother-pallet',
	},
	{
		id: 'rumor-board',
		label: 'Odessa’s Missing-Shift Board',
		description: 'Read meal counts, hidden break windows, and labor-floor obligations.',
		minimumLevel: 0,
		providerNpcId: 'odessa-stack',
	},
	{
		id: 'skill-mentor',
		label: 'Break-Room Cipher Lessons',
		description: 'Plan skills around timing, restraint, vertical movement, and coordinated interruption.',
		minimumLevel: 0,
		providerNpcId: 'odessa-stack',
	},
	{
		id: 'field-shop',
		label: 'Velvet’s Improper Amenities',
		description: 'Buy restricted access tools and ordinary supplies presented with extraordinary posture.',
		minimumLevel: 0,
		providerNpcId: 'velvet-decimal',
	},
	{
		id: 'legal-aid',
		label: 'Public Appeal for Private Doors',
		description: 'Review service contracts, retaliation clauses, and the difference between permission and right.',
		minimumLevel: 0,
		providerNpcId: 'velvet-decimal',
	},
	{
		id: 'transit-control',
		label: 'Cargo Lift Public Interrupt',
		description: 'Inspect lift priority, emergency overrides, sealed freight, and the future orbital route.',
		minimumLevel: 0,
		providerNpcId: 'tern-spoke',
	},
	{
		id: 'signal-lab',
		label: 'Elevator Seed Test Console',
		description: 'Review routing defaults, failure modes, and who may interrupt a scheduled ascent.',
		minimumLevel: 1,
		providerNpcId: 'rook-null',
	},
];

const MIRROR_PALACE_SERVICES: PlaceServiceDef[] = [
	{
		id: 'rumor-board',
		label: 'Sable’s Unscheduled Service Board',
		description: 'Read staff-route interruptions, guest events, missing workers, and service actions the Palace refuses to schedule.',
		minimumLevel: 0,
		providerNpcId: 'sable-meridian',
	},
	{
		id: 'legal-aid',
		label: 'Backstage Contract Clinic',
		description: 'Review retaliation clauses, staff liabilities, testimony terms, and Lio’s repair obligations.',
		minimumLevel: 0,
		providerNpcId: 'sable-meridian',
	},
	{
		id: 'archive',
		label: 'Table of Refusals',
		description: 'Inspect testimony with audience, expiry, withdrawal, and protected-context rules.',
		minimumLevel: 0,
		providerNpcId: 'orchid-debt',
	},
	{
		id: 'field-shop',
		label: 'Vellum’s Complimentary Necessities',
		description: 'Buy orbital field tools whose hidden contractual assumptions are now displayed beside the price.',
		minimumLevel: 0,
		providerNpcId: 'mister-vellum',
	},
	{
		id: 'loadout-locker',
		label: 'Staff Costume and Loadout Rail',
		description: 'Change persistent equipment behind the scenery rather than through a guest-profile fitting.',
		minimumLevel: 0,
		providerNpcId: 'sable-meridian',
	},
	{
		id: 'transit-control',
		label: 'False-World Tram Dispatch',
		description: 'Inspect guest express priority, deleted staff stops, moving-track delay, and public transfer rights.',
		minimumLevel: 0,
		providerNpcId: 'portia-drift',
	},
	{
		id: 'repair-bench',
		label: 'Portia’s Moving-Rail Bench',
		description: 'Repair transit and field gear against orbital synchronization windows.',
		minimumLevel: 0,
		providerNpcId: 'portia-drift',
	},
	{
		id: 'signal-lab',
		label: 'Authorship Court Mirror Tap',
		description: 'Inspect profile joins, contradictory reports, and who currently owns the rendered self.',
		minimumLevel: 1,
		providerNpcId: 'orchid-debt',
	},
];

const DUB_COLONY_SERVICES: PlaceServiceDef[] = [
	{
		id: 'repair-bench',
		label: 'Juno’s Impossible Coupler Bench',
		description: 'Repair and adapt field gear, Chorus Rail hardware, and the bidirectional return coupler.',
		minimumLevel: 0,
		providerNpcId: 'juno-jar',
	},
	{
		id: 'field-shop',
		label: 'Repair-Bay Spare Parts Shelf',
		description: 'Trade for curated habitat tools and supplies with maintenance debt shown beside stock.',
		minimumLevel: 0,
		providerNpcId: 'juno-jar',
	},
	{
		id: 'loadout-locker',
		label: 'Magnetic Crew Locker',
		description: 'Equip persistent tools before entering pressure routes or greenhouse cars.',
		minimumLevel: 0,
		providerNpcId: 'juno-jar',
	},
	{
		id: 'greenhouse',
		label: 'Naya’s Speaker Garden',
		description: 'Inspect food, medicinal cuttings, air exchange, shield timing, and return-to-city cultivation plans.',
		minimumLevel: 0,
		providerNpcId: 'naya-root',
	},
	{
		id: 'skill-mentor',
		label: 'Bassie’s Unfinished-Beat Workshop',
		description: 'Plan defense, rhythm, interruption, and cooperative timing skills.',
		minimumLevel: 0,
		providerNpcId: 'bassie-knot',
	},
	{
		id: 'rumor-board',
		label: 'Assembly Open Queue',
		description: 'Read habitat proposals, maintenance obligations, emergency objections, and rotating facilitation.',
		minimumLevel: 0,
		providerNpcId: 'bassie-knot',
	},
	{
		id: 'archive',
		label: 'Emergency History Stack',
		description: 'Compare the crises King Feedback survived with the powers that failed to expire afterward.',
		minimumLevel: 0,
		providerNpcId: 'bassie-knot',
	},
	{
		id: 'legal-aid',
		label: 'Breathable Exceptions Desk',
		description: 'Challenge oxygen priority, protected medical exceptions, and emergency-channel authority.',
		minimumLevel: 0,
		providerNpcId: 'ames-oxygen',
	},
	{
		id: 'transit-control',
		label: 'Chorus Rail and Solar Window Board',
		description: 'Inspect greenhouse trains, passenger cars, solar windows, air reserves, and the future homecoming route.',
		minimumLevel: 0,
		providerNpcId: 'old-quasar-jones',
	},
	{
		id: 'signal-lab',
		label: 'Rotating Fader Console',
		description: 'Inspect task-scoped emergency authority, expiry, interruption, and cross-room objections.',
		minimumLevel: 1,
		providerNpcId: 'bassie-knot',
	},
];

export const PLACE_LEDGER: PlaceDef[] = [
	{
		locationId: 'lower-sprawl:safehouse',
		name: "Auntie Subharmonic's Relay",
		districtId: 'lower-sprawl',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'relay-room-nocturne',
		visualMotif:
			'An abandoned signal room converted into kitchen, workshop, listening room, and neighborhood archive. Warm valves glow under rain-streaked glass.',
		interactionHint: 'Talk, repair, plan, and listen before going back into the rain.',
		services: LOWER_SPRAWL_SERVICES.filter((service) =>
			['repair-bench', 'loadout-locker', 'skill-mentor'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The relay is hidden under a laundromat hum. Every low note is checked against a police scanner before anyone relaxes.',
				ambientLines: [
					'A kettle clicks in counterpoint with a distant fare alarm.',
					'Somebody has written “THE CITY IS NOT AN APP” above the fuse board.',
					'Auntie keeps the old line map covered by a tablecloth patterned with blue trains.',
				],
				npcIds: ['auntie-subharmonic'],
				serviceIds: ['repair-bench', 'loadout-locker', 'skill-mentor'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Public Relay House',
				atmosphere:
					'The hidden room has become a crowded civic workshop. Shift rosters, route proposals, and repair lessons cover the walls.',
				ambientLines: [
					'Two teenagers argue about braking curves with the seriousness of constitutional lawyers.',
					'The old secret map is now laminated, annotated, and frequently contradicted.',
					'Auntie has placed the master key inside a glass box labeled “BREAK ONLY BY VOTE.”',
				],
				npcIds: ['auntie-subharmonic', 'switchman-zed'],
				serviceIds: ['repair-bench', 'loadout-locker', 'skill-mentor'],
			},
		],
	},
	{
		locationId: 'lower-sprawl:settlement',
		name: 'Drainmarket Edge',
		districtId: 'lower-sprawl',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'awning-mile-after-rain',
		visualMotif:
			'Food stalls under patched neon awnings, legal-aid tables beside bootleg batteries, steam rising around surveillance poles decorated as public art.',
		interactionHint: 'The market is not safe because nobody is armed. It is safe because everybody is watching the same hands.',
		services: LOWER_SPRAWL_SERVICES.filter((service) =>
			['field-shop', 'legal-aid', 'rumor-board'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Patrol scooters pass slowly enough to be seen and quickly enough to avoid conversation. Vendors price goods between fare surges.',
				ambientLines: [
					'Murr unfolds a fourth shelf from a coat that should only contain three.',
					'Mercy redacts a warrant with a paint marker thick enough to qualify as architecture.',
					'Lio watches every camera except the one directly above him.',
				],
				npcIds: ['murr-murrby', 'lio-vale', 'ossie-blue', 'mercy-quill'],
				serviceIds: ['field-shop', 'legal-aid', 'rumor-board'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Night Commons',
				atmosphere:
					'Toll screens now show train arrivals, clinic needs, and public arguments. The market stays open late because the night line finally returns.',
				ambientLines: [
					'A fare scanner has been converted into a recipe exchange.',
					'Ossie’s old warrant case now holds donated saxophone reeds.',
					'Murr advertises “cooperative pricing,” then complains that democracy has terrible margins.',
				],
				npcIds: ['murr-murrby', 'ossie-blue', 'mercy-quill'],
				serviceIds: ['field-shop', 'legal-aid', 'rumor-board'],
			},
		],
	},
	{
		locationId: 'lower-sprawl:station',
		name: 'Toll Line Relay',
		districtId: 'lower-sprawl',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'blue-mercy-platform',
		visualMotif:
			'Blue tile, dead clocks, brass signal cabinets, a platform long enough to feel like a sentence interrupted before its verb.',
		interactionHint: 'Read the line, hear the city, and decide what kind of train deserves to arrive.',
		services: LOWER_SPRAWL_SERVICES.filter((service) =>
			['transit-control', 'signal-lab', 'repair-bench'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Only maintenance lamps are lit. Esther guards the stairs, Oona studies an unofficial timetable, and Zed quietly powers rails the Ledger marked unprofitable.',
				ambientLines: [
					'A dead arrival board flashes one blue pixel every thirteen seconds.',
					'Rainwater on the tracks reflects a train that is not present.',
					'An announcement begins “Passengers are reminded—” and forgets the rest.',
				],
				npcIds: [
					'conductor-oona-bell',
					'big-esther-static',
					'switchman-zed',
					'marlo-turnstile',
				],
				serviceIds: ['transit-control', 'repair-bench'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Blue Mercy Public Platform',
				atmosphere:
					'Trains arrive imperfectly and on purpose. The platform hosts food deliveries, legal clinics, pirate radio, and arguments about the next timetable.',
				ambientLines: [
					'Sister Version samples the brake squeal into a bass line.',
					'Children rename the express track “NO SKIPPING PEOPLE.”',
					'The public address system announces delays and who is repairing them.',
				],
				npcIds: [
					'conductor-oona-bell',
					'big-esther-static',
					'switchman-zed',
					'sister-version',
					'murr-murrby',
					'marlo-turnstile',
					'vera-counterweight',
				],
				serviceIds: ['transit-control', 'signal-lab', 'repair-bench'],
			},
		],
	},
	{
		locationId: 'drainmarket:safehouse',
		name: 'Mutual-Aid Clinic Loft',
		districtId: 'drainmarket',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'cold-chain-nocturne',
		visualMotif:
			'Surgical steel, herb lamps, battery vines, courier lockers, and floodwater glimmering below an open industrial grating.',
		interactionHint: 'Treat injury, inspect scarcity, and learn why a safe route must be redundant.',
		services: DRAINMARKET_SERVICES.filter((service) =>
			['clinic', 'greenhouse', 'loadout-locker'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The clinic keeps its windows dark because collection drones classify visible recovery as resalable capacity.',
				ambientLines: [
					'Silk checks the same seven blind corners on every dispatch map.',
					'Calyx labels one refrigerator “INSULIN” and the other “ARGUMENTS ABOUT INSULIN.”',
					'A patient ledger records symptoms but refuses addresses.',
				],
				npcIds: ['dr-calyx-reed', 'silk-suture'],
				serviceIds: ['clinic', 'greenhouse', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Open Vein Clinic Depot',
				atmosphere:
					'The loft dispatches medicine through multiple public and protected routes. No single courier carries the district’s survival anymore.',
				ambientLines: [
					'Cold-chain status is public; patient identities are not.',
					'New couriers practice handoffs until heroics become boring logistics.',
					'Greenhouse cuttings wait for a future journey to Dub Colony.',
				],
				npcIds: ['dr-calyx-reed', 'silk-suture', 'bishop-fuse'],
				serviceIds: ['clinic', 'greenhouse', 'loadout-locker'],
			},
		],
	},
	{
		locationId: 'drainmarket:settlement',
		name: 'Drainmarket Commons',
		districtId: 'drainmarket',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'invoice-canal-cipher',
		visualMotif:
			'Boat stalls, suspended bridges, waterproof archives, pump cables, food steam, and invoices drifting through black water.',
		interactionHint: 'Read the obligations before cutting them. Some debts are how neighbors remember each other.',
		services: DRAINMARKET_SERVICES.filter((service) =>
			['rumor-board', 'archive', 'legal-aid', 'field-shop'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Knife drones auction seized stock above vendors who still owe one another favors no machine can price correctly.',
				ambientLines: [
					'Temple taps a flood gauge and listens to the answer through headphones.',
					'Jane sells a blank receipt with a forty-minute explanation of why it matters.',
					'Bishop Fuse’s portable organ runs on power diverted from an advertising buoy.',
				],
				npcIds: ['temple-gauge', 'jane-dogear', 'bishop-fuse', 'dr-calyx-reed'],
				serviceIds: ['rumor-board', 'archive', 'legal-aid', 'field-shop'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Obligation Commons',
				atmosphere:
					'Mutual promises and commercial claims occupy separate public ledgers. The distinction remains disputed and therefore alive.',
				ambientLines: [
					'Vendors vote on emergency stock before the auction bell can ring.',
					'Jane’s archive lists who may renegotiate each obligation.',
					'Temple’s gauges publish uncertainty beside the number.',
				],
				npcIds: ['temple-gauge', 'jane-dogear', 'bishop-fuse', 'dr-calyx-reed'],
				serviceIds: ['rumor-board', 'archive', 'legal-aid', 'field-shop'],
			},
		],
	},
	{
		locationId: 'drainmarket:station',
		name: 'Floodline Platform',
		districtId: 'drainmarket',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'open-vein-platform',
		visualMotif:
			'A half-submerged station where boat wakes cross glowing rail, clinic crates hang from cargo hooks, and passengers tie safety ropes between columns.',
		interactionHint: 'Every departure is a public argument over medicine, people, food, and flood control.',
		services: DRAINMARKET_SERVICES.filter((service) =>
			['transit-control', 'clinic', 'repair-bench'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The Floodline receives maintenance cars but no recognized passengers. Clinic crates move under forged pump manifests.',
				ambientLines: [
					'A departure board alternates between water depth and debt warnings.',
					'Silk knots a passenger rope around cargo classified as medical waste.',
					'Pump Nine clicks once for water and twice for footsteps.',
				],
				npcIds: ['temple-gauge', 'silk-suture', 'bishop-fuse'],
				serviceIds: ['transit-control', 'clinic', 'repair-bench'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'The Open Vein',
				atmosphere:
					'Medicine, passengers, food, and flood machinery share track through published priority windows and emergency objections.',
				ambientLines: [
					'Calyx complains that the first legitimate medicine train is seven minutes late and therefore credible.',
					'Temple’s public gauge displays who calibrated it and who disagreed.',
					'Former knife-drone mechanics repair cargo hooks under union observation.',
				],
				npcIds: ['temple-gauge', 'silk-suture', 'bishop-fuse', 'dr-calyx-reed'],
				serviceIds: ['transit-control', 'clinic', 'repair-bench'],
			},
		],
	},
	{
		locationId: 'chrome-arcology:safehouse',
		name: 'Labor Floor B2 Canteen',
		districtId: 'chrome-arcology',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'missing-shift-hard-bop',
		visualMotif:
			'A windowless cafeteria hidden between freight ventilation and an elevator stop absent from every public diagram.',
		interactionHint: 'Eat, count carefully, ask before mapping, and learn which break can become an assembly.',
		services: CHROME_ARCOLOGY_SERVICES.filter((service) =>
			['archive', 'repair-bench', 'loadout-locker', 'rumor-board', 'skill-mentor'].includes(
				service.id
			)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The canteen serves a shift management says does not exist. Every bowl is evidence; every complete headcount is also a threat.',
				ambientLines: [
					'Odessa removes one identifying beat from the break schedule.',
					'Rook projects a floor plan whose most important rooms are blank.',
					'Brother Pallet parks beneath a sign reading EQUIPMENT MUST NOT BLOCK EXIT.',
				],
				npcIds: ['rook-null', 'odessa-stack', 'brother-pallet'],
				serviceIds: ['archive', 'repair-bench', 'loadout-locker', 'rumor-board', 'skill-mentor'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Missing-Shift Assembly Canteen',
				atmosphere:
					'The canteen publishes work, risk, volunteers, and withdrawal rights without publishing protected addresses.',
				ambientLines: [
					'Every roster entry has an erase date and an appeal mark.',
					'Workers debate orbital supply shifts over soup.',
					'Odessa keeps one empty bowl for anybody the count still missed.',
				],
				npcIds: ['odessa-stack', 'brother-pallet'],
				serviceIds: ['archive', 'repair-bench', 'loadout-locker', 'rumor-board', 'skill-mentor'],
			},
		],
	},
	{
		locationId: 'chrome-arcology:settlement',
		name: 'Service Atrium',
		districtId: 'chrome-arcology',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'velvet-rope-cipher',
		visualMotif:
			'A spotless public concourse where every door asks for a private reason and every courtesy contains a credential check.',
		interactionHint: 'Perform belonging, contest the door, buy an exception, or expose why public space needs one.',
		services: CHROME_ARCOLOGY_SERVICES.filter((service) =>
			['field-shop', 'legal-aid', 'archive', 'rumor-board'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Premium guests glide through doors that interrogate workers. Vitrine offers everyone a better category than the one harming them.',
				ambientLines: [
					'Velvet adjusts a rope until it blocks only the camera.',
					'Lio’s corporate shoe knows the floor better than his street boot.',
					'A fountain recites the privacy policy too softly to hear.',
				],
				npcIds: ['velvet-decimal', 'lio-vale', 'madame-vitrine'],
				serviceIds: ['field-shop', 'legal-aid', 'archive', 'rumor-board'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Public Access Atrium',
				atmosphere:
					'Doors display their rules, appeal path, maintainer, failure state, and current objections.',
				ambientLines: [
					'Velvet chairs an appeal while denying she chairs anything.',
					'The fountain reads rejected clauses as comedy.',
					'Workers debate who receives the first orbital training seats.',
				],
				npcIds: ['velvet-decimal', 'odessa-stack', 'lio-vale'],
				serviceIds: ['field-shop', 'legal-aid', 'archive', 'rumor-board'],
			},
		],
	},
	{
		locationId: 'chrome-arcology:station',
		name: 'Cargo Lift Interchange',
		districtId: 'chrome-arcology',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'vertical-line-noir',
		visualMotif:
			'Freight elevators, worker cages, premium ascent capsules, and a subway-blue maintenance car meet beneath a route diagram bending toward orbit.',
		interactionHint: 'Read the manifest, interrupt the ascent, and decide whether orbit becomes a penthouse or another stop.',
		services: CHROME_ARCOLOGY_SERVICES.filter((service) =>
			['transit-control', 'repair-bench', 'loadout-locker', 'signal-lab'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Workers ride freight cages while premium capsules call themselves mobility. Sealed human cargo arrives without passenger manifests.',
				ambientLines: [
					'Tern compares a brake curve with a tenant-rights pamphlet.',
					'Brother Pallet asks every sealed container whether it has a preferred name.',
					'The orbital indicator lights only when nobody here may board.',
				],
				npcIds: ['tern-spoke', 'brother-pallet'],
				serviceIds: ['transit-control', 'repair-bench', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Vertical Commons Interchange',
				atmosphere:
					'Lift priority is inspectable and interruptible. The Elevator Seed waits in a test cradle while crews argue over the first skybound charter.',
				ambientLines: [
					'Rook labels the orbital branch PROVISIONAL UNTIL CONTRADICTED.',
					'Tern runs failure drills where nobody is declared expendable.',
					'Former sealed cars receive windows, seats, and passenger names.',
				],
				npcIds: ['tern-spoke', 'rook-null', 'brother-pallet', 'velvet-decimal'],
				serviceIds: ['transit-control', 'repair-bench', 'loadout-locker', 'signal-lab'],
			},
		],
	},
	{
		locationId: 'mirror-palace:safehouse',
		name: 'Lio’s Backstage Room',
		districtId: 'mirror-palace',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'backstage-noir-reprise',
		visualMotif:
			'A narrow staff dressing room behind the orbital banquet scenery, full of magnetic boots, route ledgers, removed name badges, and a window showing luxury from the service side.',
		interactionHint: 'Read the coercion chain, plan protected transfers, and decide what repair must become after confession.',
		services: MIRROR_PALACE_SERVICES.filter((service) =>
			['rumor-board', 'legal-aid', 'archive', 'loadout-locker'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Staff change identities between courses. Lio’s closed-route list hangs beside family photographs and the names of workers those closures delivered.',
				ambientLines: [
					'Sable confirms a strike action in the tone of a dessert substitution.',
					'Lio marks one saved address and two harmed routes without drawing a line between them.',
					'Orchid rehearses a song whose audience field remains blank.',
				],
				npcIds: ['sable-meridian', 'lio-vale', 'orchid-debt'],
				serviceIds: ['rumor-board', 'legal-aid', 'archive', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Staff Transfer and Repair Room',
				atmosphere:
					'Route closures, repair schedules, testimony audiences, and staff transfers are posted under worker review rather than hidden as hospitality operations.',
				ambientLines: [
					'Every confession is followed by an assigned repair shift.',
					'The costume rail now carries work roles rather than guest-approved identities.',
					'Sable’s council minutes include who objected and who may reopen the decision.',
				],
				npcIds: ['sable-meridian', 'lio-vale', 'orchid-debt'],
				serviceIds: ['rumor-board', 'legal-aid', 'archive', 'loadout-locker'],
			},
		],
	},
	{
		locationId: 'mirror-palace:settlement',
		name: 'Banquet Servants’ Court',
		districtId: 'mirror-palace',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'complimentary-obligation-suite',
		visualMotif:
			'A worker court hidden behind rotating banquet walls, half lounge and half loading dock, where guest applause leaks through service vents.',
		interactionHint: 'Hear chosen refusals, expose contract pairings, and contest a room that buys authenticity by the glass.',
		services: MIRROR_PALACE_SERVICES.filter((service) =>
			['field-shop', 'legal-aid', 'archive', 'rumor-board', 'signal-lab'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Workers trade service signals under music licensed as premium struggle. The Reflection Judge renders everyone’s compromise as proof that ownership is necessary.',
				ambientLines: [
					'Orchid finishes a refusal before the applause sample can trigger.',
					'Vellum pairs air debt with an excellent inherited-liability reduction.',
					'The Judge’s face changes to whoever currently owns the room microphone.',
				],
				npcIds: ['orchid-debt', 'mister-vellum', 'reflection-judge', 'sable-meridian'],
				serviceIds: ['field-shop', 'legal-aid', 'archive', 'rumor-board'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Refusal and Service Assembly',
				atmosphere:
					'Testimony displays its chosen audience, expiry, withdrawal path, and protected context. Guest service pauses when the workers’ court calls an objection.',
				ambientLines: [
					'Premium listening has been replaced by a public “not available to you” notice.',
					'Vellum now reads the harmful clause before naming the vintage.',
					'Orchid records the room’s silence as an answer rather than an absence.',
				],
				npcIds: ['orchid-debt', 'mister-vellum', 'sable-meridian'],
				serviceIds: ['field-shop', 'legal-aid', 'archive', 'rumor-board', 'signal-lab'],
			},
		],
	},
	{
		locationId: 'mirror-palace:station',
		name: 'False-World Tram',
		districtId: 'mirror-palace',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'staff-local-in-orbit',
		visualMotif:
			'A white orbital tram with one glamorous circular line and eleven ugly staff stops erased beneath animated reflections of Earth.',
		interactionHint: 'Restore local stops, publish transfer priority, and prepare the route that will reach the colony without making it a resort annex.',
		services: MIRROR_PALACE_SERVICES.filter((service) =>
			['transit-control', 'repair-bench', 'loadout-locker', 'signal-lab'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The guest express circles perfectly because the staff local absorbs every delay out of sight. Portia keeps the useful timetable on paper.',
				ambientLines: [
					'A deleted stop flashes for half a second when a service worker crosses the sensor.',
					'Portia brakes before the route map admits there is a platform.',
					'The colony signal enters through entertainment bandwidth marked AMBIENT DUB EXPERIENCE.',
				],
				npcIds: ['portia-drift', 'sable-meridian', 'orchid-debt'],
				serviceIds: ['transit-control', 'repair-bench', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Public Staff Local',
				atmosphere:
					'The express waits for staff transfers. Every stop shows purpose, maintainer, delay cause, interruption rights, and whether the colony accepted the connection.',
				ambientLines: [
					'Luxury guests discover the emotional complexity of waiting three minutes.',
					'Orchid’s departure announcement credits the crew before the sponsor.',
					'The Dub Colony route reads PEER CONNECTION — DESTINATION MAY REVISE.',
				],
				npcIds: ['portia-drift', 'orchid-debt', 'sable-meridian'],
				serviceIds: ['transit-control', 'repair-bench', 'loadout-locker', 'signal-lab'],
			},
		],
	},
	{
		locationId: 'dub-colony:safehouse',
		name: 'Auntie’s Repair Bay',
		districtId: 'dub-colony',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'vacuum-welder-yard',
		visualMotif:
			'Two decommissioned subway maintenance cars welded into a pressure workshop, every surface holding a tool, plant cutting, route argument, or beautiful unnecessary modification.',
		interactionHint: 'Repair equipment, adapt the Elevator Seed, build the return coupler, and decide whether connection can remain bidirectional.',
		services: DUB_COLONY_SERVICES.filter((service) =>
			['repair-bench', 'field-shop', 'loadout-locker', 'archive'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Juno fits the Seed to a rail that expects argument. Auntie listens to the colony’s maintenance rhythm and refuses to call it improvised merely because the city did not certify it.',
				ambientLines: [
					'Juno welds a decorative apology plate onto a politically dangerous adapter.',
					'Auntie’s old master key remains wrapped in a public-procedure draft.',
					'Lio’s repair schedule occupies more wall than his confession.',
				],
				npcIds: ['juno-jar', 'auntie-subharmonic', 'lio-vale'],
				serviceIds: ['repair-bench', 'field-shop', 'loadout-locker', 'archive'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Bidirectional Coupler Workshop',
				atmosphere:
					'The return coupler permits independent interruption and destination revision. Maintenance debt is assigned before decorative improvements begin.',
				ambientLines: [
					'Juno’s tool now performs one beautiful unnecessary thing after completing two boring necessary ones.',
					'The city and colony copies of the route charter disagree in publicly visible margins.',
					'A pressure test announcement uses Blue Mercy’s low note as the all-clear.',
				],
				npcIds: ['juno-jar', 'auntie-subharmonic', 'lio-vale'],
				serviceIds: ['repair-bench', 'field-shop', 'loadout-locker', 'archive'],
			},
		],
	},
	{
		locationId: 'dub-colony:settlement',
		name: 'Speaker Garden Assembly',
		districtId: 'dub-colony',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'unfinished-beat-assembly',
		visualMotif:
			'A greenhouse commons grown through retired subway cars, speaker roots carrying announcements, shield pulses, oxygen data, bass, and arguments between habitats.',
		interactionHint: 'Hear the emergency history, contest air allocation, rotate the fader, and decide what the colony sends back to the city.',
		services: DUB_COLONY_SERVICES.filter((service) =>
			[
				'greenhouse',
				'skill-mentor',
				'rumor-board',
				'archive',
				'legal-aid',
				'signal-lab',
			].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'King Feedback’s emergency channel still owns the loudest speaker. Bassie keeps the assembly unfinished so nobody mistakes applause for consent.',
				ambientLines: [
					'Naya’s shield gives a minority report twelve uninterrupted seconds.',
					'Ames updates the breathable-exception ledger without looking up.',
					'Coco moves seed packets between cars on a route drawn as a circle.',
				],
				npcIds: ['bassie-knot', 'naya-root', 'ames-oxygen', 'coco-loop'],
				serviceIds: ['greenhouse', 'skill-mentor', 'rumor-board', 'archive', 'legal-aid'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Rotating-Fader Commons',
				atmosphere:
					'Task authority rotates, expires, and can be interrupted by independent rooms. Air forecasts show assumptions, confidence, protected exceptions, and objections.',
				ambientLines: [
					'The master speaker displays who may turn it down and when that authority expires.',
					'Coco labels the city route CONNECTION, NOT RETURN TO CENTER.',
					'Naya prepares platform greenhouse kits beside defensive shields nobody is required to worship.',
				],
				npcIds: ['bassie-knot', 'naya-root', 'ames-oxygen', 'coco-loop', 'juno-jar'],
				serviceIds: ['greenhouse', 'skill-mentor', 'rumor-board', 'archive', 'legal-aid', 'signal-lab'],
			},
		],
	},
	{
		locationId: 'dub-colony:station',
		name: 'Chorus Rail',
		districtId: 'dub-colony',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'greenhouse-train-homebound',
		visualMotif:
			'Decommissioned subway cars coupled into greenhouse, workshop, passenger, air-reserve, and solar-control trains moving around the colony as one unfinished loop.',
		interactionHint: 'Schedule greenhouse cars, solar windows, air reserve, passengers, and the bidirectional line that will eventually carry the colony home to the city without subordinating it.',
		services: DUB_COLONY_SERVICES.filter((service) =>
			['transit-control', 'repair-bench', 'greenhouse', 'signal-lab', 'loadout-locker'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Chorus Rail runs through emergency overrides nobody may inspect. Greenhouse cars wait behind command traffic while the city appears at the end of an official line.',
				ambientLines: [
					'Quasar’s three clocks disagree but publish why.',
					'Juno tests a coupler that refuses one-way authority.',
					'A medicinal cutting car carries the smell of Drainmarket rain.',
				],
				npcIds: [
					'old-quasar-jones',
					'juno-jar',
					'naya-root',
					'coco-loop',
					'vera-counterweight',
				],
				serviceIds: ['transit-control', 'repair-bench', 'greenhouse', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Commons Loop and Homecoming Line',
				atmosphere:
					'Greenhouse, passenger, air, and workshop cars negotiate published windows. Either end may interrupt or revise the city connection.',
				ambientLines: [
					'The destination board alternates CITY, COLONY, and ROUTE UNDER REVISION.',
					'Quasar trains three replacement switch crews on the dangerous manual controls.',
					'Homecoming cargo labels have been crossed out and replaced with passenger names.',
				],
				npcIds: [
					'old-quasar-jones',
					'juno-jar',
					'naya-root',
					'coco-loop',
					'bassie-knot',
					'vera-counterweight',
				],
				serviceIds: ['transit-control', 'repair-bench', 'greenhouse', 'signal-lab', 'loadout-locker'],
			},
		],
	},
	...ANTENNA_BARRENS_PLACES,
	...ORBITAL_LIFT_PLACES,
	...ASTEROID_REDOUBT_PLACES,
];

export function getPlaceDef(locationId: string): PlaceDef | undefined {
	return PLACE_LEDGER.find((place) => place.locationId === locationId);
}

export function getPlaceVariant(
	place: PlaceDef,
	phase: DistrictStoryPhase
): PlacePhaseVariant {
	return (
		place.variants.find((variant) => variant.phase === phase) ??
		place.variants.find((variant) => variant.phase === 'contested') ??
		place.variants[0]
	) as PlacePhaseVariant;
}

export function validatePlaceLedger(): string[] {
	const errors: string[] = [];
	const ids = new Set<string>();
	for (const place of PLACE_LEDGER) {
		if (ids.has(place.locationId)) errors.push(`duplicate place: ${place.locationId}`);
		ids.add(place.locationId);
		const serviceIds = new Set(place.services.map((service) => service.id));
		for (const variant of place.variants) {
			for (const serviceId of variant.serviceIds) {
				if (!serviceIds.has(serviceId)) {
					errors.push(`${place.locationId}: missing service definition ${serviceId}`);
				}
			}
		}
	}
	return errors;
}


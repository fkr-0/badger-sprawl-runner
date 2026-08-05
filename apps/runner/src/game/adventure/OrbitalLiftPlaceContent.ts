import type { PlaceDef, PlaceServiceDef } from './PlaceLedger';

const SERVICES: PlaceServiceDef[] = [
	{
		id: 'clinic',
		label: 'Downbound Galley Clinic',
		description: 'Recover among passengers whose needs are no longer sorted by cargo priority.',
		minimumLevel: 0,
		providerNpcId: 'matron-counterweight',
	},
	{
		id: 'repair-bench',
		label: 'Counterweight Union Bench',
		description: 'Repair gear and lift mechanisms against published load, labor, and delay limits.',
		minimumLevel: 0,
		providerNpcId: 'matron-counterweight',
	},
	{
		id: 'rumor-board',
		label: 'Galley Shift and Passenger Board',
		description: 'Discover misclassified passengers, refusal windows, and dangerous counterweight work.',
		minimumLevel: 0,
		providerNpcId: 'matron-counterweight',
	},
	{
		id: 'loadout-locker',
		label: 'Porter Refusal Locker',
		description: 'Change equipment beside the posted load and refusal schedule.',
		minimumLevel: 0,
		providerNpcId: 'brother-ballast',
	},
	{
		id: 'archive',
		label: 'Passenger Claim Archive',
		description: 'Compare cargo claims, passenger names, command history, and witness consent.',
		minimumLevel: 0,
		providerNpcId: 'esme-manifest',
	},
	{
		id: 'legal-aid',
		label: 'Classification Appeal Desk',
		description: 'Challenge freight status before it becomes route authority.',
		minimumLevel: 0,
		providerNpcId: 'esme-manifest',
	},
	{
		id: 'field-shop',
		label: 'Ballast Passenger Supply Cooperative',
		description: 'Trade seized cargo stock through a visible passenger-first inventory.',
		minimumLevel: 0,
		providerNpcId: 'brother-ballast',
	},
	{
		id: 'transit-control',
		label: 'Skylock Descent Console',
		description: 'Inspect descent capacity, passenger priority, counterweight pressure, and interruption authority.',
		minimumLevel: 0,
		providerNpcId: 'elevator-angel',
	},
	{
		id: 'signal-lab',
		label: 'Public Command-History Port',
		description: 'Review who issued an order, who it affects, and which refusal grounds remain available.',
		minimumLevel: 1,
		providerNpcId: 'elevator-angel',
	},
];

export const ORBITAL_LIFT_PLACES: readonly PlaceDef[] = [
	{
		locationId: 'orbital-lift:safehouse',
		name: 'Cargo Union Galley',
		districtId: 'orbital-lift',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'counterweight-supper-club',
		visualMotif:
			'A pressure galley inside a counterweight chamber: soup steam, union brass, bunk lists, passenger names, and lift cables humming through the walls.',
		interactionHint: 'Eat, recover, inspect descent pressure, and hear who the Lift has been feeding after freight.',
		services: SERVICES.filter((service) =>
			['clinic', 'repair-bench', 'rumor-board', 'loadout-locker'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The galley feeds people from containers while official manifests insist the containers are unoccupied. Counterweight keys hang beside soup ladles.',
				ambientLines: [
					'Matron serves the passenger list before the menu.',
					'A bunk board labels one row FREIGHT THAT SNORES.',
					'Brother Ballast weighs a crate, then asks whether it has a preferred name.',
				],
				npcIds: ['matron-counterweight', 'brother-ballast', 'lio-vale'],
				serviceIds: ['clinic', 'repair-bench', 'rumor-board', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Downbound Passenger Assembly',
				atmosphere:
					'Descent capacity is debated over dinner. Bunk, medicine, witness protection, seeds, and tools appear on one public passenger manifest.',
				ambientLines: [
					'Every emergency galley role expires after the meal and leaves a handover note.',
					'Lio’s customs knowledge is posted beside the workers authorized to correct him.',
					'Nobody is permitted to call soup logistics apolitical.',
				],
				npcIds: ['matron-counterweight', 'brother-ballast', 'lio-vale', 'ames-oxygen'],
				serviceIds: ['clinic', 'repair-bench', 'rumor-board', 'loadout-locker'],
			},
		],
	},
	{
		locationId: 'orbital-lift:settlement',
		name: 'Freight Worker Concourse',
		districtId: 'orbital-lift',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'manifest-noir',
		visualMotif:
			'Customs desks turned inside out, witness containers, porter harnesses, passenger tickets, claim stamps, and a vertical window showing the city far below.',
		interactionHint: 'Reverse classifications, protect witnesses, publish load conditions, and decide whether names liberate or merely refile people.',
		services: SERVICES.filter((service) =>
			['archive', 'legal-aid', 'field-shop', 'loadout-locker', 'clinic'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Customs screens treat names as annotation beneath ownership claims. Esme copies living testimony before the next automated freight sweep.',
				ambientLines: [
					'A witness container has six voices and one barcode.',
					'Brother Ballast’s price board lists seized stock and who originally lost it.',
					'Portia times the hidden transfer between cargo lanes.',
				],
				npcIds: ['esme-manifest', 'brother-ballast', 'portia-drift', 'lio-vale'],
				serviceIds: ['archive', 'legal-aid', 'field-shop', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Passenger and Porter Concourse',
				atmosphere:
					'Claims cannot outrank breathing. Passenger names, protected aliases, load limits, refusal windows, and correction paths occupy the former customs wall.',
				ambientLines: [
					'Esme’s manifest records why a name is needed and when it must be forgotten.',
					'Ballast refuses one load publicly and three apprentices learn the Lift continues moving.',
					'Portia’s staff local arrives as a peer connection, not resort overflow.',
				],
				npcIds: ['esme-manifest', 'brother-ballast', 'portia-drift', 'lio-vale', 'ames-oxygen'],
				serviceIds: ['archive', 'legal-aid', 'field-shop', 'loadout-locker', 'clinic'],
			},
		],
	},
	{
		locationId: 'orbital-lift:station',
		name: 'Skylock Elevator',
		districtId: 'orbital-lift',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'obedience-with-brakes',
		visualMotif:
			'A vertical rail cathedral of counterweights, cable wings, command-history glass, passenger platforms, and a descent car large enough to mistake itself for law.',
		interactionHint: 'Read orders before execution, contest descent priority, and decide what refusal means for a machine built to obey.',
		services: SERVICES.filter((service) =>
			['transit-control', 'signal-lab', 'archive', 'repair-bench'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The Elevator Angel announces every order politely while hidden mercy exceptions keep certain passenger containers alive.',
				ambientLines: [
					'A command display names the destination but not the person who chose it.',
					'Quasar compares counterweight rhythm to three incompatible station clocks.',
					'Portia marks a descent window the guest timetable cannot see.',
				],
				npcIds: [
					'elevator-angel',
					'portia-drift',
					'old-quasar-jones',
					'esme-manifest',
					'rita-latch',
				],
				serviceIds: ['transit-control', 'archive', 'repair-bench'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Interruptible Homecoming Lift',
				atmosphere:
					'Orders show authors, affected passengers, refusal grounds, delay costs, and challenge windows. Cargo has declared itself passengers.',
				ambientLines: [
					'The Angel asks confirmation from people affected by the order, not only its issuer.',
					'The downbound board lists seeds, tools, testimony, and unresolved political arguments as passenger categories.',
					'Quasar trains replacement crews on the manual controls he once kept private.',
				],
				npcIds: [
					'elevator-angel',
					'portia-drift',
					'old-quasar-jones',
					'esme-manifest',
					'matron-counterweight',
					'rita-latch',
				],
				serviceIds: ['transit-control', 'signal-lab', 'archive', 'repair-bench'],
			},
		],
	},
];

import type { PlaceDef, PlaceServiceDef } from './PlaceLedger';

const SERVICES: PlaceServiceDef[] = [
	{
		id: 'signal-lab',
		label: 'Null Dial Public Frequency Desk',
		description: 'Inspect model assumptions, signal provenance, consent, expiry, and broadcast risk.',
		minimumLevel: 0,
		providerNpcId: 'reverend-null-dial',
	},
	{
		id: 'skill-mentor',
		label: 'Mara’s Threat-Model Clinic',
		description: 'Train signal intrusion and defensive publication without confusing secrecy with ownership.',
		minimumLevel: 0,
		providerNpcId: 'mara-modulo',
	},
	{
		id: 'repair-bench',
		label: 'Raincheck Mast Bench',
		description: 'Repair field gear and public masts against a visible parts, weather, and risk ledger.',
		minimumLevel: 0,
		providerNpcId: 'calder-raincheck',
	},
	{
		id: 'loadout-locker',
		label: 'Faraday Crew Locker',
		description: 'Change equipment inside a grounded pirate-radio shelter.',
		minimumLevel: 0,
	},
	{
		id: 'archive',
		label: 'Error-Bar Appeals Archive',
		description: 'Review suppressed messages, forecast misses, protected identities, and correction requests.',
		minimumLevel: 0,
		providerNpcId: 'doctor-error-bar',
	},
	{
		id: 'clinic',
		label: 'Forecast Harm Clinic',
		description: 'Treat people harmed by confident predictions and record injury without converting patients into training data.',
		minimumLevel: 0,
		providerNpcId: 'doctor-error-bar',
	},
	{
		id: 'legal-aid',
		label: 'Right-to-Object Table',
		description: 'Challenge route forecasts and automated priority before their recommendations become orders.',
		minimumLevel: 0,
		providerNpcId: 'doctor-error-bar',
	},
	{
		id: 'rumor-board',
		label: 'Suppressed Listener Board',
		description: 'Discover missing broadcasts, mast shifts, and people omitted from the model.',
		minimumLevel: 0,
		providerNpcId: 'penny-static',
	},
	{
		id: 'transit-control',
		label: 'Dead-Air Arrival Desk',
		description: 'Compare predicted routes with observed arrivals and publish why the timetable changed.',
		minimumLevel: 0,
		providerNpcId: 'calder-raincheck',
	},
];

export const ANTENNA_BARRENS_PLACES: readonly PlaceDef[] = [
	{
		locationId: 'antenna-barrens:safehouse',
		name: 'Pirate Mast Shelter',
		districtId: 'antenna-barrens',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'null-dial-after-midnight',
		visualMotif:
			'A grounded radio chapel beneath a leaning weather mast: copper prayer strips, patched dishes, storm batteries, tea, and listener messages waiting for consent.',
		interactionHint: 'Inspect the forecast’s sources, prepare equipment, and decide what public knowledge must still protect.',
		services: SERVICES.filter((service) =>
			['signal-lab', 'skill-mentor', 'repair-bench', 'loadout-locker'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Pirate transmitters whisper under storm shutters. Null Dial wants reach, Mara wants threat models, and every antenna assumes somebody is listening twice.',
				ambientLines: [
					'A listener message ends with: DO NOT SAY MY STREET ON AIR.',
					'Mara labels one cabinet PUBLIC and another PUBLIC WOULD GET SOMEBODY KILLED.',
					'Lightning turns the tea kettle into a brief percussion instrument.',
				],
				npcIds: ['reverend-null-dial', 'mara-modulo', 'calder-raincheck'],
				serviceIds: ['signal-lab', 'skill-mentor', 'repair-bench', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Public Threat-Model Shelter',
				atmosphere:
					'Every transmission carries source, consent, expiry, uncertainty, and a protected appendix explaining what the public version refuses to expose.',
				ambientLines: [
					'Null Dial announces the appeal path before the weather.',
					'Mara’s threat model includes the people permitted to destroy it.',
					'Calder’s illegal mast shortcut is now a documented emergency procedure with an expiration date.',
				],
				npcIds: ['reverend-null-dial', 'mara-modulo', 'calder-raincheck', 'penny-static'],
				serviceIds: ['signal-lab', 'skill-mentor', 'repair-bench', 'loadout-locker'],
			},
		],
	},
	{
		locationId: 'antenna-barrens:settlement',
		name: 'Signal Scavenger Camp',
		districtId: 'antenna-barrens',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'error-bars-and-rain',
		visualMotif:
			'Weather tarps between obsolete dishes, a clinic under a probability board, cassette libraries, solder smoke, and public arguments about dangerous truth.',
		interactionHint: 'Meet the people outside the model, review forecast harms, and build an appeal process faster than automated punishment.',
		services: SERVICES.filter((service) =>
			['archive', 'clinic', 'legal-aid', 'rumor-board', 'signal-lab'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The camp compares predictions with injuries while the Black-Ice Fox continues treating statistical confidence as a warrant.',
				ambientLines: [
					'Doctor Error Bar writes eight missing names inside the margin of a ninety-two-percent success report.',
					'Penny refuses to archive a cassette until its speaker chooses an audience.',
					'A scavenger sells lightning rods with a warranty valid during clear weather.',
				],
				npcIds: ['doctor-error-bar', 'penny-static', 'mara-modulo', 'maceo-margin'],
				serviceIds: ['archive', 'clinic', 'legal-aid', 'rumor-board'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Public Forecast and Appeals Camp',
				atmosphere:
					'Arrival forecasts display assumptions, confidence, historical misses, protected exceptions, and objections before route priority changes.',
				ambientLines: [
					'A forecast correction names the institution responsible, not the passenger who proved it wrong.',
					'The clinic’s harm log cannot be joined to identity without two independent witnesses.',
					'Children annotate the model with a category titled THINGS ADULTS CALLED IMPOSSIBLE LAST WEEK.',
				],
				npcIds: [
					'doctor-error-bar',
					'penny-static',
					'mara-modulo',
					'black-ice-fox',
					'maceo-margin',
				],
				serviceIds: ['archive', 'clinic', 'legal-aid', 'rumor-board', 'signal-lab'],
			},
		],
	},
	{
		locationId: 'antenna-barrens:station',
		name: 'Dead-Air Terminal',
		districtId: 'antenna-barrens',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'arrival-with-error-bars',
		visualMotif:
			'A roofless station beneath dish constellations, arrival boards showing impossible city signals, grounded maintenance rails, and static drifting like snow.',
		interactionHint: 'Compare prediction with arrival, recover suppressed messages, and make the timetable explain itself.',
		services: SERVICES.filter((service) =>
			['transit-control', 'signal-lab', 'archive', 'repair-bench'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Predicted trains arrive before their passengers decide to travel. Calder grounds the rails while Penny catches messages the model discarded as noise.',
				ambientLines: [
					'One arrival board confidently announces a train that was dismantled twelve years ago.',
					'A signal cache contains a neighborhood warning sent before the police forecast was generated.',
					'Calder asks the storm to submit a maintenance ticket.',
				],
				npcIds: ['penny-static', 'calder-raincheck', 'reverend-null-dial'],
				serviceIds: ['transit-control', 'archive', 'repair-bench'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Contestable Arrival Terminal',
				atmosphere:
					'Every prediction sits beside its method, uncertainty, correction history, and a button that delays automation while a human appeal is heard.',
				ambientLines: [
					'The Black-Ice Fox publishes: I EXPECTED YOU. I DID NOT AUTHOR YOU.',
					'Penny’s listener archive has three independent couriers and no permanent master copy.',
					'The arrival board apologizes specifically and names the repair crew.',
				],
				npcIds: [
					'penny-static',
					'calder-raincheck',
					'reverend-null-dial',
					'black-ice-fox',
					'maceo-margin',
				],
				serviceIds: ['transit-control', 'signal-lab', 'archive', 'repair-bench'],
			},
		],
	},
];

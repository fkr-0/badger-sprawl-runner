import type { PlaceDef, PlaceServiceDef } from './PlaceLedger';

const SERVICES: PlaceServiceDef[] = [
	{
		id: 'signal-lab',
		label: 'Choir Public Transmitter Desk',
		description: 'Author evidence, tools, and abolition without granting one voice permanent control.',
		minimumLevel: 0,
		providerNpcId: 'choir-of-static',
	},
	{
		id: 'archive',
		label: 'Founding Evidence and Revision Archive',
		description: 'Inspect Skylock evidence, testimony, doctrine drafts, and revision history.',
		minimumLevel: 0,
		providerNpcId: 'witness-zero',
	},
	{
		id: 'repair-bench',
		label: 'Aster Transmitter-Root Bench',
		description: 'Repair equipment and publish maintenance knowledge as a teachable score.',
		minimumLevel: 0,
		providerNpcId: 'aunt-aster',
	},
	{
		id: 'skill-mentor',
		label: 'Aster’s Reproducible Improvisation',
		description: 'Train final-build techniques while converting intuition into revisable public practice.',
		minimumLevel: 0,
		providerNpcId: 'aunt-aster',
	},
	{
		id: 'loadout-locker',
		label: 'Last-Route Crew Locker',
		description: 'Change equipment before the final transmitter approach.',
		minimumLevel: 0,
	},
	{
		id: 'legal-aid',
		label: 'Responsibility Without Saints Table',
		description: 'Frame testimony so complicity remains visible without turning one confession into the whole system.',
		minimumLevel: 0,
		providerNpcId: 'witness-zero',
	},
	{
		id: 'rumor-board',
		label: 'No-Hero Toolkit Board',
		description: 'Discover missing public toolkits, protected maps, and transmitter maintenance shifts.',
		minimumLevel: 0,
		providerNpcId: 'little-ix',
	},
	{
		id: 'greenhouse',
		label: 'Vacuum Seed Commons',
		description: 'Keep city and colony cuttings alive without treating the Redoubt as a new frontier headquarters.',
		minimumLevel: 0,
		providerNpcId: 'little-ix',
	},
	{
		id: 'transit-control',
		label: 'Return Signal Dock',
		description: 'Maintain peer route windows among city, colony, and asteroid without promising unrestricted access.',
		minimumLevel: 0,
		providerNpcId: 'return-signal-sam',
	},
];

export const ASTEROID_REDOUBT_PLACES: readonly PlaceDef[] = [
	{
		locationId: 'asteroid-redoubt:safehouse',
		name: 'Free Transmitter Workshop',
		districtId: 'asteroid-redoubt',
		safety: 'sanctuary',
		violencePolicy: 'disabled',
		musicCue: 'many-voices-one-root',
		visualMotif:
			'A workshop carved into black ice: transmitter roots, patched microphones, asteroid frost, maintenance scores, and masks waiting for whoever holds the next temporary solo.',
		interactionHint: 'Prepare the final build, inspect the microphone’s ownership, and turn private craft into reproducible public tools.',
		services: SERVICES.filter((service) =>
			['signal-lab', 'repair-bench', 'skill-mentor', 'loadout-locker'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The Choir rehearses a message no one may own. Aunt Aster keeps the transmitter alive through intuition she has not yet managed to teach.',
				ambientLines: [
					'Four voices enter the same sentence and leave room for a correction.',
					'A maintenance score includes the notation ARGUE HERE.',
					'The final microphone has no nameplate and too many fingerprints.',
				],
				npcIds: ['choir-of-static', 'aunt-aster', 'rook-null'],
				serviceIds: ['signal-lab', 'repair-bench', 'skill-mentor', 'loadout-locker'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Reproducible Commons Workshop',
				atmosphere:
					'Transmitter plans, maintenance scores, threat models, and failure histories are mirrored across city, colony, and asteroid workshops.',
				ambientLines: [
					'Aster watches an apprentice improve her notation and complains with visible pride.',
					'The Choir’s solo timer can be interrupted by any two receiving stations.',
					'Rook files a proof with a blank where protected routes must remain.',
				],
				npcIds: ['choir-of-static', 'aunt-aster', 'rook-null', 'return-signal-sam'],
				serviceIds: ['signal-lab', 'repair-bench', 'skill-mentor', 'loadout-locker'],
			},
		],
	},
	{
		locationId: 'asteroid-redoubt:settlement',
		name: 'Redoubt Commons',
		districtId: 'asteroid-redoubt',
		safety: 'contested-civilian',
		violencePolicy: 'draw-disabled',
		musicCue: 'last-lock-cipher',
		visualMotif:
			'A circular assembly around the transmitter root: toolkit cases, protected maps, witness glass, seed trays, doctrine drafts, and one empty executive chair nobody agrees to remove yet.',
		interactionHint: 'Choose what the final broadcast teaches, what evidence it carries, and which places must remain deliberately absent.',
		services: SERVICES.filter((service) =>
			['archive', 'legal-aid', 'rumor-board', 'greenhouse', 'signal-lab'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'Vane offers competent ownership from an unoccupied chair while Witness Zero and Little Ix argue over what a public map must refuse to reveal.',
				ambientLines: [
					'A toolkit case contains a wrench, a legal template, a threat model, and no portrait of Moss.',
					'Little Ix draws a blank station with visible rules for who may reveal it.',
					'Vane’s chair projects quarterly regret.',
				],
				npcIds: [
					'witness-zero',
					'little-ix',
					'director-vane',
					'choir-of-static',
					'della-redact',
				],
				serviceIds: ['archive', 'legal-aid', 'rumor-board', 'greenhouse'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Commons of Evidence, Tools, and Protected Blanks',
				atmosphere:
					'No final doctrine stands without revision history, local copies, refusal paths, and explicit blanks protecting routes that cannot survive universal visibility.',
				ambientLines: [
					'The executive chair has become a table leg after a long procedural argument.',
					'Witness Zero’s testimony links to dismantling instructions instead of a commemorative profile.',
					'Little Ix labels the blank station PRESENT, PROTECTED, NOT YOURS TO REVEAL.',
				],
				npcIds: ['witness-zero', 'little-ix', 'choir-of-static', 'aunt-aster', 'della-redact'],
				serviceIds: ['archive', 'legal-aid', 'rumor-board', 'greenhouse', 'signal-lab'],
			},
		],
	},
	{
		locationId: 'asteroid-redoubt:station',
		name: 'Return Signal Dock',
		districtId: 'asteroid-redoubt',
		safety: 'civilian',
		violencePolicy: 'defensive-only',
		musicCue: 'three-green-lights',
		visualMotif:
			'A narrow dock facing city blue, colony violet, and asteroid white signal lamps, with return windows, protected-route shutters, seed containers, and toolkit mirrors.',
		interactionHint: 'Maintain connection without promising access, verify mirrored tools, and keep the last route capable of answering back.',
		services: SERVICES.filter((service) =>
			['transit-control', 'signal-lab', 'archive', 'repair-bench'].includes(service.id)
		),
		variants: [
			{
				phase: 'contested',
				atmosphere:
					'The city signal arrives late, the colony signal arrives with revisions, and the Redoubt has one launch window before Skylock closes the route.',
				ambientLines: [
					'Sam refuses to call uncertain return a guarantee.',
					'A toolkit mirror waits for checksum confirmation from Blue Mercy.',
					'One protected-route shutter remains closed and publicly justified.',
				],
				npcIds: ['return-signal-sam', 'little-ix', 'aunt-aster'],
				serviceIds: ['transit-control', 'signal-lab', 'archive', 'repair-bench'],
			},
			{
				phase: 'transformed',
				titleSuffix: 'Peer Return and Revision Dock',
				atmosphere:
					'City, colony, and asteroid advertise availability, uncertainty, maintenance limits, and refusal. No node can silently become the center.',
				ambientLines: [
					'Three green lights disagree about departure time and publish the disagreement.',
					'Sam’s return promise now reads: WE WILL ANSWER, NOT ALWAYS OPEN.',
					'Toolkit checksums arrive from platforms Vane’s map never recognized.',
				],
				npcIds: [
					'return-signal-sam',
					'little-ix',
					'aunt-aster',
					'choir-of-static',
					'della-redact',
				],
				serviceIds: ['transit-control', 'signal-lab', 'archive', 'repair-bench'],
			},
		],
	},
];

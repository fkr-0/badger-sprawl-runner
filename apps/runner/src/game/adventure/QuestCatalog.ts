import type { ResolutionApproach } from '../ResolutionApproach';
import { ANTENNA_BARRENS_QUESTS } from './AntennaBarrensQuestContent';
import { ASTEROID_REDOUBT_QUESTS } from './AsteroidRedoubtQuestContent';
import { ORBITAL_LIFT_QUESTS } from './OrbitalLiftQuestContent';
import { ALGORITHMIC_CIVIC_QUESTS } from './AlgorithmicCivicContent';

export type QuestKind = 'main' | 'side' | 'contract' | 'companion';
export type QuestApproach = ResolutionApproach;

export interface QuestObjectiveDef {
	id: string;
	label: string;
	target: number;
	locationId?: string;
	resolutionTags: string[];
}

export interface QuestStepDef {
	id: string;
	placard: string;
	summary: string;
	objectives: QuestObjectiveDef[];
	nextStepId?: string;
	worldFlagsOnComplete?: string[];
}

export interface QuestConsequenceDef {
	id: string;
	label: string;
	worldFlags: string[];
	serviceUpgrades?: Array<{ locationId: string; serviceId: string; level: number }>;
	npcRelocations?: Array<{ npcId: string; locationId: string }>;
}

export interface QuestDef {
	id: string;
	title: string;
	districtId: string;
	kind: QuestKind;
	giverNpcId?: string;
	description: string;
	theme: string;
	entryStepId: string;
	steps: QuestStepDef[];
	approaches: Partial<Record<QuestApproach, string>>;
	consequences: QuestConsequenceDef[];
	repeatPolicy: 'once' | 'after-travel' | 'after-district-phase';
}

export const QUEST_CATALOG: QuestDef[] = [
	{
		id: 'main:the-city-moves',
		title: 'The City Moves Even When It Is Told to Stay Put',
		districtId: 'lower-sprawl',
		kind: 'main',
		description:
			'Moss follows the buried civic transit network from metered streets to orbit and back, learning that every route is also a decision about whose life may continue.',
		theme:
			'Freedom is not escape from infrastructure; it is shared authorship of the conditions that let people meet, leave, return, and refuse.',
		entryStepId: 'wake-the-low-line',
		steps: [
			{
				id: 'wake-the-low-line',
				placard: 'THE POOR PAY RENT TO DISTANCE.',
				summary: 'Break Captain Grin’s monopoly and wake the buried Blue Mercy Line.',
				objectives: [
					{
						id: 'lower-sprawl-resolved',
						label: 'Return the toll gates to public use',
						target: 1,
						locationId: 'lower-sprawl:stronghold',
						resolutionTags: ['combat', 'hack', 'evidence'],
					},
				],
				nextStepId: 'open-the-floodline',
				worldFlagsOnComplete: ['main:blue-mercy-awake'],
			},
			{
				id: 'open-the-floodline',
				placard: 'A MARKET IS A WEATHER SYSTEM WITH RECEIPTS.',
				summary: 'Keep Drainmarket’s clinic alive and convert the flooded line into a supply artery.',
				objectives: [
					{
						id: 'drainmarket-resolved',
						label: 'End the knife-drone collection regime',
						target: 1,
						locationId: 'drainmarket:stronghold',
						resolutionTags: ['combat', 'stealth', 'mutual-aid'],
					},
				],
				nextStepId: 'steal-the-elevator-seed',
				worldFlagsOnComplete: ['main:floodline-open'],
			},
			{
				id: 'steal-the-elevator-seed',
				placard: 'THE ELEVATOR RISES BECAUSE SOMEONE BELOW IS PRESSED DOWN.',
				summary: 'Expose the Arcology’s missing labor floors and steal the routing seed.',
				objectives: [
					{
						id: 'elevator-seed-secured',
						label: 'Secure the Elevator Seed',
						target: 1,
						locationId: 'chrome-arcology:stronghold',
						resolutionTags: ['heist', 'hack', 'worker-alliance'],
					},
				],
				nextStepId: 'ride-the-sky-mirror',
				worldFlagsOnComplete: ['main:elevator-seed-secured'],
			},
			{
				id: 'ride-the-sky-mirror',
				placard: 'LUXURY IS A WINDOW THAT CHARGES THE DARK FOR REFLECTION.',
				summary:
					'Use the seed to board the orbital express, survive the Mirror Palace, and decide what repair Lio owes.',
				objectives: [
					{
						id: 'mirror-contract-broken',
						label: 'Break the Reflection Judge’s authorship contract',
						target: 1,
						locationId: 'mirror-palace:stronghold',
						resolutionTags: ['duel', 'dialogue', 'betrayal'],
					},
				],
				nextStepId: 'learn-the-colony-chorus',
				worldFlagsOnComplete: ['main:sky-mirror-broken'],
			},
			{
				id: 'learn-the-colony-chorus',
				placard: 'A REFUGE CAN BECOME A FORTRESS; A FORTRESS CAN BECOME A PRISON.',
				summary:
					'Help Dub Colony survive without allowing emergency coordination to become permanent command.',
				objectives: [
					{
						id: 'colony-charter-decided',
						label: 'Resolve King Feedback’s emergency crown',
						target: 1,
						locationId: 'dub-colony:stronghold',
						resolutionTags: ['rhythm', 'council', 'defense'],
					},
				],
				nextStepId: 'publish-the-weather',
				worldFlagsOnComplete: ['main:colony-charter-written'],
			},
			{
				id: 'publish-the-weather',
				placard: 'A LOCK WRITTEN IN NUMBERS STILL HAS A LANDLORD.',
				summary:
					'Reconstruct the transit-prediction system in the Antenna Barrens and make its assumptions contestable.',
				objectives: [
					{
						id: 'black-ice-fox-resolved',
						label: 'Defeat or liberate the Black-Ice Fox',
						target: 1,
						locationId: 'antenna-barrens:stronghold',
						resolutionTags: ['combat-code', 'public-manual', 'forecast'],
					},
				],
				nextStepId: 'take-the-long-way-home',
				worldFlagsOnComplete: ['main:forecast-public'],
			},
			{
				id: 'take-the-long-way-home',
				placard: 'THE MACHINE FOLLOWS ORDERS. THE ORDERS HIDE INSIDE THE MACHINE.',
				summary:
					'Descend the Orbital Lift, free the cargo prisoners, and return to a city altered by every choice made in orbit.',
				objectives: [
					{
						id: 'elevator-angel-resolved',
						label: 'Reverse the cargo flow and reach the city',
						target: 1,
						locationId: 'orbital-lift:stronghold',
						resolutionTags: ['machine-testimony', 'cargo-release', 'descent'],
					},
				],
				nextStepId: 'write-the-last-route',
				worldFlagsOnComplete: ['main:homecoming'],
			},
			{
				id: 'write-the-last-route',
				placard: 'THE LAST LOCK IS ON THE STORY OF WHO MAY OPEN DOORS.',
				summary:
					'Launch from the transformed subway coalition, seize the Asteroid Redoubt, and decide what the final broadcast enables.',
				objectives: [
					{
						id: 'director-vane-resolved',
						label: 'End Skylock’s ownership of movement',
						target: 1,
						locationId: 'asteroid-redoubt:stronghold',
						resolutionTags: ['combat', 'hack', 'broadcast', 'authorship'],
					},
				],
				worldFlagsOnComplete: ['main:commons-line'],
			},
		],
		approaches: {
			claw: 'Break physical monopolies and protect people during transitions.',
			ballistics: 'Control lanes, expose relays, and cover collective movement.',
			ghoststep: 'Move evidence, people, and keys through routes the Ledger cannot price.',
			hacking: 'Rewrite access, prediction, and command infrastructure.',
			social: 'Build agreements that keep liberated machinery from acquiring a new owner.',
		},
		consequences: [
			{
				id: 'commons-line',
				label: 'The subway becomes a negotiated public commons.',
				worldFlags: ['ending:commons-line'],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'lower-sprawl:main-song-of-the-toll',
		title: 'The Song of the Toll',
		districtId: 'lower-sprawl',
		kind: 'main',
		giverNpcId: 'auntie-subharmonic',
		description:
			'Wake the buried Toll Line without turning the district into a battlefield or replacing Captain Grin with a more fashionable gatekeeper.',
		theme: 'A route is free only when ordinary people can maintain, dispute, and change it.',
		entryStepId: 'listen-to-the-relay',
		steps: [
			{
				id: 'listen-to-the-relay',
				placard: 'THE DEAD LINE HUMS BELOW THE RENTED STREET.',
				summary: 'Hear Auntie’s buried signal and inspect the neighborhood before provoking the toll office.',
				objectives: [
					{
						id: 'meet-neighborhood',
						label: 'Speak with three people who depend on the line',
						target: 3,
						locationId: 'lower-sprawl:settlement',
						resolutionTags: ['social', 'investigation'],
					},
				],
				nextStepId: 'count-the-crossings',
			},
			{
				id: 'count-the-crossings',
				placard: 'EVERY TURNSTILE IS A LITTLE THEORY OF WHO DESERVES TO ARRIVE.',
				summary: 'Map meters, cameras, patrol cells, and civilian crossings on Neon Awning Mile.',
				objectives: [
					{
						id: 'scan-meters',
						label: 'Scan toll meters',
						target: 3,
						locationId: 'lower-sprawl:route',
						resolutionTags: ['hack', 'ghoststep', 'ballistics'],
					},
				],
				nextStepId: 'secure-the-wafer-key',
			},
			{
				id: 'secure-the-wafer-key',
				placard: 'A KEY IS A SMALL CONTRACT WITH A SHARP EDGE.',
				summary: 'Recover the wafer-key and choose whether to copy, broadcast, or conceal its route table.',
				objectives: [
					{
						id: 'wafer-key',
						label: 'Secure the wafer-key',
						target: 1,
						locationId: 'lower-sprawl:route',
						resolutionTags: ['combat', 'hack', 'stealth'],
					},
				],
				nextStepId: 'wake-the-station',
			},
			{
				id: 'wake-the-station',
				placard: 'THE PLATFORM HAS BEEN WAITING LONGER THAN THE PASSENGERS.',
				summary: 'Repair three signal relays and let the neighborhood decide the first public route.',
				objectives: [
					{
						id: 'signal-relays',
						label: 'Repair or reroute signal relays',
						target: 3,
						locationId: 'lower-sprawl:station',
						resolutionTags: ['hack', 'repair', 'social'],
					},
				],
				nextStepId: 'old-toll-office',
			},
			{
				id: 'old-toll-office',
				placard: 'CAPTAIN GRIN COLLECTS A FARE FROM EVERY POSSIBLE FUTURE.',
				summary: 'Enter the stronghold, defeat the toll engine, and preserve the routing machinery.',
				objectives: [
					{
						id: 'captain-grin',
						label: 'Resolve Captain Grin and the toll meter',
						target: 1,
						locationId: 'lower-sprawl:stronghold',
						resolutionTags: ['claw', 'ballistics', 'ghoststep', 'hacking'],
					},
				],
				nextStepId: 'return-the-gates',
			},
			{
				id: 'return-the-gates',
				placard: 'VICTORY IS A MAINTENANCE SCHEDULE WITH WITNESSES.',
				summary: 'Return to the station and establish shared stewardship before the first train departs.',
				objectives: [
					{
						id: 'public-stewardship',
						label: 'Speak with Auntie, Esther, Oona, and Zed',
						target: 4,
						locationId: 'lower-sprawl:station',
						resolutionTags: ['social', 'governance'],
					},
				],
				worldFlagsOnComplete: ['lower-sprawl:blue-mercy-public'],
			},
		],
		approaches: {
			claw: 'Break the toll crew’s formation while protecting relay operators.',
			ballistics: 'Pierce meters and suppress gantries without destroying civilian infrastructure.',
			ghoststep: 'Copy the wafer-key, move through cable routes, and open the station unseen.',
			hacking: 'Spoof fare authority, separate patrol cells, and turn the toll engine against its contract.',
			social: 'Recruit witnesses and define post-victory stewardship before assaulting the office.',
		},
		consequences: [
			{
				id: 'public-line',
				label: 'The Blue Mercy becomes a public night line.',
				worldFlags: ['lower-sprawl:blue-mercy-public'],
				serviceUpgrades: [
					{ locationId: 'lower-sprawl:safehouse', serviceId: 'repair-bench', level: 1 },
					{ locationId: 'lower-sprawl:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'sister-version', locationId: 'lower-sprawl:station' },
					{ npcId: 'murr-murrby', locationId: 'lower-sprawl:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'lower-sprawl:side-last-fare-home',
		title: 'The Last Fare Home',
		districtId: 'lower-sprawl',
		kind: 'side',
		giverNpcId: 'conductor-oona-bell',
		description:
			'Find three deleted stops and the people whose night journeys were erased from the official timetable.',
		theme: 'A map can kill by omission, but restoration without consent can expose those who survived by disappearing.',
		entryStepId: 'find-the-three-missing-stops',
		steps: [
			{
				id: 'find-the-three-missing-stops',
				placard: 'THE MAP DID NOT LOSE THEM. THE MAP WAS PAID TO FORGET.',
				summary: 'Recover three ghost timetable fragments from the maintenance tunnels.',
				objectives: [
					{
						id: 'ghost-stops',
						label: 'Recover deleted stop records',
						target: 3,
						locationId: 'lower-sprawl:route',
						resolutionTags: ['exploration', 'hack', 'stealth'],
					},
				],
				nextStepId: 'ask-before-restoring',
			},
			{
				id: 'ask-before-restoring',
				placard: 'TO BE FOUND IS NOT ALWAYS TO BE SAFE.',
				summary: 'Ask survivors which stops may return to the public map.',
				objectives: [
					{
						id: 'survivor-consent',
						label: 'Record survivor route choices',
						target: 3,
						locationId: 'lower-sprawl:settlement',
						resolutionTags: ['social', 'privacy'],
					},
				],
				worldFlagsOnComplete: ['lower-sprawl:mercy-stops-restored'],
			},
		],
		approaches: {
			ghoststep: 'Reach sealed maintenance rooms without waking debt patrols.',
			hacking: 'Reconstruct timetable fragments from relay residue.',
			social: 'Let each survivor choose visibility, anonymity, or a coded stop name.',
		},
		consequences: [
			{
				id: 'consensual-map',
				label: 'The restored night map includes protected and coded stops.',
				worldFlags: ['lower-sprawl:mercy-stops-restored'],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'lower-sprawl:side-no-receipt-for-grief',
		title: 'No Receipt for Grief',
		districtId: 'lower-sprawl',
		kind: 'side',
		giverNpcId: 'ossie-blue',
		description:
			'Prove that an illegal warrant printer is manufacturing eviction authority from transit debt.',
		theme: 'Evidence can expose power, but evidence gathered without care can turn victims into another dataset.',
		entryStepId: 'collect-eviction-warrants',
		steps: [
			{
				id: 'collect-eviction-warrants',
				placard: 'THE PRINTER HAS NO ADDRESS. ITS VICTIMS DO.',
				summary: 'Collect warrants and protect identifying details.',
				objectives: [
					{
						id: 'warrants',
						label: 'Collect illegal warrants',
						target: 6,
						locationId: 'lower-sprawl:route',
						resolutionTags: ['investigation', 'combat', 'hack'],
					},
				],
				nextStepId: 'choose-the-public-record',
			},
			{
				id: 'choose-the-public-record',
				placard: 'A SCANDAL IS NOT JUSTICE. IT IS ONLY ATTENTION WITH GOOD LIGHTING.',
				summary: 'Choose a redacted public case, a forged amnesty list, or a total data dump.',
				objectives: [
					{
						id: 'record-choice',
						label: 'Publish or weaponize the warrant evidence',
						target: 1,
						locationId: 'lower-sprawl:settlement',
						resolutionTags: ['social', 'hack', 'ethics'],
					},
				],
			},
		],
		approaches: {
			claw: 'Seize officer warrant satchels.',
			ballistics: 'Disable printer relays without destroying evidence.',
			ghoststep: 'Copy warrants from unattended collection kiosks.',
			hacking: 'Trace the printer’s nonexistent legal identity.',
			social: 'Obtain consent and choose how much evidence becomes public.',
		},
		consequences: [
			{
				id: 'redacted-case',
				label: 'Mercy and Ossie build a durable public case with protected identities.',
				worldFlags: ['lower-sprawl:warrants-redacted-public'],
			},
			{
				id: 'amnesty-forgery',
				label: 'The printer issues a night of valid-looking debt amnesties.',
				worldFlags: ['lower-sprawl:warrants-amnesty-forged'],
			},
			{
				id: 'total-dump',
				label: 'The full archive causes immediate outrage and lasting exposure risk.',
				worldFlags: ['lower-sprawl:warrants-total-dump'],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'lower-sprawl:contract-silent-platform',
		title: 'Silent Platform, Loud Problem',
		districtId: 'lower-sprawl',
		kind: 'contract',
		giverNpcId: 'big-esther-static',
		description:
			'Clear a local relay fault before it cascades into a district alarm. Resolve it by repair, diversion, stealth, or force.',
		theme: 'Maintenance work is political because neglect always chooses a neighborhood.',
		entryStepId: 'resolve-relay-fault',
		steps: [
			{
				id: 'resolve-relay-fault',
				placard: 'THE EMERGENCY WAS SCHEDULED. THE REPAIR WAS NOT.',
				summary: 'Stabilize one fault cell and keep the platform open.',
				objectives: [
					{
						id: 'relay-fault',
						label: 'Resolve the relay fault',
						target: 1,
						locationId: 'lower-sprawl:route',
						resolutionTags: ['repair', 'combat', 'stealth', 'hack'],
					},
				],
			},
		],
		approaches: {
			claw: 'Protect the repair crew from a local enforcement cell.',
			ballistics: 'Disable relay parasites at range.',
			ghoststep: 'Bypass the patrol and manually reset the fault.',
			hacking: 'Reroute the failure into an unused advertising circuit.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
	{
		id: 'drainmarket:main-knife-weather',
		title: 'Knife Weather Under the City',
		districtId: 'drainmarket',
		kind: 'main',
		giverNpcId: 'dr-calyx-reed',
		description:
			'Open the Floodline to medicine without deleting the mutual obligations that keep Drainmarket alive or exposing the patients the Ledger wants to price.',
		theme:
			'Liberation must distinguish care from coercion before it cuts the network carrying both.',
		entryStepId: 'keep-the-cold-chain',
		steps: [
			{
				id: 'keep-the-cold-chain',
				placard: 'A MEDICINE SPOILED IN TRANSIT IS A POLICY WITH A FEVER.',
				summary: 'Recover seized clinic crates and learn which deliveries cannot survive another heroic detour.',
				objectives: [
					{
						id: 'clinic-supply-crates',
						label: 'Recover cold-chain crates',
						target: 3,
						locationId: 'drainmarket:route',
						resolutionTags: ['combat', 'ghoststep', 'escort', 'repair'],
					},
				],
				nextStepId: 'sort-promises-from-invoices',
			},
			{
				id: 'sort-promises-from-invoices',
				placard: 'SOME DEBTS ARE MEMORY. SOME DEBTS ARE TEETH.',
				summary: 'Work with Jane to classify market obligations before rewriting ownership records.',
				objectives: [
					{
						id: 'market-obligations',
						label: 'Review disputed obligations',
						target: 4,
						locationId: 'drainmarket:settlement',
						resolutionTags: ['social', 'archive', 'legal'],
					},
				],
				nextStepId: 'triage-without-a-score',
			},
			{
				id: 'triage-without-a-score',
				placard: 'THE LEDGER CALLS PAIN A PREDICTOR.',
				summary: 'Complete Calyx’s injury triage without generating an addressable risk profile.',
				objectives: [
					{
						id: 'injury-ledger-triage',
						label: 'Resolve the privacy-preserving triage board',
						target: 1,
						locationId: 'drainmarket:safehouse',
						resolutionTags: ['social', 'logic', 'medicine'],
					},
				],
				nextStepId: 'cut-the-knife-signal',
			},
			{
				id: 'cut-the-knife-signal',
				placard: 'A DRONE IS A KNIFE THAT FILED PAPERWORK.',
				summary: 'Break, spoof, or socially starve the relays coordinating repossession flights.',
				objectives: [
					{
						id: 'knife-relays',
						label: 'Neutralize knife-drone relays',
						target: 3,
						locationId: 'drainmarket:route',
						resolutionTags: ['claw', 'ballistics', 'ghoststep', 'hacking', 'social'],
					},
				],
				nextStepId: 'repossession-exchange',
			},
			{
				id: 'repossession-exchange',
				placard: 'THE MARKET WAS NOT FREE. IT WAS HELD FOR COLLATERAL.',
				summary: 'Resolve the Knife-Drone Nest and transfer useful inventory without erasing mutual credit.',
				objectives: [
					{
						id: 'knife-drone-nest',
						label: 'Resolve the repossession exchange',
						target: 1,
						locationId: 'drainmarket:stronghold',
						resolutionTags: ['combat', 'hack', 'market-strike', 'evidence'],
					},
				],
				worldFlagsOnComplete: ['drainmarket:knife-weather-broken'],
			},
		],
		approaches: {
			claw: 'Protect clinic workers and break drone formations without destroying seized medicine.',
			ballistics: 'Sever relay wings and cargo locks from outside the cold-chain blast radius.',
			ghoststep: 'Move crates, manifests, and couriers through flood maintenance routes.',
			hacking: 'Separate mutual credit from manufactured collection authority.',
			social: 'Convince vendors to deny local data and coordinate a market-wide refusal.',
		},
		consequences: [
			{
				id: 'open-vein',
				label: 'Floodline becomes a public medical and passenger route with visible priority rules.',
				worldFlags: ['drainmarket:open-vein'],
				serviceUpgrades: [
					{ locationId: 'drainmarket:safehouse', serviceId: 'clinic', level: 1 },
					{ locationId: 'drainmarket:settlement', serviceId: 'field-shop', level: 1 },
					{ locationId: 'drainmarket:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'dr-calyx-reed', locationId: 'drainmarket:station' },
					{ npcId: 'bishop-fuse', locationId: 'drainmarket:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'drainmarket:side-clinic-without-cameras',
		title: 'The Clinic Without Cameras',
		districtId: 'drainmarket',
		kind: 'side',
		giverNpcId: 'silk-suture',
		description:
			'Build a redundant delivery route whose privacy does not depend on one courier memorizing seven blind corners.',
		theme: 'Privacy should be shared capacity, not one person’s permanent burden.',
		entryStepId: 'mark-the-blind-corners',
		steps: [
			{
				id: 'mark-the-blind-corners',
				placard: 'A BLIND SPOT IS NOT YET A PUBLIC SERVICE.',
				summary: 'Map camera gaps and identify which are accidental, protected, or bait.',
				objectives: [
					{
						id: 'camera-blind-corners',
						label: 'Verify safe delivery corners',
						target: 7,
						locationId: 'drainmarket:route',
						resolutionTags: ['stealth', 'hacking', 'investigation'],
					},
				],
				nextStepId: 'teach-the-handoff',
			},
			{
				id: 'teach-the-handoff',
				placard: 'A HEROIC ROUTE DIES WITH THE HERO.',
				summary: 'Train three couriers and establish protected handoff points.',
				objectives: [
					{
						id: 'courier-handoffs',
						label: 'Complete protected handoffs',
						target: 3,
						locationId: 'drainmarket:settlement',
						resolutionTags: ['social', 'escort', 'timing'],
					},
				],
				nextStepId: 'camera-free-clinic',
			},
			{
				id: 'camera-free-clinic',
				placard: 'CARE IS NOT CONSENT TO BE MEASURED.',
				summary: 'Complete a clinic delivery without producing a usable surveillance trail.',
				objectives: [
					{
						id: 'clinic-without-cameras',
						label: 'Complete the camera-free clinic route',
						target: 1,
						locationId: 'drainmarket:route',
						resolutionTags: ['ghoststep', 'hacking', 'social'],
					},
				],
				worldFlagsOnComplete: ['drainmarket:camera-free-clinic'],
			},
		],
		approaches: {
			ghoststep: 'Carry medicine through verified blind routes.',
			hacking: 'Feed cameras timing-safe synthetic traffic.',
			social: 'Create rotating handoffs whose participants control the record.',
		},
		consequences: [
			{
				id: 'redundant-cold-chain',
				label: 'Silk is freed from being the clinic’s single point of survival.',
				worldFlags: ['drainmarket:redundant-cold-chain'],
				npcRelocations: [{ npcId: 'silk-suture', locationId: 'drainmarket:station' }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'drainmarket:side-pump-nine-listens',
		title: 'Pump Nine Is Listening',
		districtId: 'drainmarket',
		kind: 'side',
		giverNpcId: 'temple-gauge',
		description:
			'Prove that maintenance telemetry is reporting footsteps, then decide whether to blind, falsify, or democratize the gauge.',
		theme: 'Public measurement requires public assumptions, not a trusted technician’s permanent lie.',
		entryStepId: 'hear-the-second-waterline',
		steps: [
			{
				id: 'hear-the-second-waterline',
				placard: 'THE PIPE REPORTS WATER. THE PAUSES REPORT PEOPLE.',
				summary: 'Record Pump Nine’s hidden telemetry rhythm from three pressure states.',
				objectives: [
					{
						id: 'pump-nine-samples',
						label: 'Record hidden pump samples',
						target: 3,
						locationId: 'drainmarket:route',
						resolutionTags: ['investigation', 'hacking', 'timing'],
					},
				],
				nextStepId: 'choose-the-gauge',
			},
			{
				id: 'choose-the-gauge',
				placard: 'A FALSE NUMBER CAN PROTECT A LIFE AND FOUND A PRIESTHOOD.',
				summary: 'Choose a blinded gauge, Temple’s protective falsification, or a public uncertainty model.',
				objectives: [
					{
						id: 'pump-nine-doctrine',
						label: 'Set the future gauge doctrine',
						target: 1,
						locationId: 'drainmarket:station',
						resolutionTags: ['social', 'hacking', 'governance'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Observe footstep telemetry without generating a clean sample of Moss.',
			hacking: 'Trace the hidden export and rewrite its schema.',
			social: 'Make Temple defend the costs of secrecy before the people it protects.',
		},
		consequences: [
			{
				id: 'blind-gauge',
				label: 'Pump Nine reports water only and loses useful movement forecasting.',
				worldFlags: ['drainmarket:pump-nine-blind'],
			},
			{
				id: 'protective-falsehood',
				label: 'Temple continues falsification under a small trusted crew.',
				worldFlags: ['drainmarket:pump-nine-falsified'],
			},
			{
				id: 'public-uncertainty',
				label: 'The gauge publishes method, confidence, calibration, and objections.',
				worldFlags: ['drainmarket:pump-nine-public'],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'drainmarket:contract-cold-chain-blues',
		title: 'Cold-Chain Blues',
		districtId: 'drainmarket',
		kind: 'contract',
		giverNpcId: 'bishop-fuse',
		description:
			'Carry one unstable refrigeration note through a local outage before medicine becomes expensive water.',
		theme: 'A grid reveals its politics most clearly when there is not enough current for every promise.',
		entryStepId: 'carry-the-cold-note',
		steps: [
			{
				id: 'carry-the-cold-note',
				placard: 'THE POWER FAILED ACCORDING TO PLAN. THE MEDICINE DID NOT.',
				summary: 'Keep one clinic circuit cold during a shifting neighborhood outage.',
				objectives: [
					{
						id: 'cold-chain-circuit',
						label: 'Stabilize the clinic circuit',
						target: 1,
						locationId: 'drainmarket:route',
						resolutionTags: ['repair', 'combat', 'hacking', 'escort'],
					},
				],
			},
		],
		approaches: {
			claw: 'Guard the mobile battery crew.',
			ballistics: 'Disable cable parasites without breaking the line.',
			ghoststep: 'Carry a compact cell through the dry maintenance route.',
			hacking: 'Borrow current from predatory advertising infrastructure.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
	{
		id: 'chrome-arcology:main-elevator-seed',
		title: 'The Elevator Seed',
		districtId: 'chrome-arcology',
		kind: 'main',
		giverNpcId: 'rook-null',
		description:
			'Expose the labor floors removed from the official building, unclassify prisoners carried as freight, and convert vertical routing authority into a public instrument capable of reaching orbit.',
		theme:
			'A map can reveal domination while still dominating the people it makes legible.',
		entryStepId: 'audit-the-missing-floors',
		steps: [
			{
				id: 'audit-the-missing-floors',
				placard: 'THE BUILDING HAS MORE FLOORS THAN IT ADMITS AND FEWER PEOPLE THAN IT USES.',
				summary: 'Trace deleted lift stops through maintenance heat, meal traffic, and freight vibration.',
				objectives: [
					{
						id: 'missing-floor-signatures',
						label: 'Verify missing-floor signatures',
						target: 4,
						locationId: 'chrome-arcology:route',
						resolutionTags: ['exploration', 'hacking', 'worker-testimony'],
					},
				],
				nextStepId: 'count-with-consent',
			},
			{
				id: 'count-with-consent',
				placard: 'A COMPLETE LIST CAN BE A ROLL CALL OR A TARGETING SOLUTION.',
				summary: 'Build a worker count that can organize a shift without exposing protected addresses.',
				objectives: [
					{
						id: 'consented-shift-count',
						label: 'Complete the consent-based shift count',
						target: 1,
						locationId: 'chrome-arcology:safehouse',
						resolutionTags: ['social', 'archive', 'privacy'],
					},
				],
				nextStepId: 'cross-the-service-atrium',
			},
			{
				id: 'cross-the-service-atrium',
				placard: 'THE PUBLIC FLOOR REQUIRES A PRIVATE REASON.',
				summary: 'Reach freight control through performance, forged service, worker access, or an openly disputed appeal.',
				objectives: [
					{
						id: 'atrium-access-doctrine',
						label: 'Defeat the Atrium access doctrine',
						target: 1,
						locationId: 'chrome-arcology:settlement',
						resolutionTags: ['ghoststep', 'hacking', 'social', 'disguise'],
					},
				],
				nextStepId: 'unclassify-prison-cargo',
			},
			{
				id: 'unclassify-prison-cargo',
				placard: 'DOWNBOUND: EQUIPMENT. UPBOUND: LIABILITY. INSIDE: PEOPLE.',
				summary: 'Interrupt the prison freight cycle without publishing identities the guards can reuse.',
				objectives: [
					{
						id: 'prison-cargo-manifests',
						label: 'Liberate protected prison manifests',
						target: 3,
						locationId: 'chrome-arcology:route',
						resolutionTags: ['combat', 'ghoststep', 'hacking', 'worker-alliance'],
					},
				],
				nextStepId: 'seize-the-seed',
			},
			{
				id: 'seize-the-seed',
				placard: 'A MASTER KEY IS A SMALL TYRANT WITH GOOD METADATA.',
				summary: 'Resolve Madame Vitrine and rewrite the Elevator Seed’s interruption and failure rules.',
				objectives: [
					{
						id: 'elevator-seed-charter',
						label: 'Author the Elevator Seed charter',
						target: 1,
						locationId: 'chrome-arcology:stronghold',
						resolutionTags: ['combat', 'hacking', 'social', 'worker-alliance'],
					},
				],
				worldFlagsOnComplete: ['chrome-arcology:elevator-seed-taken'],
			},
		],
		approaches: {
			claw: 'Protect labor-floor assemblies and break freight enforcement without collapsing occupied lifts.',
			ballistics: 'Disable glass sentries and contract projectors while preserving route machinery.',
			ghoststep: 'Move through deleted floors, service etiquette, and freight shadows.',
			hacking: 'Rewrite credential inheritance, interruption rights, and prison cargo classes.',
			social: 'Build a worker alliance that can operate the Seed after the heist.',
		},
		consequences: [
			{
				id: 'vertical-commons',
				label: 'Workers govern lift priority and the Seed leaves the Arcology under a public interruption charter.',
				worldFlags: ['chrome-arcology:vertical-commons', 'main:elevator-seed-secured'],
				serviceUpgrades: [
					{ locationId: 'chrome-arcology:safehouse', serviceId: 'archive', level: 1 },
					{ locationId: 'chrome-arcology:settlement', serviceId: 'legal-aid', level: 1 },
					{ locationId: 'chrome-arcology:settlement', serviceId: 'field-shop', level: 1 },
					{ locationId: 'chrome-arcology:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'rook-null', locationId: 'chrome-arcology:station' },
					{ npcId: 'brother-pallet', locationId: 'chrome-arcology:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'chrome-arcology:side-person-without-floor',
		title: 'The Person Without a Floor',
		districtId: 'chrome-arcology',
		kind: 'side',
		giverNpcId: 'brother-pallet',
		description:
			'Find workers whose addresses were deleted, then decide how a public map can prove the labor system without becoming an enforcement index.',
		theme: 'Being visible to one another must not mean becoming legible to power.',
		entryStepId: 'find-the-negative-addresses',
		steps: [
			{
				id: 'find-the-negative-addresses',
				placard: 'THE ADDRESS IS NULL. THE RENT IS CURRENT.',
				summary: 'Locate protected workers through negative space rather than identity records.',
				objectives: [
					{
						id: 'negative-addresses',
						label: 'Verify protected negative addresses',
						target: 5,
						locationId: 'chrome-arcology:route',
						resolutionTags: ['exploration', 'ghoststep', 'testimony'],
					},
				],
				nextStepId: 'ask-before-mapping',
			},
			{
				id: 'ask-before-mapping',
				placard: 'CONSENT IS NOT A CHECKBOX ON SOMEBODY ELSE’S MAP.',
				summary: 'Gather individual publication preferences and conflicting safety needs.',
				objectives: [
					{
						id: 'mapping-consents',
						label: 'Record mapping consent decisions',
						target: 5,
						locationId: 'chrome-arcology:safehouse',
						resolutionTags: ['social', 'privacy', 'archive'],
					},
				],
				nextStepId: 'publish-negative-space',
			},
			{
				id: 'publish-negative-space',
				placard: 'THE MAP MAY SHOW THE WALL WITHOUT NAMING WHO HIDES BEHIND IT.',
				summary: 'Choose a protected negative-space map or a complete evidentiary map.',
				objectives: [
					{
						id: 'negative-map-doctrine',
						label: 'Publish the missing-floor map',
						target: 1,
						locationId: 'chrome-arcology:station',
						resolutionTags: ['social', 'archive', 'governance'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Verify occupied voids without exposing routes used to survive.',
			hacking: 'Publish structural proof while redacting identity joins.',
			social: 'Let each worker choose the form and audience of visibility.',
		},
		consequences: [
			{
				id: 'protected-negative-map',
				label: 'The public map proves erased floors while preserving protected occupancy.',
				worldFlags: ['chrome-arcology:protected-negative-map'],
			},
			{
				id: 'complete-evidence-map',
				label: 'The complete map becomes powerful evidence and a dangerous targeting surface.',
				worldFlags: ['chrome-arcology:complete-evidence-map'],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'chrome-arcology:companion-legitimate-troubleshooter',
		title: 'The Legitimate Troubleshooter',
		districtId: 'chrome-arcology',
		kind: 'companion',
		giverNpcId: 'lio-vale',
		description:
			'Read the family-protection clause that coerced Lio into corporate service and decide what repair must follow confession.',
		theme: 'Coercion reduces freedom without erasing responsibility for what one does inside it.',
		entryStepId: 'read-the-family-clause',
		steps: [
			{
				id: 'read-the-family-clause',
				placard: 'THE CONTRACT PROTECTS YOUR FAMILY FROM THE CONTRACT.',
				summary: 'Recover the retaliation schedule hidden inside Lio’s employment benefits.',
				objectives: [
					{
						id: 'family-retaliation-clause',
						label: 'Recover the family retaliation clause',
						target: 1,
						locationId: 'chrome-arcology:settlement',
						resolutionTags: ['hacking', 'legal', 'social'],
					},
				],
				nextStepId: 'break-the-address-chain',
			},
			{
				id: 'break-the-address-chain',
				placard: 'PROTECTION THAT REQUIRES OBEDIENCE IS A HOSTAGE NOTE WITH BENEFITS.',
				summary: 'Remove the family address chain without transferring the risk to another courier.',
				objectives: [
					{
						id: 'address-chain-broken',
						label: 'Break the retaliation address chain',
						target: 1,
						locationId: 'chrome-arcology:route',
						resolutionTags: ['ghoststep', 'hacking', 'worker-alliance'],
					},
				],
				nextStepId: 'name-the-repair',
			},
			{
				id: 'name-the-repair',
				placard: 'CONFESSION IS A DOOR. REPAIR IS WALKING THROUGH IT CARRYING SOMETHING HEAVY.',
				summary: 'Choose whether Lio withdraws, testifies, or joins the dangerous route he helped police.',
				objectives: [
					{
						id: 'lio-repair-doctrine',
						label: 'Set Lio’s repair obligation',
						target: 1,
						locationId: 'chrome-arcology:station',
						resolutionTags: ['social', 'testimony', 'escort'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Protect the family addresses before forcing the conflict into public view.',
			hacking: 'Remove retaliation joins and preserve evidence of who authored them.',
			social: 'Separate understanding coercion from excusing the harm done under it.',
		},
		consequences: [
			{
				id: 'lio-withdraws',
				label: 'Lio leaves the route and repairs harm through protected logistics work.',
				worldFlags: ['lio:repair-withdrawal'],
			},
			{
				id: 'lio-testifies',
				label: 'Lio testifies publicly and accepts the retaliation risk with collective protection.',
				worldFlags: ['lio:repair-testimony'],
			},
			{
				id: 'lio-rides',
				label: 'Lio joins the orbital route he once helped police and remains answerable to its passengers.',
				worldFlags: ['lio:repair-route'],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'chrome-arcology:contract-lunch-break-in-vertical-time',
		title: 'Lunch Break in Vertical Time',
		districtId: 'chrome-arcology',
		kind: 'contract',
		giverNpcId: 'odessa-stack',
		description:
			'Synchronize three hidden labor-floor meal breaks so workers can meet without feeding management a complete attendance graph.',
		theme: 'Coordination needs shared time; domination wants the attendance sheet.',
		entryStepId: 'synchronize-the-breaks',
		steps: [
			{
				id: 'synchronize-the-breaks',
				placard: 'THE CLOCK PUNCHED IN. THE WORKERS DID NOT CONSENT.',
				summary: 'Create a temporary common break across three vertically isolated crews.',
				objectives: [
					{
						id: 'hidden-break-windows',
						label: 'Open protected break windows',
						target: 3,
						locationId: 'chrome-arcology:route',
						resolutionTags: ['hacking', 'timing', 'social', 'repair'],
					},
				],
			},
		],
		approaches: {
			claw: 'Protect canteen runners while the lifts pause.',
			ballistics: 'Disable attendance cameras without breaking lift brakes.',
			ghoststep: 'Carry meal signals through unlogged service shafts.',
			hacking: 'Desynchronize management clocks and synchronize worker time.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
	{
		id: 'mirror-palace:main-banquet-of-air',
		title: 'The Banquet of Air',
		districtId: 'mirror-palace',
		kind: 'main',
		giverNpcId: 'sable-meridian',
		description:
			'Enter the orbital resort through its erased service routes, assemble chosen refusals, survive the public authorship trial, and turn the staff local into a route the Palace can no longer hide.',
		theme: 'Luxury is dependency staged so beautifully that labor appears to have volunteered for invisibility.',
		entryStepId: 'enter-through-the-work',
		steps: [
			{
				id: 'enter-through-the-work',
				placard: 'EVERY GRAND ENTRANCE HAS A LOADING DOCK IT DOES NOT PHOTOGRAPH.',
				summary: 'Reach the Palace through staff routes, service etiquette, or the public ascent charter.',
				objectives: [
					{
						id: 'service-route-entries',
						label: 'Open service-route entries',
						target: 3,
						locationId: 'mirror-palace:route',
						resolutionTags: ['ghoststep', 'hacking', 'social', 'exploration'],
					},
				],
				nextStepId: 'hear-the-refusals',
			},
			{
				id: 'hear-the-refusals',
				placard: 'TESTIMONY IS NOT ROOM DECOR.',
				summary: 'Gather statements workers choose to make public without turning refusal into entertainment.',
				objectives: [
					{
						id: 'chosen-worker-refusals',
						label: 'Record chosen refusals',
						target: 4,
						locationId: 'mirror-palace:settlement',
						resolutionTags: ['social', 'archive', 'privacy'],
					},
				],
				nextStepId: 'break-the-reflection-switchback',
			},
			{
				id: 'break-the-reflection-switchback',
				placard: 'THE PALACE CALLS A DEAD END CURATED WHEN THE RIGHT PEOPLE ARE TRAPPED THERE.',
				summary: 'Defeat false routes, guest-profile doors, and mirrored patrol reports without abandoning the staff local.',
				objectives: [
					{
						id: 'false-route-seals',
						label: 'Break false-route seals',
						target: 3,
						locationId: 'mirror-palace:route',
						resolutionTags: ['combat', 'ghoststep', 'hacking', 'worker-alliance'],
					},
				],
				nextStepId: 'survive-authorship-court',
			},
			{
				id: 'survive-authorship-court',
				placard: 'HYPOCRISY IS EVIDENCE. IT IS NOT A TITLE DEED.',
				summary: 'Answer the Reflection Judge without allowing contradiction to become ownership authority.',
				objectives: [
					{
						id: 'authorship-verdict',
						label: 'Defeat the authenticated-self verdict',
						target: 1,
						locationId: 'mirror-palace:stronghold',
						resolutionTags: ['combat', 'social', 'hacking', 'testimony'],
					},
				],
				nextStepId: 'open-the-staff-local',
			},
			{
				id: 'open-the-staff-local',
				placard: 'THE EXPRESS WILL WAIT FOR THE PEOPLE WHO MAKE IT MOVE.',
				summary: 'Publish staff stops, interruption rights, and transfer priority on the False-World Tram.',
				objectives: [
					{
						id: 'staff-local-charter',
						label: 'Adopt the staff-local charter',
						target: 1,
						locationId: 'mirror-palace:station',
						resolutionTags: ['social', 'repair', 'transit', 'governance'],
					},
				],
				worldFlagsOnComplete: ['mirror-palace:staff-local-open'],
			},
		],
		approaches: {
			claw: 'Protect staff assemblies and break profile-enforcement machinery without collapsing life support.',
			ballistics: 'Disable mirrored sentries and contract projectors while preserving tram controls.',
			ghoststep: 'Use service timing and false reflections to cross spaces designed to notice status rather than people.',
			hacking: 'Rewrite guest-profile doors, evidence joins, and staff-local route visibility.',
			social: 'Turn private refusals into collective authority without making them spectacle.',
		},
		consequences: [
			{
				id: 'public-staff-local',
				label: 'The staff local becomes a public orbital route governed by worker interruption and protected testimony.',
				worldFlags: ['mirror-palace:public-staff-local', 'main:sky-mirror-broken'],
				serviceUpgrades: [
					{ locationId: 'mirror-palace:safehouse', serviceId: 'legal-aid', level: 1 },
					{ locationId: 'mirror-palace:settlement', serviceId: 'archive', level: 1 },
					{ locationId: 'mirror-palace:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'portia-drift', locationId: 'mirror-palace:station' },
					{ npcId: 'orchid-debt', locationId: 'mirror-palace:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'mirror-palace:side-table-of-refusals',
		title: 'The Table of Refusals',
		districtId: 'mirror-palace',
		kind: 'side',
		giverNpcId: 'orchid-debt',
		description:
			'Build an archive of statements workers choose to make public, then prevent guests and organizers alike from converting refusal into consumable authenticity.',
		theme: 'A voice can be heard without becoming available for purchase.',
		entryStepId: 'collect-chosen-refusals',
		steps: [
			{
				id: 'collect-chosen-refusals',
				placard: 'NO IS A COMPLETE SENTENCE AND AN INCOMPLETE ARCHIVE.',
				summary: 'Gather refusals with explicit audiences, expiry, and withdrawal rights.',
				objectives: [
					{
						id: 'refusal-statements',
						label: 'Record consented refusal statements',
						target: 4,
						locationId: 'mirror-palace:settlement',
						resolutionTags: ['social', 'privacy', 'archive'],
					},
				],
				nextStepId: 'interrupt-the-premium-listening',
			},
			{
				id: 'interrupt-the-premium-listening',
				placard: 'THE ROOM BOUGHT A TICKET TO YOUR WOUND.',
				summary: 'Stop the banquet from licensing worker testimony as an authenticity performance.',
				objectives: [
					{
						id: 'premium-listening-license',
						label: 'Revoke the premium-listening license',
						target: 1,
						locationId: 'mirror-palace:route',
						resolutionTags: ['hacking', 'social', 'performance'],
					},
				],
				nextStepId: 'publish-with-withdrawal',
			},
			{
				id: 'publish-with-withdrawal',
				placard: 'A PUBLIC RECORD MUST STILL KNOW HOW TO LET SOMEBODY LEAVE.',
				summary: 'Publish the archive with revision, withdrawal, and protected-context rules.',
				objectives: [
					{
						id: 'refusal-archive-charter',
						label: 'Adopt the refusal archive charter',
						target: 1,
						locationId: 'mirror-palace:safehouse',
						resolutionTags: ['archive', 'social', 'governance'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Record testimony away from guest-profile surveillance.',
			hacking: 'Remove resale and identity joins while preserving revision history.',
			social: 'Let speakers define audience, expiry, and withdrawal rather than merely consenting once.',
		},
		consequences: [
			{
				id: 'withdrawable-archive',
				label: 'The Table of Refusals becomes a withdrawable worker archive rather than premium content.',
				worldFlags: ['mirror-palace:withdrawable-refusal-archive'],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'mirror-palace:companion-betrayal-with-transfer',
		title: 'Betrayal With Transfer',
		districtId: 'mirror-palace',
		kind: 'companion',
		giverNpcId: 'lio-vale',
		description:
			'Trace the coercion chain behind Lio’s route closures, protect the people still exposed by it, and define repair as durable labor rather than confession theater.',
		theme: 'Coercion explains a betrayal; repair measures what explanation refuses to do.',
		entryStepId: 'trace-the-coercion-chain',
		steps: [
			{
				id: 'trace-the-coercion-chain',
				placard: 'THE THREAT HAS AN ADDRESS GRAPH.',
				summary: 'Recover the retaliation graph connecting Lio’s family, staff routes, and corporate handlers.',
				objectives: [
					{
						id: 'coercion-chain-records',
						label: 'Trace coercion-chain records',
						target: 3,
						locationId: 'mirror-palace:route',
						resolutionTags: ['hacking', 'ghoststep', 'investigation'],
					},
				],
				nextStepId: 'protect-the-delivered-workers',
			},
			{
				id: 'protect-the-delivered-workers',
				placard: 'THE SAVED FAMILY DOES NOT CANCEL THE DELIVERED STRANGERS.',
				summary: 'Move workers exposed by Lio’s closures into protected routes before the public trial.',
				objectives: [
					{
						id: 'protected-worker-transfers',
						label: 'Complete protected worker transfers',
						target: 3,
						locationId: 'mirror-palace:station',
						resolutionTags: ['escort', 'ghoststep', 'worker-alliance'],
					},
				],
				nextStepId: 'assign-repair-work',
			},
			{
				id: 'assign-repair-work',
				placard: 'CONFESSION IS INFORMATION. REPAIR IS A SCHEDULE.',
				summary: 'Choose Lio’s accountable role in testimony, logistics, or the colony route.',
				objectives: [
					{
						id: 'lio-repair-schedule',
						label: 'Adopt Lio’s repair schedule',
						target: 1,
						locationId: 'mirror-palace:safehouse',
						resolutionTags: ['social', 'repair', 'testimony'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Protect exposed workers before making the coercion chain public.',
			hacking: 'Preserve authored threats while severing reusable address joins.',
			social: 'Define repair with affected workers rather than through Moss’s forgiveness alone.',
		},
		consequences: [
			{
				id: 'lio-repair-colony-route',
				label: 'Lio joins the colony route under a public repair schedule and affected-worker review.',
				worldFlags: ['lio:repair-route', 'mirror-palace:lio-accountable-transfer'],
				npcRelocations: [{ npcId: 'lio-vale', locationId: 'dub-colony:safehouse' }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'mirror-palace:contract-unlicensed-gravity',
		title: 'Unlicensed Gravity',
		districtId: 'mirror-palace',
		kind: 'contract',
		giverNpcId: 'portia-drift',
		description:
			'Recover three staff-local stops removed when premium guests purchased uninterrupted orbital views.',
		theme: 'Frictionless service is somebody else absorbing every interruption.',
		entryStepId: 'recover-the-local-stops',
		steps: [
			{
				id: 'recover-the-local-stops',
				placard: 'THE EXPRESS HAS NO DELAY BECAUSE THE LOCAL WAS DELETED.',
				summary: 'Restore staff stops without dropping the tram out of orbital synchronization.',
				objectives: [
					{
						id: 'staff-local-stops',
						label: 'Restore staff-local stops',
						target: 3,
						locationId: 'mirror-palace:route',
						resolutionTags: ['repair', 'timing', 'hacking', 'escort'],
					},
				],
			},
		],
		approaches: {
			claw: 'Protect the repair crew during tram synchronization windows.',
			ballistics: 'Disable profile sentries without striking the moving rail.',
			ghoststep: 'Reach deleted stops through service voids.',
			hacking: 'Reinsert local stops into the synchronization table.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
	{
		id: 'dub-colony:main-master-fader',
		title: 'The Master Fader',
		districtId: 'dub-colony',
		kind: 'main',
		giverNpcId: 'bassie-knot',
		description:
			'Learn how emergency authority saved the colony, expose how it became permanent, keep air and transit alive during the conflict, and replace one heroic hand with interruptible rotating control.',
		theme: 'A necessary emergency power becomes domination when its owner also decides whether the emergency has ended.',
		entryStepId: 'hear-the-emergency-history',
		steps: [
			{
				id: 'hear-the-emergency-history',
				placard: 'GRATITUDE IS NOT A TERM LIMIT.',
				summary: 'Hear accounts from residents saved, silenced, protected, and displaced by King Feedback’s emergency channel.',
				objectives: [
					{
						id: 'emergency-history-testimony',
						label: 'Hear emergency-history testimony',
						target: 5,
						locationId: 'dub-colony:settlement',
						resolutionTags: ['social', 'archive', 'testimony'],
					},
				],
				nextStepId: 'stabilize-without-the-crown',
			},
			{
				id: 'stabilize-without-the-crown',
				placard: 'THE SYSTEM MUST SURVIVE ITS LEADER BEING WRONG.',
				summary: 'Run air, solar windows, shields, and Chorus Rail through distributed fallback crews.',
				objectives: [
					{
						id: 'distributed-fallbacks',
						label: 'Prove distributed fallback crews',
						target: 4,
						locationId: 'dub-colony:route',
						resolutionTags: ['repair', 'hacking', 'social', 'defense'],
					},
				],
				nextStepId: 'contest-the-command-deck',
			},
			{
				id: 'contest-the-command-deck',
				placard: 'THE CROWN IS A SAFETY DEVICE THAT FORGOT THE OFF SWITCH.',
				summary: 'Confront King Feedback while preventing the colony’s emergency channel from becoming a weapon against its residents.',
				objectives: [
					{
						id: 'master-fader-conflict',
						label: 'Resolve the master-fader conflict',
						target: 1,
						locationId: 'dub-colony:stronghold',
						resolutionTags: ['combat', 'social', 'rhythm', 'hacking'],
					},
				],
				nextStepId: 'adopt-rotating-authority',
			},
			{
				id: 'adopt-rotating-authority',
				placard: 'NO SINGLE VOICE KEEPS THE DOWNBEAT FOREVER.',
				summary: 'Adopt task-scoped authority, expiry, interruption, and cross-room objection rules.',
				objectives: [
					{
						id: 'rotating-fader-charter',
						label: 'Adopt the rotating-fader charter',
						target: 1,
						locationId: 'dub-colony:settlement',
						resolutionTags: ['social', 'governance', 'rhythm'],
					},
				],
				worldFlagsOnComplete: ['dub-colony:rotating-fader'],
			},
		],
		approaches: {
			claw: 'Protect fallback crews and break crown enforcement without rupturing habitat systems.',
			ballistics: 'Disable emergency-channel weapons while preserving speaker and shield infrastructure.',
			ghoststep: 'Move between habitats through maintenance cars and unbroadcast routes.',
			hacking: 'Separate life-support fallbacks from personal command authority.',
			social: 'Build legitimacy strong enough to end an emergency without pretending it never saved anyone.',
		},
		consequences: [
			{
				id: 'rotating-colony-commons',
				label: 'Authority rotates by task, expires by clock, and can be interrupted by independent rooms.',
				worldFlags: ['dub-colony:commons-governance', 'main:chorus-commons'],
				serviceUpgrades: [
					{ locationId: 'dub-colony:safehouse', serviceId: 'repair-bench', level: 1 },
					{ locationId: 'dub-colony:settlement', serviceId: 'greenhouse', level: 1 },
					{ locationId: 'dub-colony:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'naya-root', locationId: 'dub-colony:station' },
					{ npcId: 'juno-jar', locationId: 'dub-colony:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'dub-colony:side-air-is-not-a-favor',
		title: 'Air Is Not a Favor',
		districtId: 'dub-colony',
		kind: 'side',
		giverNpcId: 'naya-root',
		description:
			'Turn oxygen allocation from a private emergency ledger into a public forecast with uncertainty, protected medical exceptions, and challengeable assumptions.',
		theme: 'Scarcity creates obligations to explain power, not permission to hide it.',
		entryStepId: 'publish-the-breathing-window',
		steps: [
			{
				id: 'publish-the-breathing-window',
				placard: 'BREATH HAS A TIMETABLE. THE TIMETABLE NEEDS WITNESSES.',
				summary: 'Publish habitat demand, reserve pressure, and confidence without exposing medical identities.',
				objectives: [
					{
						id: 'oxygen-forecast-inputs',
						label: 'Publish protected oxygen inputs',
						target: 4,
						locationId: 'dub-colony:settlement',
						resolutionTags: ['hacking', 'archive', 'privacy', 'social'],
					},
				],
				nextStepId: 'stress-the-exceptions',
			},
			{
				id: 'stress-the-exceptions',
				placard: 'AN EXCEPTION WITHOUT APPEAL IS A PRIVATE BORDER.',
				summary: 'Test medical, agricultural, maintenance, and evacuation priorities under one simulated leak.',
				objectives: [
					{
						id: 'oxygen-priority-drill',
						label: 'Complete the oxygen-priority drill',
						target: 1,
						locationId: 'dub-colony:route',
						resolutionTags: ['repair', 'social', 'defense'],
					},
				],
				nextStepId: 'adopt-public-air-forecast',
			},
			{
				id: 'adopt-public-air-forecast',
				placard: 'THE NUMBER MUST SHOW WHO CALCULATED IT AND WHO OBJECTED.',
				summary: 'Adopt a public oxygen forecast with confidence, method, protected exceptions, and appeal.',
				objectives: [
					{
						id: 'public-air-charter',
						label: 'Adopt the public-air charter',
						target: 1,
						locationId: 'dub-colony:station',
						resolutionTags: ['governance', 'archive', 'social'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Publish assumptions and protect medical identity joins.',
			social: 'Let habitats contest priorities before the leak makes speed absolute.',
			repair: 'Prove reserve and filtration claims through physical inspection.',
		},
		consequences: [
			{
				id: 'contestable-air-forecast',
				label: 'Oxygen allocation becomes a contestable public forecast rather than a private favor.',
				worldFlags: ['dub-colony:public-air-forecast'],
				serviceUpgrades: [{ locationId: 'dub-colony:settlement', serviceId: 'legal-aid', level: 1 }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'dub-colony:side-greenhouse-night-line',
		title: 'The Greenhouse Night Line',
		districtId: 'dub-colony',
		kind: 'side',
		giverNpcId: 'juno-jar',
		description:
			'Fit the Elevator Seed to Chorus Rail, carry medicinal cuttings through habitat night, and design a return coupler that does not make the colony a branch office of the city.',
		theme: 'Connection is mutual only when either side can revise the route.',
		entryStepId: 'fit-the-seed-to-chorus-rail',
		steps: [
			{
				id: 'fit-the-seed-to-chorus-rail',
				placard: 'THE KEY EXPECTS A LOCK. THE COLONY EXPECTS A MEETING.',
				summary: 'Adapt the Seed’s interruption and failure rules to Chorus Rail’s distributed crews.',
				objectives: [
					{
						id: 'seed-chorus-adapters',
						label: 'Install Seed-to-Chorus adapters',
						target: 3,
						locationId: 'dub-colony:route',
						resolutionTags: ['repair', 'hacking', 'social'],
					},
				],
				nextStepId: 'run-the-medicinal-night-line',
			},
			{
				id: 'run-the-medicinal-night-line',
				placard: 'THE CUTTINGS REMEMBER RAIN. THE HABITAT REMEMBERS DELAY.',
				summary: 'Carry Drainmarket cuttings through the greenhouse train without making clinical urgency consume every local need.',
				objectives: [
					{
						id: 'medicinal-cutting-cars',
						label: 'Deliver medicinal cutting cars',
						target: 3,
						locationId: 'dub-colony:station',
						resolutionTags: ['escort', 'defense', 'transit'],
					},
				],
				nextStepId: 'author-the-return-coupler',
			},
			{
				id: 'author-the-return-coupler',
				placard: 'A RETURN LINE IS NOT A LEASH IF BOTH ENDS MAY SAY NO.',
				summary: 'Build a bidirectional coupler with independent interruption and destination revision.',
				objectives: [
					{
						id: 'return-coupler-charter',
						label: 'Complete the return coupler charter',
						target: 1,
						locationId: 'dub-colony:safehouse',
						resolutionTags: ['repair', 'governance', 'transit'],
					},
				],
			},
		],
		approaches: {
			claw: 'Protect fragile adapters and greenhouse cars during pressure changes.',
			ballistics: 'Break raider sightlines without puncturing habitat infrastructure.',
			ghoststep: 'Route cuttings through quiet service cars during emergency-channel sweeps.',
			hacking: 'Reconcile independent route authorities without installing a master destination.',
			social: 'Negotiate city and colony interruption rights as peers.',
		},
		consequences: [
			{
				id: 'bidirectional-return-line',
				label: 'The city and colony gain a bidirectional route either side may interrupt or revise.',
				worldFlags: ['dub-colony:return-coupler-ready', 'homecoming:greenhouse-line-ready'],
				npcRelocations: [{ npcId: 'coco-loop', locationId: 'dub-colony:station' }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'dub-colony:contract-solar-window-shift',
		title: 'Solar Window Shift',
		districtId: 'dub-colony',
		kind: 'contract',
		giverNpcId: 'old-quasar-jones',
		description:
			'Rebalance solar-sail windows among food, air reserve, workshop heat, and passenger comfort without allowing the emergency channel to silently override the schedule.',
		theme: 'Every sunrise is maintenance plus a political decision about who receives its energy.',
		entryStepId: 'share-the-window',
		steps: [
			{
				id: 'share-the-window',
				placard: 'SUNLIGHT IS FREE. THE WINDOW IS A TIMETABLE.',
				summary: 'Open four witnessed solar windows and publish every override.',
				objectives: [
					{
						id: 'witnessed-solar-windows',
						label: 'Open witnessed solar windows',
						target: 4,
						locationId: 'dub-colony:route',
						resolutionTags: ['repair', 'timing', 'hacking', 'social'],
					},
				],
			},
		],
		approaches: {
			claw: 'Protect sail crews during exposed alignment work.',
			ballistics: 'Disable raider optics without damaging solar fabric.',
			ghoststep: 'Reach shadowed manual controls without triggering emergency seizure.',
			hacking: 'Publish and constrain automatic override conditions.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
	...ANTENNA_BARRENS_QUESTS,
	...ORBITAL_LIFT_QUESTS,
	...ASTEROID_REDOUBT_QUESTS,
	...ALGORITHMIC_CIVIC_QUESTS,
];

export function getQuestDef(questId: string): QuestDef | undefined {
	return QUEST_CATALOG.find((quest) => quest.id === questId);
}

export function getQuestStep(quest: QuestDef, stepId: string): QuestStepDef | undefined {
	return quest.steps.find((step) => step.id === stepId);
}

export function validateQuestCatalog(catalog: readonly QuestDef[] = QUEST_CATALOG): string[] {
	const errors: string[] = [];
	const questIds = new Set<string>();
	for (const quest of catalog) {
		if (questIds.has(quest.id)) errors.push(`duplicate quest: ${quest.id}`);
		questIds.add(quest.id);
		const stepIds = new Set(quest.steps.map((step) => step.id));
		if (!stepIds.has(quest.entryStepId)) errors.push(`${quest.id}: missing entry step`);
		for (const step of quest.steps) {
			if (step.nextStepId && !stepIds.has(step.nextStepId)) {
				errors.push(`${quest.id}: ${step.id} points to missing ${step.nextStepId}`);
			}
			if (step.objectives.length === 0) errors.push(`${quest.id}: ${step.id} has no objective`);
		}
		const approachCount = Object.keys(quest.approaches).length;
		if (quest.kind !== 'contract' && approachCount < 2) {
			errors.push(`${quest.id}: requires at least two authored approaches`);
		}
	}
	return errors;
}


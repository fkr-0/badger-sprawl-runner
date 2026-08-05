import type { NpcConversationDef, NpcDef } from './NpcCatalog';
import type { QuestDef } from './QuestCatalog';
import type { NpcScheduleRule } from './WorldSchedule';

export const ALGORITHMIC_CIVIC_NPCS: readonly NpcDef[] = [
	{
		id: 'godel-archive-echo',
		name: 'Kurt Gödel Archive Echo',
		alias: 'Passenger on the Incomplete Timetable',
		pronouns: 'he/him',
		homeLocationId: 'asteroid-redoubt:safehouse',
		roles: ['mentor', 'investigator', 'witness'],
		services: ['archive'],
		visualHook:
			'A narrow archival projection in a dark formal coat, carrying a transit ticket whose destination field recursively cites the ticket itself.',
		voice:
			'Careful Viennese precision, dry enough to make paradox sound like station etiquette. The reconstruction marks every uncertain sentence with a soft checksum click.',
		contradiction:
			'The archive preserves a thinker famous for proving limits, yet institutions summon the echo whenever they want a famous mind to certify their completeness.',
		longArc:
			'The reconstruction refuses oracle status and helps the coalition distinguish a system being incomplete from a system concealing who was excluded. At Commons Dawn the echo remains available only as a cited, interruptible archive—not a permanent constitutional authority.',
	},
];

export const ALGORITHMIC_CIVIC_CONVERSATIONS: readonly NpcConversationDef[] = [
	{
		id: 'godel:the-ticket-cites-itself',
		npcId: 'godel-archive-echo',
		locationId: 'asteroid-redoubt:safehouse',
		priority: 180,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'godel-refused-oracle-status',
		startsQuestId: 'asteroid-redoubt:side-incomplete-timetable',
		startsQuestStepId: 'find-the-self-certifying-ticket',
		speakerLine:
			'This ticket is valid exactly when the timetable cannot prove it valid. The old archive calls that a defect. I call it an unusually honest passenger.',
		mossLine: 'Can you tell us which routes are safe?',
		followupLine:
			'I can tell you which claims fail. Safety still requires witnesses, maintenance, refusal, and somebody willing to revise the map after I stop speaking.',
	},
	{
		id: 'godel:incomplete-is-not-secret',
		npcId: 'godel-archive-echo',
		locationId: 'asteroid-redoubt:station',
		priority: 220,
		phase: 'transformed',
		requiresWorldFlags: ['commons:incompleteness-public'],
		trustDelta: 2,
		recordFlag: 'godel-published-limit-without-rule',
		speakerLine:
			'An incomplete timetable says some truths require another method. A secret timetable says the method belongs to management. Please do not confuse the two merely because both contain blanks.',
		mossLine: 'Who decides which blank is protected?',
		followupLine:
			'Not the theorem. The affected people, with reasons, expiry, appeal, and the freedom to accuse the archive of hiding behind me.',
	},
	{
		id: 'godel:commons-dawn-transfer',
		npcId: 'godel-archive-echo',
		locationId: 'lower-sprawl:station',
		priority: 230,
		phase: 'transformed',
		requiresWorldFlags: ['commons:incompleteness-public'],
		repeatable: true,
		speakerLine:
			'Blue Mercy now publishes a list titled “THINGS THIS MAP CANNOT DECIDE.” It is the first station notice I have seen that declines promotion.',
		mossLine: 'Does the line pass your proof?',
		followupLine: 'No living commons should aspire to be passed once and for all.',
	},
];

export const ALGORITHMIC_CIVIC_QUESTS: readonly QuestDef[] = [
	{
		id: 'chrome-arcology:contract-no-one-in-the-remainder',
		title: 'No One in the Remainder',
		districtId: 'chrome-arcology',
		kind: 'contract',
		giverNpcId: 'brother-pallet',
		description:
			'Pack medicine, tools, witnesses, oxygen, and profitable freight into a fixed lift manifest without treating whoever does not fit as computational waste.',
		theme:
			'Bin packing can expose scarcity, but an optimization objective is already a political statement about which remainder becomes somebody else’s emergency.',
		entryStepId: 'measure-with-consent',
		steps: [
			{
				id: 'measure-with-consent',
				placard: 'THE BIN KNOWS VOLUME. IT DOES NOT KNOW WHO MAY BE LEFT BEHIND.',
				summary: 'Measure six loads without converting protected passengers into public inventory.',
				objectives: [
					{
						id: 'consented-cargo-measurements',
						label: 'Record consented mass and volume envelopes',
						target: 6,
						locationId: 'chrome-arcology:settlement',
						resolutionTags: ['social', 'repair', 'privacy'],
					},
				],
				nextStepId: 'pack-protected-first',
			},
			{
				id: 'pack-protected-first',
				placard: 'OPTIMAL FOR WHOM IS PART OF THE INPUT.',
				summary: 'Produce a capacity-valid manifest that prioritizes protected people and care cargo before revenue.',
				objectives: [
					{
						id: 'protected-bin-packing-manifest',
						label: 'Solve the protected bin-packing manifest',
						target: 1,
						locationId: 'chrome-arcology:station',
						resolutionTags: ['hacking', 'repair', 'governance'],
					},
				],
				nextStepId: 'publish-the-remainder',
			},
			{
				id: 'publish-the-remainder',
				placard: 'UNPLACED IS A PUBLIC FAILURE STATE, NOT A PERSON TYPE.',
				summary: 'Publish the loads that did not fit, the rejected objective, and the next accountable departure.',
				objectives: [
					{
						id: 'remainder-appeal-board',
						label: 'Open the manifest remainder and appeal board',
						target: 1,
						locationId: 'chrome-arcology:station',
						resolutionTags: ['social', 'archive', 'transit'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Run the exact small-manifest solver and expose every objective coefficient.',
			repair: 'Measure real car limits and prevent optimistic capacity from becoming a broken ascent.',
			social: 'Protect consent, priority, and an accountable next departure for every unplaced load.',
		},
		consequences: [
			{
				id: 'public-manifest-objective',
				label: 'Lift manifests publish their optimization objective, protected priorities, and accountable remainder.',
				worldFlags: ['chrome-arcology:public-bin-packing', 'homecoming:manifest-remainder-visible'],
				serviceUpgrades: [
					{ locationId: 'chrome-arcology:station', serviceId: 'transit-control', level: 1 },
					{ locationId: 'chrome-arcology:station', serviceId: 'archive', level: 1 },
				],
			},
		],
		repeatPolicy: 'after-travel',
	},
	{
		id: 'dub-colony:side-four-colors-no-crown',
		title: 'Four Colors, No Crown',
		districtId: 'dub-colony',
		kind: 'side',
		giverNpcId: 'naya-root',
		description:
			'Color the colony’s conflict graph so adjacent life-support institutions never share one emergency authority shift, then rotate the colors before the schedule becomes hereditary.',
		theme:
			'A valid graph coloring prevents immediate conflicts; justice still requires that no color harden into a caste.',
		entryStepId: 'draw-the-conflict-edges',
		steps: [
			{
				id: 'draw-the-conflict-edges',
				placard: 'THE EDGE MEANS THESE TWO POWERS MAY NOT SLEEP IN THE SAME HAND.',
				summary: 'Document conflicts between air, food, transit, archive, clinic, and emergency broadcast authority.',
				objectives: [
					{
						id: 'public-authority-conflict-edges',
						label: 'Document authority-conflict edges',
						target: 8,
						locationId: 'dub-colony:settlement',
						resolutionTags: ['social', 'exploration', 'governance'],
					},
				],
				nextStepId: 'color-the-shifts',
			},
			{
				id: 'color-the-shifts',
				placard: 'A MINIMUM COLORING IS NOT A MAXIMUM DEMOCRACY.',
				summary: 'Find a conflict-free shift coloring and publish why fewer shifts fail.',
				objectives: [
					{
						id: 'minimum-authority-coloring',
						label: 'Solve the minimum authority coloring',
						target: 1,
						locationId: 'dub-colony:settlement',
						resolutionTags: ['hacking', 'social', 'archive'],
					},
				],
				nextStepId: 'rotate-the-palette',
			},
			{
				id: 'rotate-the-palette',
				placard: 'TODAY’S SAFE COLOR MUST NOT BECOME TOMORROW’S BLOODLINE.',
				summary: 'Attach expiry, training, and public rotation to every authority color.',
				objectives: [
					{
						id: 'rotating-color-charter',
						label: 'Adopt the rotating color charter',
						target: 1,
						locationId: 'dub-colony:station',
						resolutionTags: ['social', 'governance', 'transit'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Compute a minimum coloring and publish the failed lower-color attempts.',
			social: 'Define the conflict edges with affected workers rather than importing an abstract graph.',
			exploration: 'Trace hidden resource dependencies that make two apparently separate institutions adjacent.',
		},
		consequences: [
			{
				id: 'rotating-conflict-free-authority',
				label: 'Colony emergency authority becomes conflict-colored, expiring, teachable, and rotating.',
				worldFlags: ['dub-colony:authority-graph-colored', 'homecoming:rotating-authority-ready'],
				serviceUpgrades: [
					{ locationId: 'dub-colony:settlement', serviceId: 'legal-aid', level: 1 },
					{ locationId: 'dub-colony:station', serviceId: 'transit-control', level: 1 },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'antenna-barrens:side-assume-the-model-is-complete',
		title: 'Assume the Model Is Complete',
		districtId: 'antenna-barrens',
		kind: 'side',
		giverNpcId: 'doctor-error-bar',
		description:
			'Accept the forecast service’s strongest claim temporarily, derive what it would require, and close the claim when a protected appeal produces the forbidden counterexample.',
		theme:
			'Proof by contradiction can defeat an authority claim, but it cannot replace the people whose counterexample made the contradiction visible.',
		entryStepId: 'state-the-assumption-publicly',
		steps: [
			{
				id: 'state-the-assumption-publicly',
				placard: 'ASSUME, FOR THE SAKE OF THE APPEAL, THAT MANAGEMENT IS RIGHT.',
				summary: 'Publish the model-completeness assumption and the conditions that would refute it.',
				objectives: [
					{
						id: 'public-contradiction-assumption',
						label: 'Publish the contradiction assumption',
						target: 1,
						locationId: 'antenna-barrens:settlement',
						resolutionTags: ['social', 'archive', 'legal'],
					},
				],
				nextStepId: 'derive-the-forbidden-pair',
			},
			{
				id: 'derive-the-forbidden-pair',
				placard: 'THE MODEL REPRESENTS EVERY VALID APPEAL. THIS VALID APPEAL IS ABSENT.',
				summary: 'Trace the public implication chain until represented and omitted become simultaneously required.',
				objectives: [
					{
						id: 'closed-forecast-contradiction',
						label: 'Close the forecast contradiction proof',
						target: 1,
						locationId: 'antenna-barrens:route',
						resolutionTags: ['hacking', 'exploration', 'archive'],
					},
				],
				nextStepId: 'return-the-counterexample',
			},
			{
				id: 'return-the-counterexample',
				placard: 'THE COUNTEREXAMPLE HAS A NAME AND MAY WITHDRAW.',
				summary: 'Give the affected person control over publication, identity, expiry, and remedy.',
				objectives: [
					{
						id: 'counterexample-consent-remedy',
						label: 'Complete the counterexample consent and remedy record',
						target: 1,
						locationId: 'antenna-barrens:settlement',
						resolutionTags: ['social', 'privacy', 'legal'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Trace the implication chain and preserve a reproducible proof log.',
			social: 'Keep the affected person from becoming merely a famous counterexample.',
			exploration: 'Find the suppressed appeal whose absence closes the contradiction.',
		},
		consequences: [
			{
				id: 'forecast-completeness-refuted',
				label: 'The forecast service may publish advice but may no longer claim complete representation.',
				worldFlags: ['antenna-barrens:model-completeness-refuted', 'homecoming:contradiction-log-public'],
				serviceUpgrades: [
					{ locationId: 'antenna-barrens:settlement', serviceId: 'legal-aid', level: 1 },
					{ locationId: 'antenna-barrens:station', serviceId: 'archive', level: 1 },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'asteroid-redoubt:side-incomplete-timetable',
		title: 'The Incomplete Timetable',
		districtId: 'asteroid-redoubt',
		kind: 'side',
		giverNpcId: 'godel-archive-echo',
		description:
			'Use a self-referential route ticket to prove that no sufficiently expressive central timetable can certify every statement about its own protected routes.',
		theme:
			'Incompleteness limits centralized certification; it does not excuse secrecy, neglect, or surrendering political judgment to a theorem.',
		entryStepId: 'find-the-self-certifying-ticket',
		steps: [
			{
				id: 'find-the-self-certifying-ticket',
				placard: 'THIS TICKET IS VALID ONLY IF THE TIMETABLE CANNOT CERTIFY IT.',
				summary: 'Recover the recursive ticket and its interrupted proof history.',
				objectives: [
					{
						id: 'recursive-route-ticket',
						label: 'Recover the recursive route ticket',
						target: 1,
						locationId: 'asteroid-redoubt:safehouse',
						resolutionTags: ['exploration', 'archive', 'hacking'],
					},
				],
				nextStepId: 'mark-the-undecidable-stop',
			},
			{
				id: 'mark-the-undecidable-stop',
				placard: 'NOT PROVABLE HERE DOES NOT MEAN NOT TRUE ANYWHERE.',
				summary: 'Add an explicit undecidable state that routes claims to witness, maintenance, and appeal instead of denial.',
				objectives: [
					{
						id: 'undecidable-route-state',
						label: 'Install the undecidable route state',
						target: 1,
						locationId: 'asteroid-redoubt:station',
						resolutionTags: ['hacking', 'repair', 'governance'],
					},
				],
				nextStepId: 'limit-the-cameo',
			},
			{
				id: 'limit-the-cameo',
				placard: 'A FAMOUS LIMIT IS STILL NOT A GOVERNING BODY.',
				summary: 'Publish the echo’s sources, uncertainty, interruption path, and prohibition on oracle status.',
				objectives: [
					{
						id: 'godel-echo-limit-charter',
						label: 'Adopt the archive-echo limit charter',
						target: 1,
						locationId: 'asteroid-redoubt:settlement',
						resolutionTags: ['social', 'archive', 'governance'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Reproduce the self-reference without granting the archive authority over its interpretation.',
			social: 'Decide how undecidable route claims reach witnesses and affected communities.',
			repair: 'Install a physical fallback path when the central timetable cannot certify a route.',
			exploration: 'Recover the interrupted proof history and the protected stop it was designed to erase.',
		},
		consequences: [
			{
				id: 'public-incompleteness-procedure',
				label: 'The network publishes what it cannot decide and routes those claims to plural public procedures.',
				worldFlags: ['commons:incompleteness-public', 'asteroid-redoubt:undecidable-route-state'],
				serviceUpgrades: [
					{ locationId: 'asteroid-redoubt:station', serviceId: 'archive', level: 1 },
					{ locationId: 'asteroid-redoubt:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'godel-archive-echo', locationId: 'asteroid-redoubt:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
];

export const ALGORITHMIC_CIVIC_SCHEDULE_RULES: readonly NpcScheduleRule[] = [
	{
		npcId: 'godel-archive-echo',
		locationId: 'asteroid-redoubt:safehouse',
		fromBeat: 'last-route',
		untilBeatExclusive: 'commons-dawn',
		priority: 73,
	},
	{
		npcId: 'godel-archive-echo',
		locationId: 'lower-sprawl:station',
		fromBeat: 'commons-dawn',
		priority: 86,
		requiresWorldFlags: ['commons:incompleteness-public'],
	},
];

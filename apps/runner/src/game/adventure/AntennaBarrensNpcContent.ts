import type { NpcConversationDef, NpcDef } from './NpcCatalog';

export const ANTENNA_BARRENS_NPCS: readonly NpcDef[] = [
	{
		id: 'reverend-null-dial',
		name: 'Reverend Null Dial',
		alias: 'Pastor of the Unlicensed Frequency',
		pronouns: 'he/him',
		homeLocationId: 'antenna-barrens:safehouse',
		roles: ['broadcaster', 'organizer', 'witness'],
		services: ['signal-lab', 'rumor-board'],
		visualHook:
			'Long midnight radio coat lined with copper prayer strips, one gold tooth, headphones built from storm-dish bearings.',
		voice:
			'Sermon cadence over dusty breakbeats; generous, sly, and allergic to the word neutral.',
		contradiction:
			'He believes every suppressed voice deserves transmission, even when broadcasting it may expose the speaker to retaliation.',
		longArc:
			'Learns that a public signal must carry consent, expiry, and a way to withdraw—not only reach.',
	},
	{
		id: 'doctor-error-bar',
		name: 'Doctor Error Bar',
		alias: 'Statistician of the People Who Did Not Fit',
		pronouns: 'she/they',
		homeLocationId: 'antenna-barrens:settlement',
		roles: ['investigator', 'medic', 'witness'],
		services: ['archive', 'clinic', 'legal-aid'],
		visualHook:
			'White storm coat covered in handwritten confidence intervals, clinic satchel beside a folding probability board.',
		voice:
			'Calm noir diagnostician. Gives every confident claim an aftercare plan and every number a missing-person list.',
		contradiction:
			'She exposes uncertainty so carefully that urgent decisions can become indefinitely postponed.',
		longArc:
			'Builds the public forecast’s appeals and protected-exception doctrine, then accepts that uncertainty does not excuse inaction.',
	},
	{
		id: 'penny-static',
		name: 'Penny Static',
		alias: 'Courier of Messages Nobody Ordered',
		pronouns: 'she/her',
		homeLocationId: 'antenna-barrens:station',
		roles: ['courier', 'broadcaster', 'witness'],
		services: ['rumor-board', 'archive'],
		visualHook:
			'Silver rain hood, courier bag stitched from obsolete route maps, cassette labels running down both sleeves.',
		voice:
			'Fast corner-radio wit. Speaks in fragments until somebody tries to quote her out of context.',
		contradiction:
			'She protects listener messages by carrying them personally and has become the single point of failure she distrusts.',
		longArc:
			'Converts suppressed listener caches into a consent-aware distributed archive and trains redundant couriers.',
	},
	{
		id: 'calder-raincheck',
		name: 'Calder Raincheck',
		alias: 'Mast Rigger of Bad Weather and Worse Funding',
		pronouns: 'they/he',
		homeLocationId: 'antenna-barrens:station',
		roles: ['technician', 'organizer', 'mentor'],
		services: ['repair-bench', 'transit-control'],
		visualHook:
			'Yellow climbing coat blackened by lightning, ceramic rigging hooks, weather vanes worn as skeptical jewelry.',
		voice:
			'Dry union-shop pragmatism with perfect pauses whenever management calls lightning an edge case.',
		contradiction:
			'He demands public maintenance records while hiding illegal shortcuts that kept the masts alive.',
		longArc:
			'Turns pirate improvisations into inspectable public practice without criminalizing the crews who invented them.',
	},
	{
		id: 'maceo-margin',
		name: 'Maceo Margin',
		alias: 'Former Confidence-Gate Operator',
		pronouns: 'he/they',
		homeLocationId: 'antenna-barrens:settlement',
		roles: ['technician', 'investigator', 'witness'],
		services: ['archive', 'signal-lab'],
		visualHook:
			'Faded forecast-enforcement coat cut into a sleeveless rigging vest, brass probability sliders, old pursuit headset rewired as a public listening loop.',
		voice:
			'Late-night jazz-program calm with precise percentages and sudden, unsparing admissions about what those percentages once authorized.',
		contradiction:
			'He wants every forecast challenged in public but still instinctively treats technical fluency as permission to control the room.',
		longArc:
			'Converts the confidence gate from a pursuit trigger into an appeal desk, trains rotating error-bar stewards, and learns that expertise must include a scheduled moment when somebody else may overrule it.',
	},
];

export const ANTENNA_BARRENS_CONVERSATIONS: readonly NpcConversationDef[] = [
	{
		id: 'null-dial:forecast-is-not-permission',
		npcId: 'reverend-null-dial',
		locationId: 'antenna-barrens:safehouse',
		priority: 180,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'null-dial-opened-public-frequency',
		startsQuestId: 'antenna-barrens:main-forecast-is-not-permission',
		startsQuestStepId: 'recover-the-listening-weather',
		speakerLine:
			'Vane taught the antennas to predict where poor people would move. Then he called the prediction a reason to put police there first.',
		mossLine: 'We publish how it works.',
		followupLine: 'And who it can hurt, who may object, and how to switch it off. A sermon without an exit is still an order.',
	},
	{
		id: 'penny:pirate-signal-cache',
		npcId: 'penny-static',
		locationId: 'antenna-barrens:station',
		priority: 150,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'penny-opened-listener-cache',
		startsQuestId: 'antenna-barrens:side-pirate-signal-cache',
		startsQuestStepId: 'recover-the-suppressed-messages',
		speakerLine:
			'Three thousand listeners sent warnings. The model kept the movement data and deleted the sentences.',
		mossLine: 'We restore them.',
		followupLine: 'With names only where the speaker chose a name. Archives can stalk too.',
	},
	{
		id: 'error-bar:missing-interval',
		npcId: 'doctor-error-bar',
		locationId: 'antenna-barrens:settlement',
		priority: 155,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'error-bar-opened-appeal-table',
		startsQuestId: 'antenna-barrens:side-error-bars-for-the-missing',
		startsQuestStepId: 'find-the-people-outside-the-model',
		speakerLine:
			'The forecast is ninety-two percent accurate. The other eight percent have names, injuries, and no office hours.',
		mossLine: 'Can the model include them?',
		followupLine: 'It can include uncertainty. People still need somewhere to appeal before the train leaves.',
	},
	{
		id: 'calder:weather-shift',
		npcId: 'calder-raincheck',
		locationId: 'antenna-barrens:station',
		priority: 145,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'calder-opened-mast-shift',
		startsQuestId: 'antenna-barrens:contract-mast-weather-shift',
		startsQuestStepId: 'ground-the-public-masts',
		speakerLine:
			'Lightning is not an edge case. It is management arriving without reading the maintenance log.',
		mossLine: 'What needs grounding?',
		followupLine: 'Four masts, two secrets, and my professional pride.',
	},
	{
		id: 'mara:public-threat-model',
		npcId: 'mara-modulo',
		locationId: 'antenna-barrens:settlement',
		priority: 190,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'mara-published-threat-model',
		speakerLine:
			'The forecast is public. So is the threat model, the uncertainty, and the list of things we deliberately refuse to expose.',
		mossLine: 'Still keeping secrets?',
		followupLine: 'Of course. The difference is the secret now has witnesses, expiry, and somebody authorized to destroy it.',
	},
	{
		id: 'maceo:percentage-with-boots',
		npcId: 'maceo-margin',
		locationId: 'antenna-barrens:settlement',
		priority: 168,
		phase: 'contested',
		trustDelta: 0,
		recordFlag: 'maceo-opened-gate-history',
		speakerLine:
			'I moved one slider from sixty-eight to seventy-one. Patrol doctrine supplied the boots. I supplied the respectable number they marched behind.',
		mossLine: 'What do you supply now?',
		followupLine: 'The source, the uncertainty, the appeal window—and my chair when the appeal says I am wrong.',
	},
	{
		id: 'maceo:public-error-bar-shift',
		npcId: 'maceo-margin',
		locationId: 'antenna-barrens:station',
		priority: 215,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'maceo-published-error-bar-rotation',
		speakerLine:
			'Forecast shift rotates every four hours. A listener may challenge the source, a medic may halt deployment, and nobody may convert confidence into pursuit.',
		mossLine: 'Including you?',
		followupLine: 'Especially me. I was excellent at making a maybe sound like a warrant.',
	},
];

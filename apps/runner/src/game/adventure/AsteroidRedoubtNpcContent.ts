import type { NpcConversationDef, NpcDef } from './NpcCatalog';

export const ASTEROID_REDOUBT_NPCS: readonly NpcDef[] = [
	{
		id: 'choir-of-static',
		name: 'The Choir of Static',
		alias: 'Many Voices, No Permanent Soloist',
		pronouns: 'they/them',
		homeLocationId: 'asteroid-redoubt:safehouse',
		roles: ['broadcaster', 'organizer', 'artist'],
		services: ['signal-lab', 'archive'],
		visualHook:
			'Rotating ring of masked transmitters, patched coats and antenna crowns, each voice entering on a different beat.',
		voice:
			'Layered call-and-response: gospel harmony, pirate radio, cipher, and maintenance notes sharing one sentence.',
		contradiction:
			'They reject permanent leadership while controlling who receives the final microphone and how long they may hold it.',
		longArc:
			'Builds a transmitter that can publish evidence, tools, or abolition without creating a new command center.',
	},
	{
		id: 'aunt-aster',
		name: 'Aunt Aster',
		alias: 'Root Mechanic of the Last Antenna',
		pronouns: 'she/her',
		homeLocationId: 'asteroid-redoubt:safehouse',
		roles: ['technician', 'mentor', 'organizer'],
		services: ['repair-bench', 'skill-mentor', 'loadout-locker'],
		visualHook:
			'Black work coat dusted with asteroid frost, transmitter-root tattoos, tool belt arranged like a brass section.',
		voice:
			'Gruff warmth and immaculate timing. Can insult a machine, repair it, and apologize in the same bar.',
		contradiction:
			'She wants reproducible public tools but keeps the final transmitter alive through undocumented intuition.',
		longArc:
			'Turns her private craft into teachable maintenance scores and refuses the role of irreplaceable elder.',
	},
	{
		id: 'witness-zero',
		name: 'Witness Zero',
		alias: 'Former First Customer of Skylock',
		pronouns: 'they/them',
		homeLocationId: 'asteroid-redoubt:settlement',
		roles: ['investigator', 'witness', 'organizer'],
		services: ['archive', 'legal-aid'],
		visualHook:
			'Plain charcoal suit with every corporate insignia removed, transparent gloves showing erased biometric contracts beneath the skin.',
		voice:
			'Controlled deposition rhythm with flashes of old sales charisma they no longer trust.',
		contradiction:
			'They know the founding evidence against Skylock and fear publishing it will make their complicity the center of the story.',
		longArc:
			'Helps separate testimony from heroism and preserves responsibility without manufacturing a saint.',
	},
	{
		id: 'return-signal-sam',
		name: 'Return-Signal Sam',
		alias: 'Dockmaster of Routes That Promise to Come Back',
		pronouns: 'he/they',
		homeLocationId: 'asteroid-redoubt:station',
		roles: ['courier', 'broadcaster', 'technician'],
		services: ['transit-control', 'signal-lab'],
		visualHook:
			'Long blue dock coat, flare pistol converted into a signal lamp, boots painted with city and colony platform numbers.',
		voice:
			'Patient late-night radio host. Leaves room in every sentence for a reply from very far away.',
		contradiction:
			'He promises every expedition a return route even when secrecy and safety require uncertainty.',
		longArc:
			'Maintains the final peer link among city, colony, and asteroid while teaching that connection is not a guarantee of access.',
	},
	{
		id: 'della-redact',
		name: 'Della Redact',
		alias: 'Former Skylock Censor, Refusal-Window Archivist',
		pronouns: 'she/they',
		homeLocationId: 'asteroid-redoubt:settlement',
		roles: ['broadcaster', 'investigator', 'witness'],
		services: ['archive', 'legal-aid', 'signal-lab'],
		visualHook:
			'Burgundy transmission coat lined with removable black bars, reel-to-reel scissors on a silver chain, one white glove reserved for protected omissions.',
		voice:
			'Smoky newsroom noir over clipped boom-bap rhythm. Names every deletion, including the deletions that may still be necessary.',
		contradiction:
			'She suppressed evidence for Skylock and also knows some identities, refuges, and refusal routes survive only when publication has limits.',
		longArc:
			'Builds a public refusal-window archive where omissions require reasons, witnesses, expiry, and appeal, while accepting that her expertise does not entitle her to decide which silence remains protective.',
	},
];

export const ASTEROID_REDOUBT_CONVERSATIONS: readonly NpcConversationDef[] = [
	{
		id: 'choir:last-lock-is-authorship',
		npcId: 'choir-of-static',
		locationId: 'asteroid-redoubt:safehouse',
		priority: 220,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'choir-opened-final-microphone',
		startsQuestId: 'asteroid-redoubt:main-last-lock-is-authorship',
		startsQuestStepId: 'assemble-the-public-transmitter',
		speakerLine:
			'The asteroid can speak once before Vane retakes the sky. He expects a command. We would rather send instructions for building another microphone.',
		mossLine: 'Who writes the message?',
		followupLine: 'Everybody who accepts that somebody else may revise it after transmission.',
	},
	{
		id: 'witness-zero:tools-not-heroes',
		npcId: 'witness-zero',
		locationId: 'asteroid-redoubt:settlement',
		priority: 175,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'witness-zero-opened-toolkit-case',
		startsQuestId: 'asteroid-redoubt:side-tools-not-heroes',
		startsQuestStepId: 'plant-the-public-toolkits',
		speakerLine:
			'I signed the first Skylock contract. Publishing my confession alone would make one sinner easier to remember than the machinery.',
		mossLine: 'Then publish the machinery.',
		followupLine: 'With tools for dismantling it. Shame without a wrench is another premium documentary.',
	},
	{
		id: 'little-ix:map-that-can-hide',
		npcId: 'little-ix',
		locationId: 'asteroid-redoubt:settlement',
		priority: 185,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'little-ix-opened-protected-map',
		startsQuestId: 'asteroid-redoubt:side-map-that-can-hide',
		startsQuestStepId: 'draw-the-route-with-a-blank',
		speakerLine:
			'Every place should be on the map. Except the places that die when everybody knows where they are. I hate exceptions.',
		mossLine: 'Make the exception visible without exposing the place.',
		followupLine: 'A blank with rules. That is still a kind of station.',
	},
	{
		id: 'aster:maintenance-score',
		npcId: 'aunt-aster',
		locationId: 'asteroid-redoubt:safehouse',
		priority: 165,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'aster-opened-root-score',
		startsQuestId: 'asteroid-redoubt:contract-return-signal-night-watch',
		startsQuestStepId: 'score-the-return-signal',
		speakerLine:
			'I can keep the transmitter alive by feel. That is a beautiful sentence and a terrible succession plan.',
		mossLine: 'Write the score.',
		followupLine: 'You write down jazz badly. Then the next player argues with the page and keeps the club open.',
	},
	{
		id: 'vane:competent-sky',
		npcId: 'director-vane',
		locationId: 'asteroid-redoubt:settlement',
		priority: 260,
		phase: 'contested',
		trustDelta: -3,
		recordFlag: 'vane-offered-competent-ownership',
		speakerLine:
			'Someone will own the sky, Moss. I merely propose somebody competent enough to regret the consequences professionally.',
		mossLine: 'You priced every future before anybody could choose it.',
		followupLine: 'Choice without underwriting is weather. People demand shelter, then resent the roof for having an owner.',
	},
	{
		id: 'sam:commons-return-signal',
		npcId: 'return-signal-sam',
		locationId: 'asteroid-redoubt:station',
		priority: 230,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'sam-published-peer-return-window',
		speakerLine:
			'City says ready. Colony says ready with revisions. Asteroid says ask again after maintenance. Best three green lights I ever saw.',
		mossLine: 'Where does the line end?',
		followupLine: 'Wherever somebody can still answer back.',
	},
	{
		id: 'della:deletion-with-a-payroll-number',
		npcId: 'della-redact',
		locationId: 'asteroid-redoubt:settlement',
		priority: 205,
		phase: 'contested',
		trustDelta: 0,
		recordFlag: 'della-opened-censorship-ledger',
		speakerLine:
			'I deleted witness names, strike routes, and proof of deletion. Skylock called all three privacy. My payroll called them Tuesday.',
		mossLine: 'What stays hidden now?',
		followupLine: 'Whatever the endangered person may withdraw—and nothing merely because power dislikes the sentence.',
	},
	{
		id: 'della:refusal-window-archive',
		npcId: 'della-redact',
		locationId: 'asteroid-redoubt:station',
		priority: 248,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'della-published-refusal-windows',
		speakerLine:
			'Every black bar now has a reason, witness, expiry, appeal path, and a blank space where the protected person may say no again.',
		mossLine: 'And your scissors?',
		followupLine: 'Checked out by shift. Sharp tools deserve library rules.',
	},
];

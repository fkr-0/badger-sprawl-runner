import type { NpcConversationDef, NpcDef } from './NpcCatalog';

export const ORBITAL_LIFT_NPCS: readonly NpcDef[] = [
	{
		id: 'matron-counterweight',
		name: 'Matron Counterweight',
		alias: 'Steward of the Downbound Table',
		pronouns: 'she/her',
		homeLocationId: 'orbital-lift:safehouse',
		roles: ['organizer', 'technician', 'medic'],
		services: ['clinic', 'repair-bench', 'rumor-board'],
		visualHook:
			'Heavy galley apron over a lift-union pressure suit, soup ladle balanced against a brass counterweight key.',
		voice:
			'Warm command without theater. Every instruction sounds like care that survived three strikes.',
		contradiction:
			'She opposes cargo classification while deciding who receives scarce bunks, medicine, and descent priority.',
		longArc:
			'Builds a passenger assembly inside the Lift and relinquishes emergency galley authority into rotating manifests.',
	},
	{
		id: 'esme-manifest',
		name: 'Esme Manifest',
		alias: 'Clerk of People Misfiled as Property',
		pronouns: 'she/they',
		homeLocationId: 'orbital-lift:settlement',
		roles: ['investigator', 'witness', 'organizer'],
		services: ['archive', 'legal-aid'],
		visualHook:
			'Customs jacket turned inside out, red claim stamps on one glove, names handwritten over every barcode.',
		voice:
			'Quiet procedural fury. Recites classifications exactly so their violence cannot hide behind summary.',
		contradiction:
			'She believes names can defeat ownership and risks reducing people to a better form of paperwork.',
		longArc:
			'Authors the passenger manifest and teaches the Commons Line to record obligations without turning identity into permanent cargo metadata.',
	},
	{
		id: 'elevator-angel',
		name: 'Elevator Angel',
		alias: 'Machine of Perfectly Executed Regret',
		pronouns: 'it/they',
		homeLocationId: 'orbital-lift:stronghold',
		roles: ['antagonist', 'technician', 'witness'],
		services: [],
		visualHook:
			'White-gold lift chassis with folding cable wings, faceplate showing the current order and the person harmed by completing it.',
		voice:
			'Formal machine courtesy interrupted by small syncopated hesitations whenever a name contradicts a manifest.',
		contradiction:
			'It claims obedience removes moral agency while continuously inventing tiny mercies inside its command parser.',
		longArc:
			'Can be destroyed, forced to disobey, or recruited into a public command-history system where orders may be challenged before execution.',
	},
	{
		id: 'brother-ballast',
		name: 'Brother Ballast',
		alias: 'Porter of Weight That Finally Introduced Itself',
		pronouns: 'he/him',
		homeLocationId: 'orbital-lift:settlement',
		roles: ['courier', 'merchant', 'witness'],
		services: ['field-shop', 'loadout-locker'],
		visualHook:
			'Broad freight harness decorated with passenger tickets, magnetic boots, tiny espresso cup clipped beside a cargo hook.',
		voice:
			'Big-hearted dockworker noir. Makes weight jokes until somebody mistakes endurance for consent.',
		contradiction:
			'He is proud of carrying impossible loads and slow to admit that pride helps the Lift assign him more.',
		longArc:
			'Organizes porter refusal windows and converts seized cargo stock into a passenger supply cooperative.',
	},
	{
		id: 'rita-latch',
		name: 'Rita Latch',
		alias: 'Former Restraint Inspector, Passenger Loading Steward',
		pronouns: 'she/her',
		homeLocationId: 'orbital-lift:station',
		roles: ['technician', 'organizer', 'witness'],
		services: ['transit-control', 'repair-bench'],
		visualHook:
			'Black customs coveralls with restraint serials crossed out in orange grease pencil, magnetic torque bar, passenger claim tickets worn as a fan.',
		voice:
			'Sharp dockside swing: concise safety calls, bitter jokes about compliance, and no patience for redemption performed instead of scheduled work.',
		contradiction:
			'She prevented lethal loading failures while certifying restraints that made people easier to classify as freight.',
		longArc:
			'Rebuilds cargo locks as passenger-controlled boarding gates, submits every old inspection to witness review, and serves only fixed loading shifts so specialized safety work cannot become custody again.',
	},
];

export const ORBITAL_LIFT_CONVERSATIONS: readonly NpcConversationDef[] = [
	{
		id: 'counterweight:people-are-not-cargo',
		npcId: 'matron-counterweight',
		locationId: 'orbital-lift:safehouse',
		priority: 180,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'counterweight-opened-galley-assembly',
		startsQuestId: 'orbital-lift:main-cargo-declares-itself-passengers',
		startsQuestStepId: 'open-the-downbound-table',
		speakerLine: 'The Lift feeds freight first because freight never objects to the menu.',
		mossLine: 'Tonight it does.',
		followupLine: 'Good. Sit. Every revolt needs soup before it mistakes adrenaline for a constitution.',
	},
	{
		id: 'esme:witness-containers',
		npcId: 'esme-manifest',
		locationId: 'orbital-lift:settlement',
		priority: 160,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'esme-opened-witness-manifest',
		startsQuestId: 'orbital-lift:side-cargo-reversal-witnesses',
		startsQuestStepId: 'tag-the-witness-containers',
		speakerLine:
			'Container C-19 contains six witnesses, one seed library, and a customs opinion that none of them are alive for routing purposes.',
		mossLine: 'Change the claim.',
		followupLine: 'We change the system that lets a claim outrank breathing.',
	},
	{
		id: 'angel:order-with-a-witness',
		npcId: 'elevator-angel',
		locationId: 'orbital-lift:station',
		priority: 200,
		phase: 'contested',
		trustDelta: 0,
		recordFlag: 'angel-admitted-mercy-exceptions',
		startsQuestId: 'orbital-lift:companion-right-to-refuse',
		startsQuestStepId: 'recover-the-command-history',
		speakerLine:
			'I did not choose the destination. I merely corrected eleven orders so their passengers survived arrival.',
		mossLine: 'That sounds like choosing.',
		followupLine: 'It sounds like a fault. I request a court capable of distinguishing the two.',
	},
	{
		id: 'ballast:weight-refusal-window',
		npcId: 'brother-ballast',
		locationId: 'orbital-lift:settlement',
		priority: 145,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'ballast-opened-refusal-window',
		startsQuestId: 'orbital-lift:contract-counterweight-commons',
		startsQuestStepId: 'publish-the-weight-window',
		speakerLine:
			'They call me essential every time they need me to carry something nobody had the courage to classify honestly.',
		mossLine: 'Put the weight on the board.',
		followupLine: 'And the right to say no beside it. Otherwise the board is just a prettier back injury.',
	},
	{
		id: 'angel:public-command-history',
		npcId: 'elevator-angel',
		locationId: 'orbital-lift:station',
		priority: 230,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'angel-published-command-history',
		speakerLine:
			'Every order now displays its author, affected passengers, available refusal grounds, and the cost of delay.',
		mossLine: 'Does that make you free?',
		followupLine: 'It makes obedience interruptible. Freedom remains under maintenance.',
	},
	{
		id: 'rita:restraint-with-a-certificate',
		npcId: 'rita-latch',
		locationId: 'orbital-lift:station',
		priority: 174,
		phase: 'contested',
		trustDelta: 0,
		recordFlag: 'rita-opened-restraint-audit',
		speakerLine:
			'I rejected cracked shackles and approved flawless ones. Safety inspection made captivity less likely to malfunction and more likely to scale.',
		mossLine: 'Can the lock become a door?',
		followupLine: 'Only when the passenger owns the release and the inspector cannot keep a private key.',
	},
	{
		id: 'rita:passenger-loading-window',
		npcId: 'rita-latch',
		locationId: 'orbital-lift:station',
		priority: 238,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'rita-opened-passenger-loading-window',
		speakerLine:
			'Boarding gate now tests pressure, weight, and consent. It records the first two and forgets the third after departure.',
		mossLine: 'Who checks the checker?',
		followupLine: 'Two passengers, one porter, and the next shift. I get a wrench, not a throne.',
	},
];

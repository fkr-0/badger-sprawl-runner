import type { QuestDef } from './QuestCatalog';

export const ASTEROID_REDOUBT_QUESTS: readonly QuestDef[] = [
	{
		id: 'asteroid-redoubt:main-last-lock-is-authorship',
		title: 'The Last Lock Is Authorship',
		districtId: 'asteroid-redoubt',
		kind: 'main',
		giverNpcId: 'choir-of-static',
		description:
			'Assemble a public transmitter, preserve protected blanks, defeat Director Vane, and make the final doctrine reproducible rather than centrally inherited.',
		theme: 'A liberation message fails when its audience can only obey, admire, or wait for the next hero.',
		entryStepId: 'assemble-the-public-transmitter',
		steps: [
			{
				id: 'assemble-the-public-transmitter',
				placard: 'THE MICROPHONE IS ALSO A ROUTE, A LOCK, AND A SUCCESSION PROBLEM.',
				summary: 'Assemble evidence, toolkits, maintenance scores, and receiving-station checksums.',
				objectives: [
					{
						id: 'transmitter-root-components',
						label: 'Assemble transmitter-root components',
						target: 4,
						locationId: 'asteroid-redoubt:safehouse',
						resolutionTags: ['repair', 'archive', 'hacking'],
					},
				],
				nextStepId: 'mirror-the-public-tools',
			},
			{
				id: 'mirror-the-public-tools',
				placard: 'A MESSAGE ABOUT FREEDOM SHOULD INCLUDE THE WRENCH.',
				summary: 'Plant public toolkits and verify mirrors across city, colony, and asteroid.',
				objectives: [
					{
						id: 'verified-toolkit-mirrors',
						label: 'Verify public toolkit mirrors',
						target: 3,
						locationId: 'asteroid-redoubt:station',
						resolutionTags: ['exploration', 'hacking', 'transit'],
					},
				],
				nextStepId: 'break-competent-ownership',
			},
			{
				id: 'break-competent-ownership',
				placard: 'COMPETENCE WITHOUT REVISION IS OWNERSHIP WITH BETTER POSTURE.',
				summary: 'Defeat Director Vane and prevent Skylock from becoming a more tasteful command center.',
				objectives: [
					{
						id: 'vane-authorship-defeated',
						label: 'Defeat Vane’s claim to competent ownership',
						target: 1,
						locationId: 'asteroid-redoubt:stronghold',
						resolutionTags: ['combat', 'hacking', 'social', 'full-kit'],
					},
				],
				nextStepId: 'publish-a-revisable-doctrine',
			},
			{
				id: 'publish-a-revisable-doctrine',
				placard: 'THE FINAL WORD MUST INCLUDE HOW TO CORRECT IT.',
				summary: 'Publish the chosen doctrine with local copies, revision history, refusal, and no permanent master key.',
				objectives: [
					{
						id: 'revisable-final-broadcast',
						label: 'Complete the revisable final broadcast',
						target: 1,
						locationId: 'asteroid-redoubt:settlement',
						resolutionTags: ['social', 'signal', 'governance'],
					},
				],
			},
		],
		approaches: {
			claw: 'Hold the transmitter root while crews mirror tools and evidence.',
			ballistics: 'Break satellite locks without destroying receiving infrastructure.',
			ghoststep: 'Plant toolkits and protected-route rules before Skylock closes the dock.',
			hacking: 'Remove master authorship and distribute revision authority.',
			social: 'Frame abolition, stewardship, or tools as revisable doctrine rather than command.',
			repair: 'Keep the transmitter alive while turning private craft into a public score.',
			exploration: 'Recover local copies and protected blanks across the Redoubt.',
		},
		consequences: [
			{
				id: 'commons-transmitter-ready',
				label: 'The final transmitter distributes evidence, tools, revision, and refusal without a permanent center.',
				worldFlags: [
					'asteroid-redoubt:commons-transmitter',
					'asteroid-redoubt:toolkit-mirrors',
					'main:commons-line',
				],
				serviceUpgrades: [
					{ locationId: 'asteroid-redoubt:safehouse', serviceId: 'signal-lab', level: 1 },
					{ locationId: 'asteroid-redoubt:settlement', serviceId: 'archive', level: 1 },
					{ locationId: 'asteroid-redoubt:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'choir-of-static', locationId: 'asteroid-redoubt:station' },
					{ npcId: 'little-ix', locationId: 'asteroid-redoubt:settlement' },
					{ npcId: 'return-signal-sam', locationId: 'asteroid-redoubt:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'asteroid-redoubt:side-tools-not-heroes',
		title: 'Tools, Not Heroes',
		districtId: 'asteroid-redoubt',
		kind: 'side',
		giverNpcId: 'witness-zero',
		description:
			'Plant public dismantling toolkits before the final broadcast so listeners receive methods, not only a dramatic victory.',
		theme: 'Testimony becomes political when somebody else can reproduce the change without inheriting the witness as leader.',
		entryStepId: 'plant-the-public-toolkits',
		steps: [
			{
				id: 'plant-the-public-toolkits',
				placard: 'SHAME WITHOUT A WRENCH IS ANOTHER PREMIUM DOCUMENTARY.',
				summary: 'Plant three public toolkits across the Redoubt.',
				objectives: [
					{
						id: 'planted-public-toolkits',
						label: 'Plant public toolkits',
						target: 3,
						locationId: 'asteroid-redoubt:route',
						resolutionTags: ['exploration', 'stealth', 'repair'],
					},
				],
				nextStepId: 'verify-the-receiving-mirrors',
			},
			{
				id: 'verify-the-receiving-mirrors',
				placard: 'A TOOL THAT EXISTS ONLY AT HEADQUARTERS IS A TOUR.',
				summary: 'Verify city, colony, and asteroid toolkit mirrors.',
				objectives: [
					{
						id: 'toolkit-receiving-checksums',
						label: 'Verify toolkit receiving checksums',
						target: 3,
						locationId: 'asteroid-redoubt:station',
						resolutionTags: ['hacking', 'signal', 'transit'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Plant toolkits without turning their recipients into target lists.',
			hacking: 'Verify local copies without creating one authoritative server.',
			repair: 'Package tools with maintenance and failure instructions.',
			exploration: 'Find receiving stations outside Vane’s official network.',
		},
		consequences: [
			{
				id: 'distributed-public-toolkits',
				label: 'Dismantling tools and maintenance knowledge survive beyond the final transmitter.',
				worldFlags: ['asteroid-redoubt:public-toolkits-distributed'],
				serviceUpgrades: [{ locationId: 'asteroid-redoubt:safehouse', serviceId: 'repair-bench', level: 1 }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'asteroid-redoubt:side-map-that-can-hide',
		title: 'The Map That Can Hide',
		districtId: 'asteroid-redoubt',
		kind: 'side',
		giverNpcId: 'little-ix',
		description:
			'Create a public route map that proves protected places exist without revealing coordinates that would destroy them.',
		theme: 'Absence can be accountable when the blank itself has visible rules, witnesses, and expiry.',
		entryStepId: 'draw-the-route-with-a-blank',
		steps: [
			{
				id: 'draw-the-route-with-a-blank',
				placard: 'NOT ON THE MAP IS NOT THE SAME AS NOT REAL.',
				summary: 'Mark protected routes as visible blanks with disclosure rules.',
				objectives: [
					{
						id: 'protected-route-blanks',
						label: 'Author protected-route blanks',
						target: 3,
						locationId: 'asteroid-redoubt:settlement',
						resolutionTags: ['archive', 'social', 'privacy'],
					},
				],
				nextStepId: 'test-the-disclosure-rule',
			},
			{
				id: 'test-the-disclosure-rule',
				placard: 'A SECRET WITH NO WITNESSES BECOMES PROPERTY. A MAP WITH NO BLANKS BECOMES A WEAPON.',
				summary: 'Test disclosure, refusal, emergency access, and expiry against hostile queries.',
				objectives: [
					{
						id: 'protected-map-tests',
						label: 'Pass protected-map tests',
						target: 4,
						locationId: 'asteroid-redoubt:station',
						resolutionTags: ['hacking', 'social', 'threat-model'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Prove the blank resists hostile joins and inference.',
			social: 'Define who may disclose, refuse, revise, and destroy the protected record.',
			exploration: 'Find routes whose survival depends on accountable absence.',
		},
		consequences: [
			{
				id: 'accountable-protected-map',
				label: 'The Commons Line map can represent protected places without universal exposure.',
				worldFlags: ['asteroid-redoubt:protected-map-public'],
				serviceUpgrades: [{ locationId: 'asteroid-redoubt:settlement', serviceId: 'archive', level: 1 }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'asteroid-redoubt:contract-return-signal-night-watch',
		title: 'Return Signal Night Watch',
		districtId: 'asteroid-redoubt',
		kind: 'contract',
		giverNpcId: 'aunt-aster',
		description:
			'Turn Aster’s intuitive transmitter maintenance into a score three crews can revise under live signal weather.',
		theme: 'A commons fails when its most trusted maintainer cannot be replaced.',
		entryStepId: 'score-the-return-signal',
		steps: [
			{
				id: 'score-the-return-signal',
				placard: 'IRREPLACEABLE IS A COMPLIMENT WITH A DEADLINE.',
				summary: 'Write, perform, and revise four return-signal maintenance movements.',
				objectives: [
					{
						id: 'return-signal-score-movements',
						label: 'Complete return-signal score movements',
						target: 4,
						locationId: 'asteroid-redoubt:station',
						resolutionTags: ['repair', 'timing', 'social'],
					},
				],
			},
		],
		approaches: {
			repair: 'Translate transmitter feel into inspectable procedures and failure cues.',
			social: 'Let replacement crews revise the score while Aster is present to disagree.',
			exploration: 'Find undocumented root behavior across the old Redoubt maintenance path.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
];

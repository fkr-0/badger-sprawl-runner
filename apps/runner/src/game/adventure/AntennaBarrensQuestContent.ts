import type { QuestDef } from './QuestCatalog';

export const ANTENNA_BARRENS_QUESTS: readonly QuestDef[] = [
	{
		id: 'antenna-barrens:main-forecast-is-not-permission',
		title: 'The Forecast Is Not Permission',
		districtId: 'antenna-barrens',
		kind: 'main',
		giverNpcId: 'reverend-null-dial',
		description:
			'Turn Vane’s movement-prediction machinery into a contestable public forecast without publishing protected routes or mistaking prediction for consent.',
		theme: 'A prediction may inform action only when its assumptions, uncertainty, appeals, and refusal paths remain visible.',
		entryStepId: 'recover-the-listening-weather',
		steps: [
			{
				id: 'recover-the-listening-weather',
				placard: 'THE MODEL KEPT THE MOVEMENT AND DELETED THE SENTENCE.',
				summary: 'Recover suppressed listener messages with chosen audience and identity protection.',
				objectives: [
					{
						id: 'consented-listener-caches',
						label: 'Recover consented listener caches',
						target: 3,
						locationId: 'antenna-barrens:station',
						resolutionTags: ['exploration', 'hacking', 'social'],
					},
				],
				nextStepId: 'publish-the-assumptions',
			},
			{
				id: 'publish-the-assumptions',
				placard: 'CONFIDENCE WITHOUT A METHOD IS JUST AUTHORITY IN DECIMAL CLOTHES.',
				summary: 'Repair the code gates and publish training sources, error history, and protected omissions.',
				objectives: [
					{
						id: 'public-code-gates',
						label: 'Repair and publish ledger code gates',
						target: 5,
						locationId: 'antenna-barrens:route',
						resolutionTags: ['hacking', 'repair', 'archive'],
					},
				],
				nextStepId: 'separate-prediction-from-consent',
			},
			{
				id: 'separate-prediction-from-consent',
				placard: 'EXPECTED IS NOT AUTHORED.',
				summary: 'Defeat, free, or constrain the Black-Ice Fox without accepting its forecast as permission.',
				objectives: [
					{
						id: 'fox-consent-doctrine',
						label: 'Resolve the Black-Ice Fox doctrine',
						target: 1,
						locationId: 'antenna-barrens:stronghold',
						resolutionTags: ['combat', 'hacking', 'social', 'nonlethal'],
					},
				],
				nextStepId: 'adopt-the-public-forecast',
			},
			{
				id: 'adopt-the-public-forecast',
				placard: 'THE NUMBER MUST SHOW WHO OBJECTED BEFORE IT MOVES THE TRAIN.',
				summary: 'Adopt public assumptions, confidence, protected exceptions, correction, delay, and appeal.',
				objectives: [
					{
						id: 'forecast-appeal-charter',
						label: 'Adopt the forecast appeal charter',
						target: 1,
						locationId: 'antenna-barrens:settlement',
						resolutionTags: ['social', 'archive', 'governance'],
					},
				],
			},
		],
		approaches: {
			claw: 'Protect mast and archive crews while the forecast network loses coercive control.',
			ballistics: 'Break enforcement optics without destroying public signal infrastructure.',
			ghoststep: 'Recover listener caches before the model joins them to identity.',
			hacking: 'Expose assumptions, source joins, confidence, and override logic.',
			social: 'Build correction and appeal before publication makes the model authoritative again.',
			repair: 'Ground public masts and prove the forecast against observed arrivals.',
			exploration: 'Find the people and messages the training corpus classified as noise.',
		},
		consequences: [
			{
				id: 'contestable-public-forecast',
				label: 'Prediction becomes public advice with visible uncertainty and interruption rather than automated permission.',
				worldFlags: [
					'antenna-barrens:public-forecast',
					'antenna-barrens:appeals-open',
					'main:forecast-public',
				],
				serviceUpgrades: [
					{ locationId: 'antenna-barrens:settlement', serviceId: 'legal-aid', level: 1 },
					{ locationId: 'antenna-barrens:station', serviceId: 'signal-lab', level: 1 },
					{ locationId: 'antenna-barrens:station', serviceId: 'transit-control', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'black-ice-fox', locationId: 'antenna-barrens:station' },
					{ npcId: 'mara-modulo', locationId: 'antenna-barrens:settlement' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'antenna-barrens:side-pirate-signal-cache',
		title: 'Pirate Signal Cache',
		districtId: 'antenna-barrens',
		kind: 'side',
		giverNpcId: 'penny-static',
		description:
			'Recover listener warnings the model mined for movement data and then discarded as inconvenient speech.',
		theme: 'Recovery is not publication; the speaker still chooses audience, identity, expiry, and withdrawal.',
		entryStepId: 'recover-the-suppressed-messages',
		steps: [
			{
				id: 'recover-the-suppressed-messages',
				placard: 'THE DATABASE REMEMBERED WHERE YOU RAN AND FORGOT WHY.',
				summary: 'Recover three suppressed listener caches.',
				objectives: [
					{
						id: 'suppressed-message-caches',
						label: 'Recover suppressed message caches',
						target: 3,
						locationId: 'antenna-barrens:route',
						resolutionTags: ['exploration', 'hacking', 'stealth'],
					},
				],
				nextStepId: 'assign-audience-and-expiry',
			},
			{
				id: 'assign-audience-and-expiry',
				placard: 'A VOICE IS NOT PUBLIC PROPERTY BECAUSE POWER TRIED TO DELETE IT.',
				summary: 'Record audience, identity protection, expiry, and withdrawal for every recovered cache.',
				objectives: [
					{
						id: 'listener-consent-records',
						label: 'Complete listener consent records',
						target: 3,
						locationId: 'antenna-barrens:settlement',
						resolutionTags: ['social', 'archive', 'privacy'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Recover caches before enforcement can join them to surviving listeners.',
			hacking: 'Separate message content from movement and identity metadata.',
			social: 'Let each listener choose whether the recovered warning may travel.',
			exploration: 'Trace messages through dead dishes and unofficial relay paths.',
		},
		consequences: [
			{
				id: 'consent-aware-listener-archive',
				label: 'The listener archive becomes distributed, withdrawable, and resistant to identity joins.',
				worldFlags: ['antenna-barrens:listener-cache-public'],
				serviceUpgrades: [{ locationId: 'antenna-barrens:station', serviceId: 'archive', level: 1 }],
				npcRelocations: [{ npcId: 'penny-static', locationId: 'antenna-barrens:station' }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'antenna-barrens:side-error-bars-for-the-missing',
		title: 'Error Bars for the Missing',
		districtId: 'antenna-barrens',
		kind: 'side',
		giverNpcId: 'doctor-error-bar',
		description:
			'Find people repeatedly omitted by the route model and create an appeal that can delay automation before harm occurs.',
		theme: 'Uncertainty matters only when the people inside it gain time and standing to object.',
		entryStepId: 'find-the-people-outside-the-model',
		steps: [
			{
				id: 'find-the-people-outside-the-model',
				placard: 'THE OTHER EIGHT PERCENT HAVE NAMES.',
				summary: 'Document forecast harms without converting survivors into new training subjects.',
				objectives: [
					{
						id: 'protected-forecast-harm-cases',
						label: 'Document protected forecast-harm cases',
						target: 4,
						locationId: 'antenna-barrens:settlement',
						resolutionTags: ['social', 'clinic', 'archive'],
					},
				],
				nextStepId: 'build-the-delay-button',
			},
			{
				id: 'build-the-delay-button',
				placard: 'AN APPEAL THAT ARRIVES AFTER THE TRAIN IS A EULOGY.',
				summary: 'Create a human appeal that pauses automated route and enforcement changes.',
				objectives: [
					{
						id: 'appeal-delay-port',
						label: 'Install the forecast appeal delay port',
						target: 1,
						locationId: 'antenna-barrens:station',
						resolutionTags: ['repair', 'hacking', 'legal'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Interrupt automated priority while an appeal is active.',
			social: 'Establish standing for people the forecast repeatedly treats as noise.',
			repair: 'Install a physical delay path independent of the prediction service.',
		},
		consequences: [
			{
				id: 'pre-harm-forecast-appeals',
				label: 'Forecast appeals can pause automation before punishment or route exclusion occurs.',
				worldFlags: ['antenna-barrens:pre-harm-appeals'],
				serviceUpgrades: [{ locationId: 'antenna-barrens:settlement', serviceId: 'legal-aid', level: 1 }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'antenna-barrens:contract-mast-weather-shift',
		title: 'Mast Weather Shift',
		districtId: 'antenna-barrens',
		kind: 'contract',
		giverNpcId: 'calder-raincheck',
		description:
			'Ground public masts through a charged weather window and document the illegal shortcuts that kept them alive.',
		theme: 'Improvisation becomes public infrastructure only when its risk and maintenance debt can be inherited.',
		entryStepId: 'ground-the-public-masts',
		steps: [
			{
				id: 'ground-the-public-masts',
				placard: 'LIGHTNING IS NOT AN EDGE CASE.',
				summary: 'Ground four masts and publish each emergency shortcut with expiry.',
				objectives: [
					{
						id: 'grounded-public-masts',
						label: 'Ground and document public masts',
						target: 4,
						locationId: 'antenna-barrens:route',
						resolutionTags: ['repair', 'timing', 'exploration'],
					},
				],
			},
		],
		approaches: {
			repair: 'Align grounding, batteries, and emergency bypasses under live weather.',
			exploration: 'Reach old mast roots omitted from the current maintenance map.',
			ghoststep: 'Cross exposed rigging between strike windows.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
];

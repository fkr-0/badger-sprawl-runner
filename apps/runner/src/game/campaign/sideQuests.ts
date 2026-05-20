import type { SideQuest } from './schema';

export const CAMPAIGN_SIDE_QUESTS: Record<string, SideQuest[]> = {
	'lower-sprawl': [
		{
			id: 'meter-maidens-ledger',
			title: 'Meter Maidens Ledger',
			giver: 'Auntie Subharmonic',
			objective: 'Photograph three street toll meters before the captain resets them.',
			reward: 'dubFavor+1 and a safer route rumor',
			stageHook: 'street toll gates',
		},
	],
	drainmarket: [
		{
			id: 'clinic-without-cameras',
			title: 'Clinic Without Cameras',
			giver: 'Murr Murrby',
			objective: 'Deliver stim invoices to the mutual-aid clinic without triggering knife drones.',
			reward: 'discounted consumables after the next shop visit',
			stageHook: 'injury-priced stim stalls',
		},
	],
	'chrome-arcology': [
		{
			id: 'cargo-name-tags',
			title: 'Cargo Name Tags',
			giver: 'Naya Root',
			objective: 'Scan hidden labor-floor cargo tags behind luxury glass.',
			reward: 'blueprint clue for elevator routing',
			stageHook: 'labor-floor cargo tags',
		},
	],
	'mirror-palace': [
		{
			id: 'table-of-refusals',
			title: 'Table of Refusals',
			giver: 'Lio',
			objective: 'Find three guests who refused debt contracts and survived the banquet.',
			reward: 'Lio trust branch context',
			stageHook: 'banquet etiquette',
		},
	],
	'dub-colony': [
		{
			id: 'chorus-spare-parts',
			title: 'Chorus Spare Parts',
			giver: 'Naya Root',
			objective: 'Recover bass reactor parts without silencing the colony chorus.',
			reward: 'dubFavor+1 and stronger assist timing',
			stageHook: 'bass reactor sync',
		},
	],
	'antenna-barrens': [
		{
			id: 'pirate-signal-cache',
			title: 'Pirate Signal Cache',
			giver: 'Rook Null',
			objective: 'Solve optional code gates to retrieve suppressed listener messages.',
			reward: 'ledger shard checksum shortcut',
			stageHook: 'ledger-codegate-surge',
		},
	],
	'orbital-lift': [
		{
			id: 'cargo-reversal-witnesses',
			title: 'Cargo Reversal Witnesses',
			giver: 'Sister Version',
			objective: 'Tag three witness containers before the lift classifies them as freight.',
			reward: 'cargo reversal choice context',
			stageHook: 'obedient cargo manifests',
		},
	],
	'asteroid-redoubt': [
		{
			id: 'tools-not-heroes',
			title: 'Tools, Not Heroes',
			giver: 'The Choir of Static',
			objective: 'Plant public toolkits before triggering the final broadcast.',
			reward: 'final broadcast doctrine context',
			stageHook: 'transmitter root',
		},
	],
};

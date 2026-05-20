import type { StoryProgress } from './GameFlow';

export type EndingDoctrine = 'abolish-skylock' | 'chorus-control' | 'publish-tools';

export interface EndingCard {
	doctrine: EndingDoctrine;
	title: string;
	subtitle: string;
	body: string;
	closingLine: string;
	resultFlag: string;
}

const ENDING_CARDS: Record<EndingDoctrine, EndingCard> = {
	'abolish-skylock': {
		doctrine: 'abolish-skylock',
		title: 'Abolish Skylock',
		subtitle: 'No one owns the route again.',
		body: 'Moss tears out the command lock instead of taking its chair. The city keeps its scars, but the crossings belong to everybody who can still sing through them.',
		closingLine: 'The sprawl does not become safe. It becomes shared.',
		resultFlag: 'broadcast_abolish_skylock',
	},
	'chorus-control': {
		doctrine: 'chorus-control',
		title: 'Chorus Control',
		subtitle: 'The system survives while the choir watches it.',
		body: 'Moss leaves the transmitter standing but makes every lever public. Power stays dangerous, so the colony learns to count hands before it lets anyone pull one.',
		closingLine: 'The sprawl becomes a song with witnesses.',
		resultFlag: 'broadcast_chorus_control',
	},
	'publish-tools': {
		doctrine: 'publish-tools',
		title: 'Publish the Tools',
		subtitle: 'Every kid gets the manual, not just the myth.',
		body: 'Moss broadcasts the exploit kit, the route maps, and the receipts. The bosses call it vandalism. The pipe kids call it homework.',
		closingLine: 'The sprawl becomes teachable.',
		resultFlag: 'broadcast_publish_tools',
	},
};

export function buildEndingCard(progress: StoryProgress): EndingCard | null {
	const doctrine = progress.finalBroadcastDoctrine;
	if (!progress.campaignComplete || !isEndingDoctrine(doctrine)) return null;
	return { ...ENDING_CARDS[doctrine] };
}

export function getEndingCards(): EndingCard[] {
	return Object.values(ENDING_CARDS).map((card) => ({ ...card }));
}

function isEndingDoctrine(value: unknown): value is EndingDoctrine {
	return value === 'abolish-skylock' || value === 'chorus-control' || value === 'publish-tools';
}

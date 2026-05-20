import { describe, expect, it } from 'vitest';
import { buildEndingCard, getEndingCards } from './EndingCards';
import { createDefaultStoryProgress } from './StoryProgressMigration';

describe('EndingCards', () => {
	it('returns null until the campaign is complete', () => {
		expect(
			buildEndingCard({
				...createDefaultStoryProgress(),
				finalBroadcastDoctrine: 'publish-tools',
			})
		).toBeNull();
	});

	it('builds the publish-tools ending card from completed story progress', () => {
		const card = buildEndingCard({
			...createDefaultStoryProgress(),
			campaignComplete: true,
			finalBroadcastDoctrine: 'publish-tools',
		});
		expect(card).toMatchObject({
			doctrine: 'publish-tools',
			title: 'Publish the Tools',
			resultFlag: 'broadcast_publish_tools',
		});
		expect(card?.body).toContain('exploit kit');
	});

	it('defines one card for every final broadcast doctrine', () => {
		expect(getEndingCards().map((card) => card.doctrine).sort()).toEqual([
			'abolish-skylock',
			'chorus-control',
			'publish-tools',
		]);
	});
});

import { describe, expect, it } from 'vitest';
import { buildStoryProgressSummary, formatStoryProgressSummary } from './StoryProgressSummary';

const baseProgress = {
	currentStageId: 'lower-sprawl',
	completedStageIds: [],
	completedChapterIds: [],
	acquiredPayloads: [],
	resultFlags: [],
	campaignComplete: false,
};

describe('buildStoryProgressSummary', () => {
	it('labels untouched campaign progress as New Story', () => {
		const summary = buildStoryProgressSummary(baseProgress);
		expect(summary).toMatchObject({
			ctaLabel: 'New Story',
			currentChapter: 'Chapter 1: Lower Sprawl',
			completedChapters: 0,
			completedStages: 0,
			finalBroadcastDoctrine: 'Undecided',
		});
	});

	it('labels mid-campaign stage progress as Continue even before completed stages are recorded', () => {
		const summary = buildStoryProgressSummary({
			...baseProgress,
			currentStageId: 'mirror-palace',
		});
		expect(summary.ctaLabel).toBe('Continue');
		expect(summary.currentChapter).toBe('Chapter 4: Mirror Palace');
		expect(summary.completedStages).toBe(0);
	});

	it('labels partial campaign progress as Continue', () => {
		const summary = buildStoryProgressSummary({
			...baseProgress,
			currentStageId: 'mirror-palace',
			completedStageIds: ['lower-sprawl', 'drainmarket'],
			completedChapterIds: ['ch01', 'ch02'],
		});
		expect(summary.ctaLabel).toBe('Continue');
		expect(summary.currentChapter).toBe('Chapter 4: Mirror Palace');
		expect(summary.completedChapters).toBe(2);
		expect(summary.completedStages).toBe(2);
	});

	it('surfaces campaign complete doctrine labels', () => {
		const summary = buildStoryProgressSummary({
			...baseProgress,
			campaignComplete: true,
			finalBroadcastDoctrine: 'publish-tools',
		});
		expect(summary.ctaLabel).toBe('Campaign Complete');
		expect(summary.finalBroadcastDoctrine).toBe('Publish Tools');
		expect(summary.completedStages).toBe(8);
		expect(summary.currentStageName).toBe('Final Broadcast');
	});

	it('orders and filters completed stages through the runtime graph', () => {
		const summary = buildStoryProgressSummary({
			...baseProgress,
			currentStageId: 'mirror-palace',
			completedStageIds: ['drainmarket', 'unknown-stage', 'lower-sprawl'],
		});
		expect(summary).toMatchObject({
			currentStageName: 'Treason at the Mirror Banquet',
			completedStages: 2,
			totalStages: 8,
		});
	});

	it('formats menu display lines', () => {
		const lines = formatStoryProgressSummary(buildStoryProgressSummary(baseProgress));
		expect(lines).toEqual(
			expect.arrayContaining([
				'New Story',
				'Chapter 1: Lower Sprawl',
				'Current: The Song of the Toll',
				'Final doctrine: Undecided',
			])
		);
	});
});

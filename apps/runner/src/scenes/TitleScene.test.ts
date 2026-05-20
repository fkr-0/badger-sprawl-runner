import { describe, expect, it, vi } from 'vitest';
import type { StoryProgress } from '../game/GameFlow';
import { TitleScene } from './TitleScene';

function storyProgress(overrides: Partial<StoryProgress> = {}): StoryProgress {
	return {
		currentStageId: 'lower-sprawl',
		completedStageIds: [],
		completedChapterIds: [],
		acquiredPayloads: [],
		resultFlags: [],
		campaignComplete: false,
		...overrides,
	};
}

describe('TitleScene story progress summary', () => {
	it('returns null when no story progress is provided', () => {
		expect(new TitleScene().getStoryProgressSummary()).toBeNull();
	});

	it('surfaces current chapter and Continue CTA from progress', () => {
		const scene = new TitleScene({
			storyProgress: storyProgress({
				currentStageId: 'mirror-palace',
				completedStageIds: ['lower-sprawl'],
				completedChapterIds: ['ch01'],
			}),
		});
		expect(scene.getStoryProgressSummary()).toMatchObject({
			ctaLabel: 'Continue',
			currentChapter: 'Chapter 4: Mirror Palace',
			completedChapters: 1,
			completedStages: 1,
		});
	});

	it('emits a title progress summary event on enter', () => {
		const scene = new TitleScene({
			storyProgress: storyProgress({ campaignComplete: true, finalBroadcastDoctrine: 'publish-tools' }),
		});
		const events: unknown[] = [];
		window.addEventListener('badger:title-progress-summary', (event) => events.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });
		scene.onExit();
		expect(events[0]).toMatchObject({
			ctaLabel: 'Campaign Complete',
			finalBroadcastDoctrine: 'Publish Tools',
		});
	});

	it('emits an ending card event when campaign-complete progress has a final doctrine', () => {
		const scene = new TitleScene({
			storyProgress: storyProgress({ campaignComplete: true, finalBroadcastDoctrine: 'publish-tools' }),
		});
		const events: unknown[] = [];
		window.addEventListener('badger:ending-card', (event) => events.push((event as CustomEvent).detail), {
			once: true,
		});
		scene.onEnter({ eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, canvas: document.createElement('canvas') });
		scene.onExit();
		expect(scene.getEndingCard()).toMatchObject({
			doctrine: 'publish-tools',
			title: 'Publish the Tools',
			resultFlag: 'broadcast_publish_tools',
		});
		expect(events[0]).toMatchObject({ title: 'Publish the Tools' });
	});

});

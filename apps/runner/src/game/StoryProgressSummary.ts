import { CAMPAIGN } from './Campaign';
import type { StoryProgress } from './GameFlow';

export type StoryCtaLabel = 'New Story' | 'Continue' | 'Campaign Complete';

export interface StoryProgressSummary {
	ctaLabel: StoryCtaLabel;
	currentChapter: string;
	currentStageName: string;
	completedChapters: number;
	totalChapters: number;
	completedStages: number;
	totalStages: number;
	campaignComplete: boolean;
	finalBroadcastDoctrine: string;
}

const FINAL_DOCTRINE_LABELS: Record<string, string> = {
	'abolish-skylock': 'Abolish Skylock',
	'chorus-control': 'Chorus Control',
	'publish-tools': 'Publish Tools',
};

export function buildStoryProgressSummary(progress: StoryProgress): StoryProgressSummary {
	const currentStage =
		CAMPAIGN.stages.find((stage) => stage.id === progress.currentStageId) ?? CAMPAIGN.stages[0];
	const totalChapters = new Set(CAMPAIGN.stages.map((stage) => stage.chapter)).size;
	const completedChapters = progress.completedChapterIds.length;
	const completedStages = progress.completedStageIds.length;
	const campaignComplete = progress.campaignComplete;
	const firstStageId = CAMPAIGN.stages[0]?.id ?? 'lower-sprawl';
	const hasStartedStory = completedStages > 0 || progress.currentStageId !== firstStageId;
	return {
		ctaLabel: campaignComplete ? 'Campaign Complete' : hasStartedStory ? 'Continue' : 'New Story',
		currentChapter: currentStage
			? `Chapter ${currentStage.chapter}: ${currentStage.place}`
			: 'Chapter 1: Lower Sprawl',
		currentStageName: currentStage?.name ?? 'Lower Sprawl',
		completedChapters,
		totalChapters,
		completedStages,
		totalStages: CAMPAIGN.stages.length,
		campaignComplete,
		finalBroadcastDoctrine: progress.finalBroadcastDoctrine
			? FINAL_DOCTRINE_LABELS[progress.finalBroadcastDoctrine] ?? progress.finalBroadcastDoctrine
			: 'Undecided',
	};
}

export function formatStoryProgressSummary(summary: StoryProgressSummary): string[] {
	return [
		summary.ctaLabel,
		summary.currentChapter,
		`Current: ${summary.currentStageName}`,
		`Completed: ${summary.completedChapters}/${summary.totalChapters} chapters • ${summary.completedStages}/${summary.totalStages} stages`,
		`Final doctrine: ${summary.finalBroadcastDoctrine}`,
	];
}

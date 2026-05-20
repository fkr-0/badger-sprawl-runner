import type {
	ColonyAlignmentBranch,
	FinalBroadcastBranch,
	LioTrustBranch,
	StoryProgress,
} from './GameFlow';

export const STORY_PROGRESS_SCHEMA_VERSION = 2 as const;

export type StoryProgressSaveInput = Partial<StoryProgress> & { schemaVersion?: number };

export interface StoryProgressMigrationResult {
	progress: StoryProgress;
	fromVersion: number;
	toVersion: typeof STORY_PROGRESS_SCHEMA_VERSION;
	migrationsApplied: string[];
}

const DEFAULT_STAGE_ID = 'lower-sprawl';
const VALID_STAGE_IDS = new Set([
	'lower-sprawl',
	'drainmarket',
	'chrome-arcology',
	'mirror-palace',
	'dub-colony',
	'antenna-barrens',
	'orbital-lift',
	'asteroid-redoubt',
]);
const LIO_FLAG_TO_BRANCH: Record<string, LioTrustBranch> = {
	lio_exposed: 'exposed',
	lio_protected: 'protected',
	lio_baited: 'baited',
};
const COLONY_FLAG_TO_BRANCH: Record<string, ColonyAlignmentBranch> = {
	colony_alignment_chorus: 'chorus',
	colony_alignment_army: 'army',
	colony_alignment_supplier: 'supplier',
};
const FINAL_FLAG_TO_BRANCH: Record<string, FinalBroadcastBranch> = {
	broadcast_abolish_skylock: 'abolish-skylock',
	broadcast_chorus_control: 'chorus-control',
	broadcast_publish_tools: 'publish-tools',
};

export function createDefaultStoryProgress(): StoryProgress {
	return {
		schemaVersion: STORY_PROGRESS_SCHEMA_VERSION,
		currentStageId: DEFAULT_STAGE_ID,
		completedStageIds: [],
		completedChapterIds: [],
		acquiredPayloads: [],
		resultFlags: [],
		campaignComplete: false,
	};
}

export function migrateStoryProgress(input: StoryProgressSaveInput = {}): StoryProgressMigrationResult {
	const fromVersion = typeof input.schemaVersion === 'number' ? input.schemaVersion : 1;
	const migrationsApplied: string[] = [];
	const resultFlags = uniqueStrings(input.resultFlags);
	const progress: StoryProgress = {
		...createDefaultStoryProgress(),
		currentStageId: validStageId(input.currentStageId),
		completedStageIds: uniqueStrings(input.completedStageIds).filter((stageId) => VALID_STAGE_IDS.has(stageId)),
		completedChapterIds: uniqueStrings(input.completedChapterIds),
		acquiredPayloads: uniqueStrings(input.acquiredPayloads),
		resultFlags,
		lioTrust: validLioTrust(input.lioTrust) ?? inferBranch(resultFlags, LIO_FLAG_TO_BRANCH),
		colonyAlignment:
			validColonyAlignment(input.colonyAlignment) ?? inferBranch(resultFlags, COLONY_FLAG_TO_BRANCH),
		finalBroadcastDoctrine:
			validFinalDoctrine(input.finalBroadcastDoctrine) ?? inferBranch(resultFlags, FINAL_FLAG_TO_BRANCH),
		campaignComplete: input.campaignComplete === true,
	};

	if (fromVersion < STORY_PROGRESS_SCHEMA_VERSION) migrationsApplied.push('schema-v2-story-branches');
	if (!input.schemaVersion || input.schemaVersion !== STORY_PROGRESS_SCHEMA_VERSION) {
		migrationsApplied.push('schema-version-normalized');
	}
	if (progress.currentStageId !== input.currentStageId) migrationsApplied.push('current-stage-repaired');
	if ((input.resultFlags?.length ?? 0) !== progress.resultFlags.length) migrationsApplied.push('result-flags-deduped');
	if (!input.lioTrust && progress.lioTrust) migrationsApplied.push('lio-trust-inferred');
	if (!input.colonyAlignment && progress.colonyAlignment) migrationsApplied.push('colony-alignment-inferred');
	if (!input.finalBroadcastDoctrine && progress.finalBroadcastDoctrine) {
		migrationsApplied.push('final-broadcast-doctrine-inferred');
	}

	return {
		progress,
		fromVersion,
		toVersion: STORY_PROGRESS_SCHEMA_VERSION,
		migrationsApplied: Array.from(new Set(migrationsApplied)),
	};
}

function uniqueStrings(value: unknown): string[] {
	return Array.isArray(value)
		? Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
		: [];
}

function validStageId(value: unknown): string {
	return typeof value === 'string' && VALID_STAGE_IDS.has(value) ? value : DEFAULT_STAGE_ID;
}

function validLioTrust(value: unknown): LioTrustBranch | undefined {
	return value === 'exposed' || value === 'protected' || value === 'baited' ? value : undefined;
}

function validColonyAlignment(value: unknown): ColonyAlignmentBranch | undefined {
	return value === 'chorus' || value === 'army' || value === 'supplier' ? value : undefined;
}

function validFinalDoctrine(value: unknown): FinalBroadcastBranch | undefined {
	return value === 'abolish-skylock' || value === 'chorus-control' || value === 'publish-tools'
		? value
		: undefined;
}

function inferBranch<T extends string>(flags: readonly string[], table: Record<string, T>): T | undefined {
	for (const flag of flags) {
		const branch = table[flag];
		if (branch) return branch;
	}
	return undefined;
}

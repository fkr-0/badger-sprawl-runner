import { describe, expect, it } from 'vitest';
import {
	STORY_PROGRESS_SCHEMA_VERSION,
	createDefaultStoryProgress,
	migrateStoryProgress,
} from './StoryProgressMigration';

describe('StoryProgressMigration', () => {
	it('creates v2 default story progress', () => {
		expect(createDefaultStoryProgress()).toMatchObject({
			schemaVersion: STORY_PROGRESS_SCHEMA_VERSION,
			currentStageId: 'lower-sprawl',
			completedStageIds: [],
			completedChapterIds: [],
			acquiredPayloads: [],
			resultFlags: [],
			campaignComplete: false,
		});
	});

	it('migrates legacy partial progress and infers expanded branch fields from result flags', () => {
		const result = migrateStoryProgress({
			currentStageId: 'asteroid-redoubt',
			completedStageIds: ['lower-sprawl', 'lower-sprawl', 'unknown-stage'],
			completedChapterIds: ['ch01', 'ch01'],
			acquiredPayloads: ['wafer_key', 'wafer_key'],
			resultFlags: [
				'lio_protected',
				'colony_alignment_supplier',
				'broadcast_publish_tools',
				'broadcast_publish_tools',
			],
		});

		expect(result.progress).toMatchObject({
			schemaVersion: STORY_PROGRESS_SCHEMA_VERSION,
			currentStageId: 'asteroid-redoubt',
			completedStageIds: ['lower-sprawl'],
			completedChapterIds: ['ch01'],
			acquiredPayloads: ['wafer_key'],
			resultFlags: ['lio_protected', 'colony_alignment_supplier', 'broadcast_publish_tools'],
			lioTrust: 'protected',
			colonyAlignment: 'supplier',
			finalBroadcastDoctrine: 'publish-tools',
			campaignComplete: false,
		});
		expect(result.migrationsApplied).toEqual(
			expect.arrayContaining([
				'schema-v2-story-branches',
				'schema-version-normalized',
				'result-flags-deduped',
				'lio-trust-inferred',
				'colony-alignment-inferred',
				'final-broadcast-doctrine-inferred',
			])
		);
	});

	it('repairs invalid current stage ids and invalid branch fields', () => {
		const result = migrateStoryProgress({
			schemaVersion: 2,
			currentStageId: 'missing-stage',
			lioTrust: 'invalid' as never,
			colonyAlignment: 'invalid' as never,
			finalBroadcastDoctrine: 'invalid' as never,
			resultFlags: ['lio_baited'],
		});

		expect(result.progress).toMatchObject({
			currentStageId: 'lower-sprawl',
			lioTrust: 'baited',
			colonyAlignment: undefined,
			finalBroadcastDoctrine: undefined,
		});
		expect(result.migrationsApplied).toContain('current-stage-repaired');
	});
});

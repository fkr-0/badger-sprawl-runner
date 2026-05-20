import { describe, expect, it } from 'vitest';
import { buildEndlessSprawlRun } from './EndlessSprawlRun';

describe('buildEndlessSprawlRun', () => {
	it('builds deterministic StageRunSceneOptions for the same seed and floor', () => {
		const input = { seed: 'same-run', floor: 4 };
		expect(buildEndlessSprawlRun(input)).toEqual(buildEndlessSprawlRun(input));
	});

	it('rotates runtime stage ids by floor', () => {
		expect(buildEndlessSprawlRun({ seed: 'rotation', floor: 1 }).summary.stageId).toBe('lower-sprawl');
		expect(buildEndlessSprawlRun({ seed: 'rotation', floor: 2 }).summary.stageId).toBe('drainmarket');
		expect(buildEndlessSprawlRun({ seed: 'rotation', floor: 8 }).summary.stageId).toBe('asteroid-redoubt');
		expect(buildEndlessSprawlRun({ seed: 'rotation', floor: 9 }).summary.stageId).toBe('lower-sprawl');
	});

	it('escalates enemy packs and side rooms as floors rise', () => {
		const early = buildEndlessSprawlRun({ seed: 'budget', floor: 1 });
		const later = buildEndlessSprawlRun({ seed: 'budget', floor: 7 });
		expect(later.summary.enemyPackCount).toBeGreaterThan(early.summary.enemyPackCount);
		expect(later.summary.sideRoomCount).toBeGreaterThan(early.summary.sideRoomCount);
		expect(later.options.branchGameplayHooks).toEqual(
			expect.arrayContaining(['ambush_warning_overlay', 'companion_assist_delay'])
		);
	});

	it('returns generated enemies and side rooms for StageRunScene', () => {
		const run = buildEndlessSprawlRun({ seed: 'runtime', floor: 3 });
		expect(run.options.generatedEnemyPacks?.length).toBe(run.summary.enemyPackCount);
		expect(run.options.generatedSideRooms?.length).toBe(run.summary.sideRoomCount);
		expect(run.options.generatedEnemyPacks?.[0]?.enemies.length).toBeGreaterThan(0);
	});
});

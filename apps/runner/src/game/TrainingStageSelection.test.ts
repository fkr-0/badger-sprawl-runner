import { describe, expect, it } from 'vitest';
import { RUNTIME_STAGE_IDS } from '../world/stageLayoutRegistry';
import { selectTrainingStage } from './TrainingStageSelection';

describe('training stage selection', () => {
	it('selects a stable runtime stage for a seed', () => {
		const first = selectTrainingStage('classic-86-bpm');
		const second = selectTrainingStage('classic-86-bpm');
		expect(second).toEqual(first);
		expect(RUNTIME_STAGE_IDS).toContain(first.stageId);
	});

	it('avoids returning the previous stage during a reroll', () => {
		const first = selectTrainingStage('same-seed');
		const rerolled = selectTrainingStage('same-seed', first.stageId);
		expect(rerolled.stageId).not.toBe(first.stageId);
	});
});

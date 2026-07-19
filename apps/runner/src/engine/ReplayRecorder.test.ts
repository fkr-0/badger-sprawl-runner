import { describe, expect, it } from 'vitest';
import { ReplayRecorder } from './ReplayRecorder';

describe('ReplayRecorder shared runtime wrapper', () => {
	it('preserves the legacy frame/action recording contract', () => {
		const recorder = new ReplayRecorder();
		const first = { left: true, jump: false };
		recorder.record(first);
		first.left = false;
		recorder.record({ left: false, jump: true });

		expect(recorder.getRecording()).toEqual([
			{ frame: 0, actionMap: { jump: false, left: true } },
			{ frame: 1, actionMap: { jump: true, left: false } },
		]);

		recorder.clear();
		expect(recorder.getRecording()).toEqual([]);
	});
});

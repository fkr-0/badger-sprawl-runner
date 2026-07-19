/**
 * Compatibility wrapper over the shared ticked command recorder.
 */

import { createCommandRecorder } from '../../../../vendor/arcade-runtime.mjs';

export interface InputFrame {
	frame: number;
	actionMap: Record<string, boolean>;
}

export class ReplayRecorder {
	private readonly recorder = createCommandRecorder<Record<string, boolean>>({
		metadata: { game: 'badger-sprawl-runner', stream: 'input-actions' },
	});

	record(actionMap: Record<string, boolean>): void {
		this.recorder.record({ ...actionMap });
		this.recorder.advance();
	}

	getRecording(): InputFrame[] {
		return this.recorder.snapshot().entries.map((entry) => ({
			frame: entry.tick,
			actionMap: { ...entry.command },
		}));
	}

	clear(): void {
		this.recorder.clear();
	}
}

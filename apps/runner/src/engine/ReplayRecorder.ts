/**
 * Input frame recording for debug and determinism
 */

export interface InputFrame {
	frame: number;
	actionMap: Record<string, boolean>;
}

export class ReplayRecorder {
	private frames: InputFrame[] = [];
	private frameCount = 0;

	record(actionMap: Record<string, boolean>): void {
		this.frames.push({
			frame: this.frameCount++,
			actionMap: { ...actionMap },
		});
	}

	getRecording(): InputFrame[] {
		return [...this.frames];
	}

	clear(): void {
		this.frames = [];
		this.frameCount = 0;
	}
}

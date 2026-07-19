/** Shared arcade-runtime fixed-timestep adapter. */

import { createFixedStepLoop } from '../../../../vendor/arcade-runtime.mjs';

export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export class GameLoop {
	private readonly core;

	constructor(_canvas: HTMLCanvasElement, update: UpdateFn, render: RenderFn) {
		this.core = createFixedStepLoop({
			update,
			render,
			fixedStep: 1 / 60,
			maxFrame: 0.1,
			timeUnit: 'seconds',
		});
	}

	start(): void {
		this.core.start();
	}

	stop(): void {
		this.core.stop();
	}

	pause(): void {
		this.core.pause();
	}

	resume(): void {
		this.core.resume();
	}

	getFrameCount(): number {
		return this.core.getFrameCount();
	}
}

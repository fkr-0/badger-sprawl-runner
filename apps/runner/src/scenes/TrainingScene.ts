/**
 * TrainingScene - lightweight practice mode scene backed by TrainingMode state.
 */

import type { Scene, SceneContext } from '../engine/SceneManager';
import { type TrainingAction, createTrainingMode } from '../game/TrainingMode';

export class TrainingScene implements Scene {
	readonly name = 'TrainingScene';

	private readonly training = createTrainingMode();
	private keyHandler: ((event: KeyboardEvent) => void) | null = null;

	getTrainingState(): ReturnType<typeof this.training.getState> {
		return this.training.getState();
	}

	onEnter(_ctx: SceneContext): void {
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.code === 'KeyR') {
				this.training.resetPractice();
				event.preventDefault();
			}
			if (event.code === 'KeyJ') {
				this.recordPracticeHit('melee');
				event.preventDefault();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		this.keyHandler = handleKeyDown;
	}

	onExit(): void {
		if (this.keyHandler) {
			window.removeEventListener('keydown', this.keyHandler);
			this.keyHandler = null;
		}
	}

	update(_dt: number): void {}

	recordPracticeHit(action: TrainingAction, damage = 1): void {
		this.training.recordHit({ action, damage });
	}

	render(renderer: unknown, _alpha: number): void {
		const maybeRenderer = renderer as { getContext?: () => CanvasRenderingContext2D };
		const ctx = maybeRenderer.getContext?.();
		if (!ctx) return;

		const state = this.training.getState();
		ctx.save();
		ctx.fillStyle = '#0b1020';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 28px ui-monospace, monospace';
		ctx.textAlign = 'center';
		ctx.fillText('DUMMY TRAINING', ctx.canvas.width / 2, 90);
		ctx.font = '16px ui-monospace, monospace';
		ctx.fillText(
			`lesson: ${state.lessonId} • dummy: ${state.dummyPresetId} • kit: ${state.kitId}`,
			ctx.canvas.width / 2,
			135
		);
		ctx.fillText(`hits: ${state.metrics.hitCount}`, ctx.canvas.width / 2, 170);
		ctx.restore();
	}
}

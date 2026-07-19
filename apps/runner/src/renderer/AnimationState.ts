/**
 * AnimationState - per-entity animation state machine
 */

import type { LoadedSheet } from '@badger/sprite-contracts';
import {
	advanceArcadeAnimationClock,
	createArcadeAnimationClock,
	playArcadeAnimationClock,
} from '../../../../vendor/arcade-runtime.mjs';

export interface AnimationState {
	currentAnim: string;
	frame: number;
	timer: number;
	loop: boolean;
}

export function createAnimationState(): AnimationState {
	const clock = createArcadeAnimationClock();
	return {
		currentAnim: 'idle',
		frame: clock.frame,
		timer: clock.elapsed,
		loop: true,
	};
}

export function advanceAnimation(state: AnimationState, sheet: LoadedSheet, dt: number): readonly number[] {
	const anim = sheet.sheet.animations[state.currentAnim];
	if (!anim) return [];

	const clock = advanceArcadeAnimationClock(
		{
			frame: state.frame,
			elapsed: state.timer,
			direction: 1,
			playing: true,
			paused: false,
		},
		dt,
		{
			frameCount: anim.frames,
			frameDuration: 1 / anim.fps,
			mode: state.loop ? 'loop' : 'once',
		}
	);
	state.frame = clock.frame;
	state.timer = clock.elapsed;
	return clock.advancedFrames;
}

export function playAnimation(state: AnimationState, animName: string, loop = true): void {
	if (state.currentAnim !== animName) {
		const clock = playArcadeAnimationClock(createArcadeAnimationClock());
		state.currentAnim = animName;
		state.frame = clock.frame;
		state.timer = clock.elapsed;
		state.loop = loop;
	}
}

export function getAnimationProgress(state: AnimationState): number {
	const anim = state.currentAnim;
	// Would need access to sheet to get frame count
	return state.frame;
}

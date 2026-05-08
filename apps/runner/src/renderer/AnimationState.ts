/**
 * AnimationState - per-entity animation state machine
 */

import type { LoadedSheet } from '@badger/sprite-contracts';

export interface AnimationState {
	currentAnim: string;
	frame: number;
	timer: number;
	loop: boolean;
}

export function createAnimationState(): AnimationState {
	return {
		currentAnim: 'idle',
		frame: 0,
		timer: 0,
		loop: true,
	};
}

export function advanceAnimation(state: AnimationState, sheet: LoadedSheet, dt: number): void {
	const anim = sheet.sheet.animations[state.currentAnim];
	if (!anim) return;

	state.timer += dt;

	const frameTime = 1 / anim.fps;
	while (state.timer >= frameTime) {
		state.timer -= frameTime;
		state.frame++;

		if (state.frame >= anim.frames) {
			if (state.loop) {
				state.frame = 0;
			} else {
				state.frame = anim.frames - 1;
				break;
			}
		}
	}
}

export function playAnimation(state: AnimationState, animName: string, loop = true): void {
	if (state.currentAnim !== animName) {
		state.currentAnim = animName;
		state.frame = 0;
		state.timer = 0;
		state.loop = loop;
	}
}

export function getAnimationProgress(state: AnimationState): number {
	const anim = state.currentAnim;
	// Would need access to sheet to get frame count
	return state.frame;
}

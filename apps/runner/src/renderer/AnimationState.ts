/**
 * AnimationState - per-entity animation state machine
 */

import {
	type LoadedSheet,
	type SpriteAnimationPlaybackState,
	type SpriteAnimationPlaybackStep,
	advanceSpriteAnimation,
	getSpriteAnimationProgress,
	pauseSpriteAnimation,
	playSpriteAnimation,
	resumeSpriteAnimation,
} from '@badger/sprite-contracts';

export interface AnimationState {
	currentAnim: string;
	frame: number;
	timer: number;
	loop: boolean;
	direction: 1 | -1;
	playing: boolean;
	paused: boolean;
	completed: boolean;
	speed: number;
}

export function createAnimationState(): AnimationState {
	return {
		currentAnim: 'idle',
		frame: 0,
		timer: 0,
		loop: true,
		direction: 1,
		playing: true,
		paused: false,
		completed: false,
		speed: 1,
	};
}

function toPlayback(state: AnimationState): SpriteAnimationPlaybackState {
	return {
		animationName: state.currentAnim,
		mode: state.loop ? 'loop' : 'once',
		speed: state.speed,
		clock: {
			frame: state.frame,
			elapsed: state.timer,
			direction: state.direction,
			playing: state.playing,
			paused: state.paused,
			completed: state.completed,
			frameAdvances: 0,
			advancedFrames: [],
		},
	};
}

function applyPlayback(state: AnimationState, playback: SpriteAnimationPlaybackState): void {
	state.currentAnim = playback.animationName;
	state.frame = playback.clock.frame;
	state.timer = playback.clock.elapsed;
	state.loop = playback.mode === 'loop';
	state.direction = playback.clock.direction;
	state.playing = playback.clock.playing;
	state.paused = playback.clock.paused;
	state.completed = playback.clock.completed;
	state.speed = playback.speed;
}

export function advanceAnimationStep(
	state: AnimationState,
	sheet: LoadedSheet,
	dt: number
): SpriteAnimationPlaybackStep | null {
	if (!sheet.sheet.animations[state.currentAnim]) return null;
	const step = advanceSpriteAnimation(toPlayback(state), sheet.sheet, dt);
	applyPlayback(state, step.state);
	return step;
}

export function advanceAnimation(
	state: AnimationState,
	sheet: LoadedSheet,
	dt: number
): readonly number[] {
	return advanceAnimationStep(state, sheet, dt)?.advancedFrames ?? [];
}

export function playAnimation(state: AnimationState, animName: string, loop = true): void {
	if (state.currentAnim !== animName) {
		state.currentAnim = animName;
		state.frame = 0;
		state.timer = 0;
		state.loop = loop;
		state.direction = 1;
		state.playing = true;
		state.paused = false;
		state.completed = false;
	}
}

export function playLoadedAnimation(
	state: AnimationState,
	sheet: LoadedSheet,
	animName: string,
	loop = true,
	restart = false
): void {
	if (!sheet.sheet.animations[animName]) return;
	if (state.currentAnim === animName && !restart) return;
	const playback = playSpriteAnimation(toPlayback(state), sheet.sheet, animName, {
		mode: loop ? 'loop' : 'once',
		restart: restart || state.currentAnim !== animName,
	});
	applyPlayback(state, playback);
}

export function pauseAnimation(state: AnimationState): void {
	applyPlayback(state, pauseSpriteAnimation(toPlayback(state)));
}

export function resumeAnimation(state: AnimationState): void {
	applyPlayback(state, resumeSpriteAnimation(toPlayback(state)));
}

export function isAnimationComplete(state: AnimationState): boolean {
	return state.completed;
}

export function getAnimationProgress(state: AnimationState, sheet: LoadedSheet): number {
	if (!sheet.sheet.animations[state.currentAnim]) return 0;
	return getSpriteAnimationProgress(toPlayback(state), sheet.sheet);
}

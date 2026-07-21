import {
	advanceArcadeAnimationClock,
	collectArcadeSpriteAnimationEvents,
	createArcadeAnimationClock,
	playArcadeAnimationClock,
	resolveArcadeSpriteFrame,
} from '../../../vendor/arcade-runtime.mjs';
import type {
	ArcadeAnimationClock,
	ArcadeAnimationMode,
	ArcadeSpriteFrameAddress,
} from '../../../vendor/arcade-runtime.mjs';
import { sampleSpriteAnimation } from './sampling';
import type { AnimationDef, SpriteAnimationEvent, SpriteSheet } from './types';

export interface SpriteAnimationPlaybackState {
	animationName: string;
	mode: ArcadeAnimationMode;
	speed: number;
	clock: ArcadeAnimationClock;
}

/** Change playback speed without resuming, restarting, or changing the current frame. */
export function setSpriteAnimationSpeed(
	state: SpriteAnimationPlaybackState,
	speed: number
): SpriteAnimationPlaybackState {
	return freezePlayback({ ...state, speed: normalizeSpeed(speed, state.speed) });
}

/**
 * Seek to an animation-local time while preserving pause state. The seek does
 * not emit crossed-frame events; consumers can resume and advance normally.
 */
export function seekSpriteAnimation(
	state: SpriteAnimationPlaybackState,
	sheet: SpriteSheet,
	timeSeconds: number,
	options: SeekSpriteAnimationOptions = {}
): SpriteAnimationPlaybackState {
	const sample = sampleSpriteAnimation(sheet, state.animationName, timeSeconds, {
		mode: state.mode,
	});
	const keepPlaying = options.keepPlaying ?? state.clock.playing;
	return freezePlayback({
		...state,
		clock: {
			frame: sample.localFrame,
			elapsed: sample.completed ? 0 : sample.frameElapsed,
			direction: sample.direction,
			playing: keepPlaying && !sample.completed,
			paused: state.clock.paused,
			completed: sample.completed,
			frameAdvances: 0,
			advancedFrames: [],
		},
	});
}

/** Seek to normalized cycle progress in the range 0..1. */
export function seekSpriteAnimationProgress(
	state: SpriteAnimationPlaybackState,
	sheet: SpriteSheet,
	progress: number,
	options: SeekSpriteAnimationOptions = {}
): SpriteAnimationPlaybackState {
	const initial = sampleSpriteAnimation(sheet, state.animationName, 0, { mode: state.mode });
	const normalized = clampProgress(progress);
	const terminalOffset =
		normalized === 1 && state.mode !== 'once' ? Math.min(initial.frameDuration * 1e-6, 1e-9) : 0;
	return seekSpriteAnimation(
		state,
		sheet,
		Math.max(0, normalized * initial.cycleDuration - terminalOffset),
		options
	);
}

function clampProgress(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(1, Math.max(0, Number(value)));
}

export interface SeekSpriteAnimationOptions {
	keepPlaying?: boolean;
}

export interface SpriteAnimationPlaybackOptions {
	mode?: ArcadeAnimationMode;
	speed?: number;
	frame?: number;
	direction?: 1 | -1;
	playing?: boolean;
	paused?: boolean;
}

export interface PlaySpriteAnimationOptions {
	mode?: ArcadeAnimationMode;
	speed?: number;
	restart?: boolean;
	frame?: number;
	direction?: 1 | -1;
}

export interface AdvanceSpriteAnimationOptions {
	speed?: number;
	maxAdvances?: number;
	singleFrameMode?: 'hold' | 'complete';
}

export interface SpriteAnimationPlaybackStep {
	state: SpriteAnimationPlaybackState;
	previousFrame: number;
	frameChanged: boolean;
	completedThisStep: boolean;
	advancedFrames: readonly number[];
	events: readonly SpriteAnimationEvent[];
	address: ArcadeSpriteFrameAddress;
	progress: number;
}

function requireAnimation(sheet: SpriteSheet, animationName: string): AnimationDef {
	const animation = sheet.animations[animationName];
	if (!animation) {
		throw new Error(`Unknown sprite animation: ${sheet.id}:${animationName}`);
	}
	return animation;
}

function normalizeSpeed(value: number | undefined, fallback = 1): number {
	return Number.isFinite(value) ? Math.max(0, Number(value)) : fallback;
}

function resolveMode(animation: AnimationDef, mode?: ArcadeAnimationMode): ArcadeAnimationMode {
	return mode ?? (animation.loop === false ? 'once' : 'loop');
}

function freezeClock(clock: ArcadeAnimationClock): ArcadeAnimationClock {
	return Object.freeze({
		...clock,
		advancedFrames: Object.freeze([...clock.advancedFrames]),
	});
}

function freezePlayback(
	state: Omit<SpriteAnimationPlaybackState, 'clock'> & { clock: ArcadeAnimationClock }
): SpriteAnimationPlaybackState {
	return Object.freeze({
		animationName: state.animationName,
		mode: state.mode,
		speed: state.speed,
		clock: freezeClock(state.clock),
	});
}

function clampInitialFrame(frame: number | undefined, frameCount: number): number {
	if (!Number.isFinite(frame)) return 0;
	return Math.min(frameCount - 1, Math.max(0, Math.floor(Number(frame))));
}

/** Create an immutable, renderer-neutral animation playback state. */
export function createSpriteAnimationPlayback(
	sheet: SpriteSheet,
	animationName = 'idle',
	options: SpriteAnimationPlaybackOptions = {}
): SpriteAnimationPlaybackState {
	const animation = requireAnimation(sheet, animationName);
	const frame = clampInitialFrame(options.frame, animation.frames);
	const playing = options.playing ?? true;
	const paused = options.paused ?? false;
	const baseClock = createArcadeAnimationClock({
		frame,
		direction: options.direction,
		playing,
		paused,
	});

	return freezePlayback({
		animationName,
		mode: resolveMode(animation, options.mode),
		speed: normalizeSpeed(options.speed),
		clock: baseClock,
	});
}

/**
 * Select or resume an animation. Changing the animation restarts by default;
 * selecting the current animation resumes it without resetting unless
 * `restart` is explicitly true.
 */
export function playSpriteAnimation(
	state: SpriteAnimationPlaybackState,
	sheet: SpriteSheet,
	animationName: string,
	options: PlaySpriteAnimationOptions = {}
): SpriteAnimationPlaybackState {
	const animation = requireAnimation(sheet, animationName);
	const changed = animationName !== state.animationName;
	const restart = options.restart ?? changed;
	const clock = playArcadeAnimationClock(state.clock, {
		restart,
		frame: clampInitialFrame(options.frame, animation.frames),
		direction: options.direction,
	});

	return freezePlayback({
		animationName,
		mode: resolveMode(animation, options.mode ?? (changed ? undefined : state.mode)),
		speed: normalizeSpeed(options.speed, state.speed),
		clock,
	});
}

/** Pause without discarding frame, elapsed time, direction, or completion state. */
export function pauseSpriteAnimation(
	state: SpriteAnimationPlaybackState
): SpriteAnimationPlaybackState {
	return freezePlayback({
		...state,
		clock: {
			...state.clock,
			paused: true,
			frameAdvances: 0,
			advancedFrames: [],
		},
	});
}

/** Resume a paused or stopped clock without restarting its animation. */
export function resumeSpriteAnimation(
	state: SpriteAnimationPlaybackState
): SpriteAnimationPlaybackState {
	return freezePlayback({
		...state,
		clock: playArcadeAnimationClock(state.clock, { restart: false }),
	});
}

/** Return normalized cycle progress in the range 0..1. */
export function getSpriteAnimationProgress(
	state: SpriteAnimationPlaybackState,
	sheet: SpriteSheet
): number {
	const animation = requireAnimation(sheet, state.animationName);
	if (state.clock.completed) return 1;
	if (animation.frames <= 0) return 0;

	const frameDuration = 1 / animation.fps;
	const fractionalFrame = Math.min(1, Math.max(0, state.clock.elapsed / frameDuration));
	if (state.mode !== 'pingpong' || animation.frames === 1) {
		return Math.min(1, Math.max(0, (state.clock.frame + fractionalFrame) / animation.frames));
	}

	const edge = animation.frames - 1;
	const cycleFrames = edge * 2;
	const cyclePosition =
		state.clock.direction === 1
			? state.clock.frame + fractionalFrame
			: edge + (edge - state.clock.frame) + fractionalFrame;
	return Math.min(1, Math.max(0, cyclePosition / cycleFrames));
}

/** Resolve the currently displayed source rectangle and anchor. */
export function getSpriteAnimationFrameAddress(
	state: SpriteAnimationPlaybackState,
	sheet: SpriteSheet
): ArcadeSpriteFrameAddress {
	const address = resolveArcadeSpriteFrame(sheet, state.animationName, state.clock.frame);
	if (!address) {
		throw new Error(`Unable to resolve sprite frame: ${sheet.id}:${state.animationName}`);
	}
	return address;
}

/** Advance playback and collect every frame event crossed by the clock. */
export function advanceSpriteAnimation(
	state: SpriteAnimationPlaybackState,
	sheet: SpriteSheet,
	deltaTime: number,
	options: AdvanceSpriteAnimationOptions = {}
): SpriteAnimationPlaybackStep {
	const animation = requireAnimation(sheet, state.animationName);
	const previousFrame = state.clock.frame;
	const clock = advanceArcadeAnimationClock(state.clock, deltaTime, {
		frameCount: animation.frames,
		frameDuration: 1 / animation.fps,
		mode: state.mode,
		speed: normalizeSpeed(options.speed, state.speed),
		maxAdvances: options.maxAdvances,
		singleFrameMode: options.singleFrameMode,
	});
	const nextState = freezePlayback({ ...state, clock });
	const advancedFrames = Object.freeze([...clock.advancedFrames]);
	const events = Object.freeze([...collectArcadeSpriteAnimationEvents(animation, advancedFrames)]);

	return Object.freeze({
		state: nextState,
		previousFrame,
		frameChanged: previousFrame !== clock.frame,
		completedThisStep: !state.clock.completed && clock.completed,
		advancedFrames,
		events,
		address: getSpriteAnimationFrameAddress(nextState, sheet),
		progress: getSpriteAnimationProgress(nextState, sheet),
	});
}

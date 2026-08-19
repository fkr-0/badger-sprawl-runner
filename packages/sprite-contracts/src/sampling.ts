import { resolveArcadeSpriteFrame } from '@arcade/runtime/sprites';
import type { ArcadeSpriteFrameAddress } from '@arcade/runtime/sprites';
import type { ArcadeAnimationMode } from '@arcade/runtime/animation';
import type { AnimationDef, SpriteSheet } from './types';

export interface SpriteAnimationSampleOptions {
	mode?: ArcadeAnimationMode;
	speed?: number;
	phaseOffsetSeconds?: number;
}

export interface SpriteAnimationSample {
	animationName: string;
	mode: ArcadeAnimationMode;
	timeSeconds: number;
	scaledTimeSeconds: number;
	cycleSlot: number;
	localFrame: number;
	absoluteFrame: number;
	direction: 1 | -1;
	frameElapsed: number;
	frameDuration: number;
	cycleDuration: number;
	progress: number;
	completed: boolean;
	address: ArcadeSpriteFrameAddress;
}

function requireAnimation(sheet: SpriteSheet, animationName: string): AnimationDef {
	const animation = sheet.animations[animationName];
	if (!animation) {
		throw new Error(`Unknown sprite animation: ${sheet.id}:${animationName}`);
	}
	return animation;
}

function finite(value: number | undefined, fallback = 0): number {
	return Number.isFinite(value) ? Number(value) : fallback;
}

function positiveModulo(value: number, divisor: number): number {
	return ((value % divisor) + divisor) % divisor;
}

function frameSlotAt(time: number, frameDuration: number, slotCount: number): number {
	// Preserve the intuitive `floor(time * fps)` boundary semantics despite
	// binary floating-point representations such as 0.4 / 0.2 = 1.999999… .
	return Math.min(slotCount - 1, Math.max(0, Math.floor(time / frameDuration + 1e-9)));
}

function elapsedWithinFrame(time: number, slot: number, frameDuration: number): number {
	return Math.min(frameDuration, Math.max(0, time - slot * frameDuration));
}

function resolveMode(animation: AnimationDef, mode?: ArcadeAnimationMode): ArcadeAnimationMode {
	return mode ?? (animation.loop === false ? 'once' : 'loop');
}

function pingPongSequence(frameCount: number): readonly number[] {
	if (frameCount <= 1) return Object.freeze([0]);
	const forward = Array.from({ length: frameCount }, (_, index) => index);
	const reverse = Array.from({ length: frameCount - 2 }, (_, index) => frameCount - 2 - index);
	return Object.freeze([...forward, ...reverse]);
}

/**
 * Sample a manifest animation at an absolute time without retaining mutable
 * playback state. This is intended for ambient tiles, portraits, enemies, and
 * renderer parity paths that derive frames from a shared scene clock.
 */
export function sampleSpriteAnimation(
	sheet: SpriteSheet,
	animationName: string,
	timeSeconds: number,
	options: SpriteAnimationSampleOptions = {}
): SpriteAnimationSample {
	const animation = requireAnimation(sheet, animationName);
	const mode = resolveMode(animation, options.mode);
	const speed = Math.max(0, finite(options.speed, 1));
	const rawTime = Math.max(0, finite(timeSeconds));
	const phaseOffset = finite(options.phaseOffsetSeconds);
	const scaledTime = rawTime * speed + phaseOffset;
	const frameDuration = 1 / animation.fps;
	let localFrame = 0;
	let cycleSlot = 0;
	let direction: 1 | -1 = 1;
	let frameElapsed = 0;
	let cycleDuration = frameDuration;
	let progress = 0;
	let completed = false;

	if (mode === 'pingpong') {
		const sequence = pingPongSequence(animation.frames);
		cycleDuration = sequence.length * frameDuration;
		const cycleTime = positiveModulo(scaledTime, cycleDuration);
		cycleSlot = frameSlotAt(cycleTime, frameDuration, sequence.length);
		localFrame = sequence[cycleSlot] ?? 0;
		direction = cycleSlot >= animation.frames - 1 && animation.frames > 1 ? -1 : 1;
		frameElapsed = elapsedWithinFrame(cycleTime, cycleSlot, frameDuration);
		progress = cycleTime / cycleDuration;
	} else if (mode === 'once') {
		cycleDuration = animation.frames * frameDuration;
		const clampedTime = Math.min(cycleDuration, Math.max(0, scaledTime));
		completed = clampedTime >= cycleDuration;
		if (completed) {
			localFrame = animation.frames - 1;
			cycleSlot = localFrame;
			frameElapsed = frameDuration;
			progress = 1;
		} else {
			localFrame = frameSlotAt(clampedTime, frameDuration, animation.frames);
			cycleSlot = localFrame;
			frameElapsed = elapsedWithinFrame(clampedTime, localFrame, frameDuration);
			progress = clampedTime / cycleDuration;
		}
	} else {
		cycleDuration = animation.frames * frameDuration;
		const cycleTime = positiveModulo(scaledTime, cycleDuration);
		localFrame = frameSlotAt(cycleTime, frameDuration, animation.frames);
		cycleSlot = localFrame;
		frameElapsed = elapsedWithinFrame(cycleTime, localFrame, frameDuration);
		progress = cycleTime / cycleDuration;
	}

	const address = resolveArcadeSpriteFrame(sheet, animationName, localFrame);
	if (!address) {
		throw new Error(`Unable to resolve sprite frame: ${sheet.id}:${animationName}:${localFrame}`);
	}

	return Object.freeze({
		animationName,
		mode,
		timeSeconds: rawTime,
		scaledTimeSeconds: scaledTime,
		cycleSlot,
		localFrame,
		absoluteFrame: address.absoluteFrame,
		direction,
		frameElapsed,
		frameDuration,
		cycleDuration,
		progress,
		completed,
		address,
	});
}

/** Lightweight convenience for renderer code that only needs the local frame. */
export function sampleSpriteAnimationFrame(
	sheet: SpriteSheet,
	animationName: string,
	timeSeconds: number,
	options: SpriteAnimationSampleOptions = {}
): number {
	return sampleSpriteAnimation(sheet, animationName, timeSeconds, options).localFrame;
}

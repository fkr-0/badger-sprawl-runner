import type { ArcadeAnimationClock, ArcadeAnimationMode, ArcadeSpriteFrameAddress } from '../../../vendor/arcade-runtime.mjs';
import type { SpriteAnimationEvent, SpriteSheet } from './types';
export interface SpriteAnimationPlaybackState {
    animationName: string;
    mode: ArcadeAnimationMode;
    speed: number;
    clock: ArcadeAnimationClock;
}
/** Change playback speed without resuming, restarting, or changing the current frame. */
export declare function setSpriteAnimationSpeed(state: SpriteAnimationPlaybackState, speed: number): SpriteAnimationPlaybackState;
/**
 * Seek to an animation-local time while preserving pause state. The seek does
 * not emit crossed-frame events; consumers can resume and advance normally.
 */
export declare function seekSpriteAnimation(state: SpriteAnimationPlaybackState, sheet: SpriteSheet, timeSeconds: number, options?: SeekSpriteAnimationOptions): SpriteAnimationPlaybackState;
/** Seek to normalized cycle progress in the range 0..1. */
export declare function seekSpriteAnimationProgress(state: SpriteAnimationPlaybackState, sheet: SpriteSheet, progress: number, options?: SeekSpriteAnimationOptions): SpriteAnimationPlaybackState;
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
/** Create an immutable, renderer-neutral animation playback state. */
export declare function createSpriteAnimationPlayback(sheet: SpriteSheet, animationName?: string, options?: SpriteAnimationPlaybackOptions): SpriteAnimationPlaybackState;
/**
 * Select or resume an animation. Changing the animation restarts by default;
 * selecting the current animation resumes it without resetting unless
 * `restart` is explicitly true.
 */
export declare function playSpriteAnimation(state: SpriteAnimationPlaybackState, sheet: SpriteSheet, animationName: string, options?: PlaySpriteAnimationOptions): SpriteAnimationPlaybackState;
/** Pause without discarding frame, elapsed time, direction, or completion state. */
export declare function pauseSpriteAnimation(state: SpriteAnimationPlaybackState): SpriteAnimationPlaybackState;
/** Resume a paused or stopped clock without restarting its animation. */
export declare function resumeSpriteAnimation(state: SpriteAnimationPlaybackState): SpriteAnimationPlaybackState;
/** Return normalized cycle progress in the range 0..1. */
export declare function getSpriteAnimationProgress(state: SpriteAnimationPlaybackState, sheet: SpriteSheet): number;
/** Resolve the currently displayed source rectangle and anchor. */
export declare function getSpriteAnimationFrameAddress(state: SpriteAnimationPlaybackState, sheet: SpriteSheet): ArcadeSpriteFrameAddress;
/** Advance playback and collect every frame event crossed by the clock. */
export declare function advanceSpriteAnimation(state: SpriteAnimationPlaybackState, sheet: SpriteSheet, deltaTime: number, options?: AdvanceSpriteAnimationOptions): SpriteAnimationPlaybackStep;
//# sourceMappingURL=playback.d.ts.map
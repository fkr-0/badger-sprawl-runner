import type { ArcadeSpriteFrameAddress } from '@arcade/runtime/sprites';
import type { ArcadeAnimationMode } from '@arcade/runtime/animation';
import type { SpriteSheet } from './types';
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
/**
 * Sample a manifest animation at an absolute time without retaining mutable
 * playback state. This is intended for ambient tiles, portraits, enemies, and
 * renderer parity paths that derive frames from a shared scene clock.
 */
export declare function sampleSpriteAnimation(sheet: SpriteSheet, animationName: string, timeSeconds: number, options?: SpriteAnimationSampleOptions): SpriteAnimationSample;
/** Lightweight convenience for renderer code that only needs the local frame. */
export declare function sampleSpriteAnimationFrame(sheet: SpriteSheet, animationName: string, timeSeconds: number, options?: SpriteAnimationSampleOptions): number;
//# sourceMappingURL=sampling.d.ts.map
import type { ArcadeAnimationMode, ArcadeSpriteFrameAddress } from '../../../vendor/arcade-runtime.mjs';
import { type SpriteAtlasDimensions, type SpriteSheetDimensionAudit, deriveSpriteAtlasLayout } from './production';
import { type SpriteAnimationSample } from './sampling';
import type { SpriteAnimationEvent, SpriteSheet } from './types';
export interface SpriteAnimationTimelineFrame {
    slot: number;
    localFrame: number;
    direction: 1 | -1;
    startsAt: number;
    endsAt: number;
    address: ArcadeSpriteFrameAddress;
    events: readonly SpriteAnimationEvent[];
}
export interface SpriteAnimationTimeline {
    sheetId: string;
    animationName: string;
    mode: ArcadeAnimationMode;
    fps: number;
    frameDuration: number;
    cycleDuration: number;
    frames: readonly SpriteAnimationTimelineFrame[];
}
export interface SpriteAnimationInspection {
    sample: SpriteAnimationSample;
    timeline: SpriteAnimationTimeline;
    current: SpriteAnimationTimelineFrame;
}
export interface SpriteAnimationSummary {
    name: string;
    frames: number;
    fps: number;
    mode: ArcadeAnimationMode;
    duration: number;
    eventCount: number;
}
export interface SpriteSheetInspection {
    sheetId: string;
    file: string;
    animationCount: number;
    totalFrames: number;
    totalEvents: number;
    layout: ReturnType<typeof deriveSpriteAtlasLayout>;
    usedCellCount: number;
    unusedCellCount: number;
    animations: readonly SpriteAnimationSummary[];
    dimensionAudit: SpriteSheetDimensionAudit | null;
}
/** Compile one animation into an inspectable sequence of addressed frame slots. */
export declare function createSpriteAnimationTimeline(sheet: SpriteSheet, animationName: string, mode?: ArcadeAnimationMode): SpriteAnimationTimeline;
/** Sample an animation and return its matching timeline slot and diagnostics. */
export declare function inspectSpriteAnimation(sheet: SpriteSheet, animationName: string, timeSeconds: number, mode?: ArcadeAnimationMode): SpriteAnimationInspection;
/** Build a compact sheet-level inspection report for tooling and test harnesses. */
export declare function inspectSpriteSheet(sheet: SpriteSheet, actualDimensions?: SpriteAtlasDimensions): SpriteSheetInspection;
//# sourceMappingURL=inspection.d.ts.map
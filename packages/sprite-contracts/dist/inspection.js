import { collectArcadeSpriteAnimationEvents, resolveArcadeSpriteFrame, } from '../../../vendor/arcade-runtime.mjs';
import { auditSpriteAtlasDimensions, createSpriteAtlasAssemblyPlan, deriveSpriteAtlasLayout, } from './production';
import { sampleSpriteAnimation } from './sampling';
function requireAnimation(sheet, animationName) {
    const animation = sheet.animations[animationName];
    if (!animation)
        throw new Error(`Unknown sprite animation: ${sheet.id}:${animationName}`);
    return animation;
}
function resolveMode(animation, mode) {
    return mode ?? (animation.loop === false ? 'once' : 'loop');
}
function timelineSequence(frameCount, mode) {
    const forward = Array.from({ length: frameCount }, (_, index) => index);
    if (mode !== 'pingpong' || frameCount <= 1)
        return Object.freeze(forward);
    const reverse = Array.from({ length: frameCount - 2 }, (_, index) => frameCount - 2 - index);
    return Object.freeze([...forward, ...reverse]);
}
function stableTime(value) {
    return Number(value.toFixed(12));
}
/** Compile one animation into an inspectable sequence of addressed frame slots. */
export function createSpriteAnimationTimeline(sheet, animationName, mode) {
    const animation = requireAnimation(sheet, animationName);
    const resolvedMode = resolveMode(animation, mode);
    const frameDuration = 1 / animation.fps;
    const sequence = timelineSequence(animation.frames, resolvedMode);
    const frames = sequence.map((localFrame, slot) => {
        const address = resolveArcadeSpriteFrame(sheet, animationName, localFrame);
        if (!address) {
            throw new Error(`Unable to resolve sprite frame: ${sheet.id}:${animationName}:${localFrame}`);
        }
        return Object.freeze({
            slot,
            localFrame,
            direction: resolvedMode === 'pingpong' && slot >= animation.frames - 1 && animation.frames > 1
                ? -1
                : 1,
            startsAt: stableTime(slot * frameDuration),
            endsAt: stableTime((slot + 1) * frameDuration),
            address,
            events: Object.freeze([...collectArcadeSpriteAnimationEvents(animation, [localFrame])]),
        });
    });
    return Object.freeze({
        sheetId: sheet.id,
        animationName,
        mode: resolvedMode,
        fps: animation.fps,
        frameDuration,
        cycleDuration: stableTime(frames.length * frameDuration),
        frames: Object.freeze(frames),
    });
}
/** Sample an animation and return its matching timeline slot and diagnostics. */
export function inspectSpriteAnimation(sheet, animationName, timeSeconds, mode) {
    const timeline = createSpriteAnimationTimeline(sheet, animationName, mode);
    const sample = sampleSpriteAnimation(sheet, animationName, timeSeconds, { mode: timeline.mode });
    const current = timeline.frames[sample.cycleSlot];
    if (!current)
        throw new Error(`Unable to inspect sprite slot: ${sheet.id}:${animationName}`);
    return Object.freeze({ sample, timeline, current });
}
/** Build a compact sheet-level inspection report for tooling and test harnesses. */
export function inspectSpriteSheet(sheet, actualDimensions) {
    const layout = deriveSpriteAtlasLayout(sheet);
    const plan = createSpriteAtlasAssemblyPlan(sheet);
    const animations = Object.entries(sheet.animations).map(([name, animation]) => {
        const mode = resolveMode(animation);
        const timeline = createSpriteAnimationTimeline(sheet, name, mode);
        return Object.freeze({
            name,
            frames: animation.frames,
            fps: animation.fps,
            mode,
            duration: timeline.cycleDuration,
            eventCount: animation.events?.length ?? 0,
        });
    });
    return Object.freeze({
        sheetId: sheet.id,
        file: sheet.file,
        animationCount: animations.length,
        totalFrames: animations.reduce((total, animation) => total + animation.frames, 0),
        totalEvents: animations.reduce((total, animation) => total + animation.eventCount, 0),
        layout,
        usedCellCount: plan.usedCellCount,
        unusedCellCount: plan.unusedCellCount,
        animations: Object.freeze(animations),
        dimensionAudit: actualDimensions ? auditSpriteAtlasDimensions(sheet, actualDimensions) : null,
    });
}
//# sourceMappingURL=inspection.js.map
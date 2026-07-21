import { resolveArcadeSpriteFrame } from '../../../vendor/arcade-runtime.mjs';
function requireAnimation(sheet, animationName) {
    const animation = sheet.animations[animationName];
    if (!animation) {
        throw new Error(`Unknown sprite animation: ${sheet.id}:${animationName}`);
    }
    return animation;
}
function finite(value, fallback = 0) {
    return Number.isFinite(value) ? Number(value) : fallback;
}
function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
}
function frameSlotAt(time, frameDuration, slotCount) {
    // Preserve the intuitive `floor(time * fps)` boundary semantics despite
    // binary floating-point representations such as 0.4 / 0.2 = 1.999999… .
    return Math.min(slotCount - 1, Math.max(0, Math.floor(time / frameDuration + 1e-9)));
}
function elapsedWithinFrame(time, slot, frameDuration) {
    return Math.min(frameDuration, Math.max(0, time - slot * frameDuration));
}
function resolveMode(animation, mode) {
    return mode ?? (animation.loop === false ? 'once' : 'loop');
}
function pingPongSequence(frameCount) {
    if (frameCount <= 1)
        return Object.freeze([0]);
    const forward = Array.from({ length: frameCount }, (_, index) => index);
    const reverse = Array.from({ length: frameCount - 2 }, (_, index) => frameCount - 2 - index);
    return Object.freeze([...forward, ...reverse]);
}
/**
 * Sample a manifest animation at an absolute time without retaining mutable
 * playback state. This is intended for ambient tiles, portraits, enemies, and
 * renderer parity paths that derive frames from a shared scene clock.
 */
export function sampleSpriteAnimation(sheet, animationName, timeSeconds, options = {}) {
    const animation = requireAnimation(sheet, animationName);
    const mode = resolveMode(animation, options.mode);
    const speed = Math.max(0, finite(options.speed, 1));
    const rawTime = Math.max(0, finite(timeSeconds));
    const phaseOffset = finite(options.phaseOffsetSeconds);
    const scaledTime = rawTime * speed + phaseOffset;
    const frameDuration = 1 / animation.fps;
    let localFrame = 0;
    let cycleSlot = 0;
    let direction = 1;
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
    }
    else if (mode === 'once') {
        cycleDuration = animation.frames * frameDuration;
        const clampedTime = Math.min(cycleDuration, Math.max(0, scaledTime));
        completed = clampedTime >= cycleDuration;
        if (completed) {
            localFrame = animation.frames - 1;
            cycleSlot = localFrame;
            frameElapsed = frameDuration;
            progress = 1;
        }
        else {
            localFrame = frameSlotAt(clampedTime, frameDuration, animation.frames);
            cycleSlot = localFrame;
            frameElapsed = elapsedWithinFrame(clampedTime, localFrame, frameDuration);
            progress = clampedTime / cycleDuration;
        }
    }
    else {
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
export function sampleSpriteAnimationFrame(sheet, animationName, timeSeconds, options = {}) {
    return sampleSpriteAnimation(sheet, animationName, timeSeconds, options).localFrame;
}
//# sourceMappingURL=sampling.js.map
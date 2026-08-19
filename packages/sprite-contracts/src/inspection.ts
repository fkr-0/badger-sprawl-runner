import {
	collectArcadeSpriteAnimationEvents,
	resolveArcadeSpriteFrame,
} from '@arcade/runtime/sprites';
import type { ArcadeSpriteFrameAddress } from '@arcade/runtime/sprites';
import type { ArcadeAnimationMode } from '@arcade/runtime/animation';
import {
	type SpriteAtlasDimensions,
	type SpriteSheetDimensionAudit,
	auditSpriteAtlasDimensions,
	createSpriteAtlasAssemblyPlan,
	deriveSpriteAtlasLayout,
} from './production';
import { type SpriteAnimationSample, sampleSpriteAnimation } from './sampling';
import type { AnimationDef, SpriteAnimationEvent, SpriteSheet } from './types';

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

function requireAnimation(sheet: SpriteSheet, animationName: string): AnimationDef {
	const animation = sheet.animations[animationName];
	if (!animation) throw new Error(`Unknown sprite animation: ${sheet.id}:${animationName}`);
	return animation;
}

function resolveMode(animation: AnimationDef, mode?: ArcadeAnimationMode): ArcadeAnimationMode {
	return mode ?? (animation.loop === false ? 'once' : 'loop');
}

function timelineSequence(frameCount: number, mode: ArcadeAnimationMode): readonly number[] {
	const forward = Array.from({ length: frameCount }, (_, index) => index);
	if (mode !== 'pingpong' || frameCount <= 1) return Object.freeze(forward);
	const reverse = Array.from({ length: frameCount - 2 }, (_, index) => frameCount - 2 - index);
	return Object.freeze([...forward, ...reverse]);
}

function stableTime(value: number): number {
	return Number(value.toFixed(12));
}

/** Compile one animation into an inspectable sequence of addressed frame slots. */
export function createSpriteAnimationTimeline(
	sheet: SpriteSheet,
	animationName: string,
	mode?: ArcadeAnimationMode
): SpriteAnimationTimeline {
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
			direction:
				resolvedMode === 'pingpong' && slot >= animation.frames - 1 && animation.frames > 1
					? (-1 as const)
					: (1 as const),
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
export function inspectSpriteAnimation(
	sheet: SpriteSheet,
	animationName: string,
	timeSeconds: number,
	mode?: ArcadeAnimationMode
): SpriteAnimationInspection {
	const timeline = createSpriteAnimationTimeline(sheet, animationName, mode);
	const sample = sampleSpriteAnimation(sheet, animationName, timeSeconds, { mode: timeline.mode });
	const current = timeline.frames[sample.cycleSlot];
	if (!current) throw new Error(`Unable to inspect sprite slot: ${sheet.id}:${animationName}`);
	return Object.freeze({ sample, timeline, current });
}

/** Build a compact sheet-level inspection report for tooling and test harnesses. */
export function inspectSpriteSheet(
	sheet: SpriteSheet,
	actualDimensions?: SpriteAtlasDimensions
): SpriteSheetInspection {
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

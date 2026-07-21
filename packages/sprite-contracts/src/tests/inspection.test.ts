import { describe, expect, it } from 'vitest';
import {
	createSpriteAnimationTimeline,
	inspectSpriteAnimation,
	inspectSpriteSheet,
} from '../inspection';
import type { SpriteSheet } from '../types';

const sheet: SpriteSheet = {
	id: 'inspectable',
	file: 'inspectable.png',
	frameSize: [16, 24],
	animations: {
		idle: {
			frames: 4,
			fps: 10,
			events: [{ frame: 2, kind: 'sound', name: 'tick' }],
		},
		attack: { frames: 3, fps: 5, loop: false },
	},
};

describe('sprite inspection contracts', () => {
	it('compiles ping-pong slots with addresses, direction, and events', () => {
		const timeline = createSpriteAnimationTimeline(sheet, 'idle', 'pingpong');

		expect(timeline.frames.map((frame) => frame.localFrame)).toEqual([0, 1, 2, 3, 2, 1]);
		expect(timeline.frames.map((frame) => frame.direction)).toEqual([1, 1, 1, -1, -1, -1]);
		expect(timeline.frames[2]).toMatchObject({
			startsAt: 0.2,
			endsAt: 0.3,
			address: { sourceX: 32, sourceY: 0 },
			events: [{ frame: 2, kind: 'sound', name: 'tick' }],
		});
		expect(timeline.cycleDuration).toBeCloseTo(0.6);
	});

	it('matches absolute-time samples to their timeline slot', () => {
		const inspection = inspectSpriteAnimation(sheet, 'idle', 0.45, 'pingpong');

		expect(inspection.sample).toMatchObject({
			cycleSlot: 4,
			localFrame: 2,
			direction: -1,
		});
		expect(inspection.current).toMatchObject({ slot: 4, localFrame: 2, direction: -1 });
	});

	it('summarizes atlas usage, animation durations, events, and exact dimensions', () => {
		const inspection = inspectSpriteSheet(sheet, { width: 64, height: 48 });

		expect(inspection).toMatchObject({
			sheetId: 'inspectable',
			animationCount: 2,
			totalFrames: 7,
			totalEvents: 1,
			usedCellCount: 7,
			unusedCellCount: 1,
			dimensionAudit: { ok: true },
		});
		expect(inspection.animations).toEqual([
			expect.objectContaining({ name: 'idle', mode: 'loop', duration: 0.4 }),
			expect.objectContaining({ name: 'attack', mode: 'once', duration: 0.6 }),
		]);
	});
});

import { describe, expect, it } from 'vitest';
import { sampleSpriteAnimation, sampleSpriteAnimationFrame } from '../sampling';
import type { SpriteSheet } from '../types';

const sheet: SpriteSheet = {
	id: 'sampled',
	file: 'sampled.png',
	frameSize: [16, 24],
	animations: {
		idle: { frames: 4, fps: 10 },
		attack: { frames: 3, fps: 10, loop: false },
		ordered: { frames: 3, fps: 5, order: [2, 0, 1] },
	},
};

describe('stateless sprite animation sampling', () => {
	it('samples looping animations with normalized cycle progress', () => {
		const sample = sampleSpriteAnimation(sheet, 'idle', 0.25);

		expect(sample).toMatchObject({
			cycleSlot: 2,
			localFrame: 2,
			absoluteFrame: 2,
			direction: 1,
			completed: false,
			mode: 'loop',
		});
		expect(sample.frameElapsed).toBeCloseTo(0.05);
		expect(sample.progress).toBeCloseTo(0.625);
		expect(sample.address).toMatchObject({ sourceX: 32, sourceY: 0 });
	});

	it('clamps one-shot animations to a completed final frame', () => {
		const sample = sampleSpriteAnimation(sheet, 'attack', 0.5);

		expect(sample).toMatchObject({
			localFrame: 2,
			absoluteFrame: 2,
			completed: true,
			progress: 1,
			mode: 'once',
		});
		expect(sample.frameElapsed).toBeCloseTo(0.1);
	});

	it('samples ping-pong sequences without duplicating endpoint slots', () => {
		const sample = sampleSpriteAnimation(sheet, 'idle', 0.45, { mode: 'pingpong' });

		expect(sample.localFrame).toBe(2);
		expect(sample.cycleSlot).toBe(4);
		expect(sample.direction).toBe(-1);
		expect(sample.cycleDuration).toBeCloseTo(0.6);
		expect(sample.progress).toBeCloseTo(0.75);
	});

	it('supports speed and phase offsets while preserving ordered frame addressing', () => {
		const sample = sampleSpriteAnimation(sheet, 'ordered', 0.11, {
			speed: 2,
			phaseOffsetSeconds: 0.2,
		});

		expect(sample.localFrame).toBe(2);
		expect(sample.absoluteFrame).toBe(1);
		expect(sample.address).toMatchObject({ sourceX: 16, sourceY: 48 });
		expect(sampleSpriteAnimationFrame(sheet, 'ordered', 0.4)).toBe(2);
	});

	it('rejects unknown animations instead of silently sampling invalid cells', () => {
		expect(() => sampleSpriteAnimation(sheet, 'missing', 0)).toThrow(
			'Unknown sprite animation: sampled:missing'
		);
	});
});

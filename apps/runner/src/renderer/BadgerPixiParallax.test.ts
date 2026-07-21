import { describe, expect, it } from 'vitest';
import type { LoadedSheet } from '@badger/sprite-contracts';
import {
	resolveBadgerParallaxOffset,
	resolveBadgerProceduralParallaxX,
	resolveBadgerStageParallaxFrames,
} from './BadgerPixiParallax';

describe('Badger retained native parallax', () => {
	it('wraps camera movement into stable paired-strip offsets', () => {
		expect(resolveBadgerParallaxOffset(1000, 0.16, 960)).toBe(-160);
		expect(resolveBadgerParallaxOffset(7000, 0.16, 960)).toBe(-160);
		expect(resolveBadgerParallaxOffset(-1000, 0.16, 960)).toBe(-800);
	});

	it('wraps each procedural element after applying its source position', () => {
		expect(resolveBadgerProceduralParallaxX(2025, 1000, 0.6)).toBe(105);
		expect(resolveBadgerProceduralParallaxX(50, 1000, 0.6)).toBe(530);
	});

	it('uses Arcade Runtime frame addressing for the three authored plates', () => {
		const sheet = {
			sheet: {
				id: 'test-parallax',
				file: 'test.png',
				frameSize: [320, 180],
				grid: { columns: 3, rows: 1 },
				animations: {
					back_plate: { frames: 1, fps: 1, order: [0] },
					mid_plate: { frames: 1, fps: 1, order: [1] },
					front_plate: { frames: 1, fps: 1, order: [2] },
				},
			},
		} as unknown as LoadedSheet;

		expect(
			resolveBadgerStageParallaxFrames(sheet).map(({ animation, frame }) => ({
				animation,
				sourceX: frame.sourceX,
				sourceY: frame.sourceY,
			}))
		).toEqual([
			{ animation: 'back_plate', sourceX: 0, sourceY: 0 },
			{ animation: 'mid_plate', sourceX: 320, sourceY: 0 },
			{ animation: 'front_plate', sourceX: 640, sourceY: 0 },
		]);
	});
});

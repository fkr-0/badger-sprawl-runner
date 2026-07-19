import { describe, expect, it, vi } from 'vitest';
import type { SpriteRenderer } from './SpriteRenderer';
import { VFXPool } from './VFXPool';

describe('VFXPool arcade-runtime recycling facade', () => {
	it('recycles fixed capacity and expires particles in place', () => {
		const pool = new VFXPool(3, () => 0.5);
		pool.emit(10, 20, 'dust', 5, 4);
		expect(pool.getStats()).toEqual({
			capacity: 3,
			activeParticles: 3,
			emittedParticles: 5,
			recycledParticles: 2,
		});

		pool.update(1.1);
		expect(pool.getStats().activeParticles).toBe(0);
	});

	it('renders authored combat sprites when the VFX sheet is loaded', () => {
		const pool = new VFXPool(4, () => 0.25);
		pool.emit(40, 60, 'emp', 1, 0);
		const drawFrameTo = vi.fn();
		const spriteRenderer = {
			getSheet: (id: string) =>
				id === 'vfx_combat'
					? {
							sheet: {
								frameSize: [48, 48],
								animations: { emp_spark: { frames: 6 } },
							},
						}
					: undefined,
			drawFrameTo,
		} as unknown as SpriteRenderer;
		const ctx = {
			save: vi.fn(),
			restore: vi.fn(),
			globalAlpha: 1,
		} as unknown as CanvasRenderingContext2D;

		pool.render(ctx, 10, spriteRenderer);
		expect(drawFrameTo).toHaveBeenCalledWith(
			ctx,
			'vfx_combat',
			'emp_spark',
			0,
			expect.any(Number),
			expect.any(Number),
			false,
			expect.any(Number),
			expect.any(Number)
		);
	});
});

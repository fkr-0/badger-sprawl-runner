import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import type { Particle } from './VFXPool';
import type { VFXRenderSource } from './VFXPool';
import { createBadgerPixiVfx, resolveBadgerPixiVfxParticle } from './BadgerPixiVfx';

const particle: Particle = {
	x: 150,
	y: 80,
	vx: 0,
	vy: 0,
	life: 0.25,
	maxLife: 1,
	kind: 'emp',
	color: '#67f3c4',
	size: 8,
};

describe('Badger native Pixi VFX model', () => {
	it('projects shared VFX simulation state into screen-space presentation', () => {
		expect(resolveBadgerPixiVfxParticle(particle, 50)).toEqual({
			x: 100,
			y: 80,
			alpha: 0.5,
			radius: 36,
			color: '#67f3c4',
			kind: 'emp',
		});
	});

	it('clamps expired and overbright particle presentation safely', () => {
		expect(resolveBadgerPixiVfxParticle({ ...particle, life: -1 }, 0).alpha).toBe(0);
		expect(resolveBadgerPixiVfxParticle({ ...particle, life: 2 }, 0).alpha).toBe(1);
	});

	it('uses the shared bounded Pixi frame pool without aliasing active particles', () => {
		const root = new Container();
		const renderer = createBadgerPixiVfx({ container: root, maxCapacity: 2 });
		const source: VFXRenderSource = {
			forEachActive(visitor) {
				visitor(particle);
				visitor({ ...particle, x: 175 });
				visitor({ ...particle, x: 200 });
			},
		};

		const snapshot = renderer.render(source, 50);
		expect(snapshot).toMatchObject({
			active: 2,
			capacity: 2,
			frameDropped: 1,
			dropped: 1,
			renderedParticles: 2,
		});
		expect(root.children).toHaveLength(2);
		expect(renderer.destroy()).toBe(true);
	});
});

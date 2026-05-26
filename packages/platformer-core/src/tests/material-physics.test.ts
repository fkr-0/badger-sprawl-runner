import { describe, expect, it } from 'vitest';
import { applySurfaceMaterial, materialHasTag, sampleMaterialContact, type MaterialZone } from '../index';

const ice: MaterialZone = {
	x: 0,
	y: 0,
	w: 100,
	h: 20,
	priority: 1,
	material: { id: 'ice', friction: 0.05, traction: 0.25, restitution: 0, tags: ['slippery'] },
};

const acid: MaterialZone = {
	x: 10,
	y: 0,
	w: 100,
	h: 20,
	priority: 2,
	material: { id: 'acid', friction: 1, traction: 1, restitution: 0, damagePerSecond: 6, tags: ['hazard'] },
};

describe('material physics', () => {
	it('samples highest-priority overlapping material deterministically', () => {
		const contact = sampleMaterialContact({ x: 12, y: 5, w: 10, h: 10 }, [ice, acid]);

		expect(contact?.material.id).toBe('acid');
		expect(contact?.overlapArea).toBe(100);
		expect(materialHasTag(contact!.material, 'hazard')).toBe(true);
	});

	it('applies friction, conveyor, restitution, and damage from material zones', () => {
		const zone: MaterialZone = {
			x: 0,
			y: 0,
			w: 100,
			h: 20,
			material: {
				id: 'spring-belt',
				friction: 0.5,
				traction: 1,
				restitution: 0.75,
				conveyorX: 30,
				damagePerSecond: 2,
			},
		};

		const result = applySurfaceMaterial({ x: 5, y: 5, w: 10, h: 10, vx: 100, vy: 80, onGround: true }, [zone], 0.5);

		expect(result.body.vx).toBe(90);
		expect(result.body.vy).toBe(-60);
		expect(result.damage).toBe(1);
	});
});

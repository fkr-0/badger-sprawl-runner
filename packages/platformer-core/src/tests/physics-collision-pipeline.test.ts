import { describe, expect, it } from 'vitest';
import { resolveCollisionPipeline, type CollisionPipelineBody } from '../index';

const bodies: CollisionPipelineBody[] = [
	{ id: 'a', x: 0, y: 0, w: 10, h: 10, vx: 10, vy: 0, mass: 1, restitution: 1, friction: 0, layer: 'body', mask: ['body'] },
	{ id: 'b', x: 8, y: 0, w: 10, h: 10, vx: -10, vy: 0, mass: 1, restitution: 1, friction: 0, layer: 'body', mask: ['body'] },
	{ id: 'ghost', x: 8, y: 0, w: 10, h: 10, vx: 0, vy: 0, mass: 1, layer: 'ghost', mask: ['ghost'] },
];

describe('physics collision pipeline', () => {
	it('builds pairs, manifolds, and impulses in deterministic order', () => {
		const result = resolveCollisionPipeline([...bodies].reverse(), 16);

		expect(result.manifolds).toEqual([
			{ a: 'a', b: 'b', normalX: 1, normalY: 0, penetration: 2, overlapX: 2, overlapY: 10 },
		]);
		expect(result.impulses[0]?.contactId).toBe('a\u0000b');
		expect(result.bodies.find((body) => body.id === 'a')?.vx).toBe(-10);
		expect(result.bodies.find((body) => body.id === 'b')?.vx).toBe(10);
	});
});

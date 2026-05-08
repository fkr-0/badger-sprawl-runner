import { describe, it, expect } from 'vitest';
import { aabb } from '../systems/aabb';

describe('AABB collision', () => {
	it('detects basic intersection', () => {
		expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
	});

	it('returns false for far right', () => {
		expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 })).toBe(false);
	});

	it('returns false for below', () => {
		expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 20, w: 10, h: 10 })).toBe(false);
	});

	it('returns false for touching edge exactly', () => {
		expect(aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
	});

	it('detects when one box is inside another', () => {
		expect(aabb({ x: 5, y: 5, w: 5, h: 5 }, { x: 0, y: 0, w: 20, h: 20 })).toBe(true);
	});
});

import { describe, expect, it } from 'vitest';
import { deterministicHash, stableSnapshotString } from '../index';

describe('deterministic snapshots', () => {
	it('normalizes object key order and floating point noise', () => {
		const a = { b: 2, a: 1.0000004, nested: { y: true, x: 3 } };
		const b = { nested: { x: 3, y: true }, a: 1.0000003, b: 2 };

		expect(stableSnapshotString(a)).toBe(stableSnapshotString(b));
		expect(deterministicHash(a)).toBe(deterministicHash(b));
	});

	it('can ignore volatile keys like render-only timestamps', () => {
		const first = { id: 'player', x: 10, renderTime: 1 };
		const second = { id: 'player', x: 10, renderTime: 2 };

		expect(deterministicHash(first, { ignoreKeys: ['renderTime'] })).toBe(deterministicHash(second, { ignoreKeys: ['renderTime'] }));
	});
});

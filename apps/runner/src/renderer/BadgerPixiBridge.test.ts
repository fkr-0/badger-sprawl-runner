import { describe, expect, it } from 'vitest';
import { isBadgerPixiBridgeRequested } from './BadgerPixiBridge';

describe('Badger Pixi bridge opt-in', () => {
	it('is off by default and supports renderer and legacy query flags', () => {
		expect(isBadgerPixiBridgeRequested('')).toBe(false);
		expect(isBadgerPixiBridgeRequested('?renderer=canvas')).toBe(false);
		expect(isBadgerPixiBridgeRequested('?renderer=bridge')).toBe(true);
		expect(isBadgerPixiBridgeRequested('?pixiBridge=1')).toBe(true);
	});
});

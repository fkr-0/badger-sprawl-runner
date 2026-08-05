import { describe, expect, it } from 'vitest';
import {
	BADGER_HARDWARE_BUDGETS,
	BADGER_PRODUCTION_BUNDLE_RESOURCE_PATTERN,
	createBadgerHardwareBudgetMonitor,
} from './RendererHardwareBudget';

describe('Badger hardware renderer budgets', () => {
	it('counts production chunks without treating Vite development modules as shipped bundles', () => {
		expect(BADGER_PRODUCTION_BUNDLE_RESOURCE_PATTERN.test('/assets/main-abc123.js')).toBe(true);
		expect(BADGER_PRODUCTION_BUNDLE_RESOURCE_PATTERN.test('/assets/runtime.mjs?cache=1')).toBe(
			true
		);
		expect(
			BADGER_PRODUCTION_BUNDLE_RESOURCE_PATTERN.test('/node_modules/.vite/deps/pixi_js.js')
		).toBe(false);
		expect(BADGER_PRODUCTION_BUNDLE_RESOURCE_PATTERN.test('/src/main.ts')).toBe(false);
	});

	it('selects hardware tiers and budgets one full-size terrain upload', () => {
		expect(createBadgerHardwareBudgetMonitor({ deviceMemory: 2, hardwareConcurrency: 4 }).tier).toBe(
			'low'
		);
		expect(
			createBadgerHardwareBudgetMonitor({ deviceMemory: 16, hardwareConcurrency: 16 }).tier
		).toBe('high');
		expect(BADGER_HARDWARE_BUDGETS.balanced.uploadBytesPerFrame).toBeGreaterThan(
			1280 * 720 * 4
		);
	});
});

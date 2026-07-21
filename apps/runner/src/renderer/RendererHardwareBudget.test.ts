import { describe, expect, it } from 'vitest';
import {
	BADGER_HARDWARE_BUDGETS,
	createBadgerHardwareBudgetMonitor,
} from './RendererHardwareBudget';

describe('Badger hardware renderer budgets', () => {
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

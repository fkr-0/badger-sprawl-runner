import { describe, expect, it } from 'vitest';
import {
	createBadgerRenderBudgetMonitor,
	evaluateBadgerRenderBudget,
	getBadgerRenderBudgetName,
} from './RendererPerformanceBudget';

describe('Badger renderer performance budgets', () => {
	it('reports a stable sampled Canvas run as inside the migration guardrail', () => {
		const monitor = createBadgerRenderBudgetMonitor();
		for (let frame = 0; frame < 90; frame += 1) monitor.record('canvas:stage', 10);

		const result = evaluateBadgerRenderBudget(monitor, 'canvas');
		expect(result.name).toBe('canvas:stage');
		expect(result.pass).toBe(true);
		expect(result.summary.count).toBe(90);
		expect(result.violations).toEqual([]);
	});

	it('retains mode-specific names and reports bridge regressions', () => {
		const monitor = createBadgerRenderBudgetMonitor();
		for (let frame = 0; frame < 90; frame += 1) monitor.record('bridge:stage', 700);

		expect(getBadgerRenderBudgetName('bridge')).toBe('bridge:stage');
		const result = evaluateBadgerRenderBudget(monitor, 'bridge');
		expect(result.pass).toBe(false);
		expect(result.violations.map((violation) => violation.metric)).toEqual([
			'meanMs',
			'p95Ms',
			'maxMs',
		]);
	});
});

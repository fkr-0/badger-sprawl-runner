import {
	createPerformanceBudgetMonitor,
	type ArcadePerformanceSummary,
	type PerformanceBudget,
} from '../../../../vendor/arcade-runtime.mjs';

export type BadgerRendererMode = 'canvas' | 'bridge';

export interface BadgerRenderBudgetViolation {
	metric: 'meanMs' | 'p95Ms' | 'maxMs' | 'count';
	budget: number;
	actual: number;
}

export interface BadgerRenderBudgetResult {
	name: string;
	pass: boolean;
	summary: ArcadePerformanceSummary;
	budget: Readonly<PerformanceBudget>;
	violations: readonly BadgerRenderBudgetViolation[];
}

export const BADGER_RENDER_BUDGETS = Object.freeze({
	'canvas:stage': Object.freeze({
		meanMs: 35,
		p95Ms: 120,
		maxMs: 300,
		minimumSamples: 90,
	}),
	'bridge:stage': Object.freeze({
		meanMs: 80,
		p95Ms: 250,
		maxMs: 600,
		minimumSamples: 90,
	}),
});

export function getBadgerRenderBudgetName(mode: BadgerRendererMode): keyof typeof BADGER_RENDER_BUDGETS {
	return mode === 'bridge' ? 'bridge:stage' : 'canvas:stage';
}

export function createBadgerRenderBudgetMonitor() {
	return createPerformanceBudgetMonitor({
		budgets: BADGER_RENDER_BUDGETS,
		sampleSize: 240,
	});
}

export function evaluateBadgerRenderBudget(
	monitor: ReturnType<typeof createBadgerRenderBudgetMonitor>,
	mode: BadgerRendererMode
): BadgerRenderBudgetResult {
	return monitor.evaluate(getBadgerRenderBudgetName(mode)) as unknown as BadgerRenderBudgetResult;
}

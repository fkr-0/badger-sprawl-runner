import type { Rect } from '../types';
import { aabb } from './aabb';
import type { SweptObstacle } from './sweptAabb';

export type LedgeCorrectionResultKind = 'unchanged' | 'corrected' | 'blocked';
export type LedgeCorrectionEventKind = 'horizontal-corner' | 'vertical-head-bump' | 'vertical-corner';

export interface LedgeCorrectionVelocity {
	vx: number;
	vy: number;
}

export interface LedgeCorrectionEvent {
	kind: LedgeCorrectionEventKind;
	obstacleId: string;
	dx: number;
	dy: number;
}

export interface LedgeCorrectionInput {
	body: Rect;
	intendedVelocity: LedgeCorrectionVelocity;
	obstacles: ReadonlyArray<SweptObstacle>;
	maxCorrectionPixels: number;
	epsilon?: number;
}

export interface LedgeCorrectionOutput {
	result: LedgeCorrectionResultKind;
	x: number;
	y: number;
	event: LedgeCorrectionEvent | null;
	blockedBy?: string;
}

interface CorrectionCandidate {
	dx: number;
	dy: number;
	kind: LedgeCorrectionEventKind;
	obstacleId: string;
	priority: number;
}

function movedRect(input: LedgeCorrectionInput): Rect {
	return {
		x: input.body.x + input.intendedVelocity.vx,
		y: input.body.y + input.intendedVelocity.vy,
		w: input.body.w,
		h: input.body.h,
	};
}

function sortedObstacles(obstacles: ReadonlyArray<SweptObstacle>): SweptObstacle[] {
	return [...obstacles].sort((a, b) => a.id.localeCompare(b.id) || a.x - b.x || a.y - b.y || a.w - b.w || a.h - b.h);
}

function firstOverlap(rect: Rect, obstacles: ReadonlyArray<SweptObstacle>): SweptObstacle | null {
	for (const obstacle of sortedObstacles(obstacles)) {
		if (!obstacle.oneWay && aabb(rect, obstacle)) return obstacle;
	}
	return null;
}

function isClear(rect: Rect, obstacles: ReadonlyArray<SweptObstacle>): boolean {
	return firstOverlap(rect, obstacles) === null;
}

function within(value: number, max: number): boolean {
	return Math.abs(value) <= max + 1e-9;
}

function addCandidate(candidates: CorrectionCandidate[], candidate: CorrectionCandidate, maxCorrectionPixels: number): void {
	if (!within(candidate.dx, maxCorrectionPixels) || !within(candidate.dy, maxCorrectionPixels)) return;
	if (candidate.dx === 0 && candidate.dy === 0) return;
	candidates.push({ ...candidate, dx: Number(candidate.dx.toFixed(6)), dy: Number(candidate.dy.toFixed(6)) });
}

function buildCandidates(input: LedgeCorrectionInput, rect: Rect, obstacle: SweptObstacle): CorrectionCandidate[] {
	const epsilon = input.epsilon ?? 0.001;
	const candidates: CorrectionCandidate[] = [];
	const max = input.maxCorrectionPixels;
	const { vx, vy } = input.intendedVelocity;

	if (vx !== 0) {
		addCandidate(candidates, { dx: 0, dy: obstacle.y - (rect.y + rect.h) - epsilon, kind: 'horizontal-corner', obstacleId: obstacle.id, priority: 0 }, max);
		addCandidate(candidates, { dx: 0, dy: obstacle.y + obstacle.h - rect.y + epsilon, kind: 'horizontal-corner', obstacleId: obstacle.id, priority: 1 }, max);
	}

	if (vy !== 0) {
		const preferred = vx === 0 ? 0 : vx > 0 ? 0 : 1;
		addCandidate(candidates, { dx: obstacle.x - (rect.x + rect.w) - epsilon, dy: 0, kind: vy < 0 ? 'vertical-head-bump' : 'vertical-corner', obstacleId: obstacle.id, priority: preferred }, max);
		addCandidate(candidates, { dx: obstacle.x + obstacle.w - rect.x + epsilon, dy: 0, kind: vy < 0 ? 'vertical-head-bump' : 'vertical-corner', obstacleId: obstacle.id, priority: preferred === 0 ? 1 : 0 }, max);
	}

	return candidates.sort((a, b) => Math.abs(a.dx) + Math.abs(a.dy) - (Math.abs(b.dx) + Math.abs(b.dy)) || a.priority - b.priority || a.kind.localeCompare(b.kind) || a.obstacleId.localeCompare(b.obstacleId) || a.dx - b.dx || a.dy - b.dy);
}

export function resolveLedgeCorrection(input: LedgeCorrectionInput): LedgeCorrectionOutput {
	if (!Number.isFinite(input.maxCorrectionPixels) || input.maxCorrectionPixels < 0) throw new Error(`Invalid maxCorrectionPixels: ${input.maxCorrectionPixels}`);
	if (!Number.isFinite(input.intendedVelocity.vx) || !Number.isFinite(input.intendedVelocity.vy)) throw new Error(`Invalid intendedVelocity: ${input.intendedVelocity.vx},${input.intendedVelocity.vy}`);

	const rect = movedRect(input);
	const overlap = firstOverlap(rect, input.obstacles);
	if (!overlap) return { result: 'unchanged', x: rect.x, y: rect.y, event: null };

	for (const candidate of buildCandidates(input, rect, overlap)) {
		const corrected = { ...rect, x: rect.x + candidate.dx, y: rect.y + candidate.dy };
		if (!isClear(corrected, input.obstacles)) continue;
		return {
			result: 'corrected',
			x: corrected.x,
			y: corrected.y,
			event: { kind: candidate.kind, obstacleId: candidate.obstacleId, dx: candidate.dx, dy: candidate.dy },
		};
	}

	return { result: 'blocked', x: rect.x, y: rect.y, event: null, blockedBy: overlap.id };
}

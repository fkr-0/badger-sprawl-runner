import { describe, expect, it } from 'vitest';
import { resolveLedgeCorrection } from '../index';

const body = { x: 0, y: 0, w: 10, h: 10 };

describe('ledge correction system', () => {
	it('applies horizontal corner correction within threshold', () => {
		const result = resolveLedgeCorrection({ body, intendedVelocity: { vx: 9, vy: 0 }, obstacles: [{ id: 'ledge', x: 18, y: 9, w: 10, h: 10 }], maxCorrectionPixels: 2 });
		expect(result.result).toBe('corrected');
		expect(result.event).toMatchObject({ kind: 'horizontal-corner', obstacleId: 'ledge', dy: -1.001 });
	});

	it('applies vertical head-bump correction within threshold', () => {
		const result = resolveLedgeCorrection({ body, intendedVelocity: { vx: 0, vy: -9 }, obstacles: [{ id: 'ceiling-chip', x: 9, y: -18, w: 10, h: 10 }], maxCorrectionPixels: 2 });
		expect(result.result).toBe('corrected');
		expect(result.event).toMatchObject({ kind: 'vertical-head-bump', obstacleId: 'ceiling-chip', dx: -1.001 });
	});

	it('blocks when no correction fits within threshold', () => {
		const result = resolveLedgeCorrection({ body, intendedVelocity: { vx: 9, vy: 0 }, obstacles: [{ id: 'fat-block', x: 18, y: 6, w: 10, h: 10 }], maxCorrectionPixels: 2 });
		expect(result).toMatchObject({ result: 'blocked', blockedBy: 'fat-block' });
	});

	it('uses deterministic obstacle id tie-breaks', () => {
		const result = resolveLedgeCorrection({ body, intendedVelocity: { vx: 9, vy: 0 }, obstacles: [{ id: 'zeta', x: 18, y: 9, w: 10, h: 10 }, { id: 'alpha', x: 18, y: 9, w: 10, h: 10 }], maxCorrectionPixels: 2 });
		expect(result.event?.obstacleId).toBe('alpha');
	});
});

import { describe, expect, it } from 'vitest';
import { EnemyReportLedger } from './EnemyReportLedger';

describe('EnemyReportLedger', () => {
	it('clusters compatible witnesses into one more trusted local claim', () => {
		const ledger = new EnemyReportLedger();
		ledger.report({ cellId: 'mirror:0', sourceId: 'usher-a', x: 300, y: 420, confidence: 0.7 });
		const consensus = ledger.report({
			cellId: 'mirror:0',
			sourceId: 'usher-b',
			x: 340,
			y: 425,
			confidence: 0.8,
		});

		expect(consensus).toMatchObject({
			primarySourceId: 'usher-b',
			trust: 1,
			conflict: 0,
			reportCount: 2,
		});
		expect(consensus.x).toBeGreaterThan(300);
		expect(consensus.x).toBeLessThan(340);
	});

	it('keeps the strongest coherent story and exposes contradictory uncertainty', () => {
		const ledger = new EnemyReportLedger({
			contradictionDistance: 150,
			decayRate: 0.1,
			minimumConfidence: 0.01,
		});
		ledger.report({ cellId: 'palace:1', sourceId: 'staff-eye', x: 260, y: 410, confidence: 0.9 });
		const consensus = ledger.report({
			cellId: 'palace:1',
			sourceId: 'spoofed-mirror',
			x: 760,
			y: 410,
			confidence: 0.7,
		});

		expect(consensus.primarySourceId).toBe('staff-eye');
		expect(consensus.x).toBe(260);
		expect(consensus.trust).toBeLessThan(0.7);
		expect(consensus.conflict).toBeGreaterThan(0.3);
		expect(consensus.confidence).toBeLessThan(0.9);
	});

	it('lets stale reports expire so a patrol can return to uncertainty', () => {
		const ledger = new EnemyReportLedger({
			contradictionDistance: 150,
			decayRate: 1,
			minimumConfidence: 0.05,
		});
		ledger.report({ cellId: 'colony:2', sourceId: 'crown-eye', x: 400, y: 390, confidence: 0.4 });
		ledger.decay(0.5);

		expect(ledger.resolve('colony:2')).toBeNull();
	});
});

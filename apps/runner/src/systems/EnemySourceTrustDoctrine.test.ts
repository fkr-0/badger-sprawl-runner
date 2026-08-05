import { describe, expect, it } from 'vitest';
import { applyEnemySourceTrust, resolveEnemySourceTrust } from './EnemySourceTrustDoctrine';

describe('EnemySourceTrustDoctrine', () => {
	it('makes Antenna enforcement trust forecast hardware more than listener testimony', () => {
		expect(resolveEnemySourceTrust('antenna-barrens', 'sensor')).toMatchObject({
			doctrineLabel: 'PREDICTION OUTRANKS TESTIMONY',
			weight: 1,
		});
		expect(resolveEnemySourceTrust('antenna-barrens', 'civilian-witness').weight).toBeLessThan(
			0.5
		);
	});

	it('makes the Lift privilege cargo authority over passenger testimony', () => {
		const sensor = applyEnemySourceTrust('orbital-lift', 'sensor', 0.8);
		const passenger = applyEnemySourceTrust('orbital-lift', 'civilian-witness', 0.8);

		expect(sensor.adjustedConfidence).toBe(0.8);
		expect(passenger.adjustedConfidence).toBeLessThan(0.4);
		expect(sensor.doctrineLabel).toBe('THE MANIFEST SPEAKS BEFORE THE PASSENGER');
	});

	it('discounts a compromised executive eye even inside Skylock doctrine', () => {
		const trusted = applyEnemySourceTrust('asteroid-redoubt', 'sensor', 0.9);
		const spoofed = applyEnemySourceTrust('asteroid-redoubt', 'spoofed-sensor', 0.9);

		expect(trusted.adjustedConfidence).toBe(0.9);
		expect(spoofed.adjustedConfidence).toBeCloseTo(0.27);
		expect(spoofed.adjustedConfidence).toBeLessThan(trusted.adjustedConfidence);
	});
});

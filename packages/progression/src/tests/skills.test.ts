import { describe, it, expect } from 'vitest';
import { computeDerivedStats } from '../SkillTree';

describe('computeDerivedStats', () => {
	it('computes baseline stats with zero attributes', () => {
		const stats = computeDerivedStats({});
		expect(stats.hp).toBe(5);
		expect(stats.clawDamage).toBe(1);
		expect(stats.katanaDamage).toBe(2);
		expect(stats.railDamage).toBe(3);
		expect(stats.maxSpeed).toBe(285);
		expect(stats.hackTimeBonus).toBe(0.8);
		expect(stats.shopDiscount).toBe(0);
		expect(stats.companionSyncRate).toBe(0.5);
		expect(stats.rallyWindow).toBe(1.2);
	});

	it('scales hp with vigor attribute', () => {
		const lowVigor = computeDerivedStats({ vigor: 0 });
		const mediumVigor = computeDerivedStats({ vigor: 5 });
		const highVigor = computeDerivedStats({ vigor: 10 });

		expect(lowVigor.hp).toBe(5);
		expect(mediumVigor.hp).toBe(5 + 5 * 2);
		expect(highVigor.hp).toBe(5 + 10 * 2);
	});

	it('scales weapon damage with sinew attribute', () => {
		const noSinew = computeDerivedStats({ sinew: 0 });
		const mediumSinew = computeDerivedStats({ sinew: 5 });
		const highSinew = computeDerivedStats({ sinew: 10 });

		// Claw: 1 + sinew * 0.5
		expect(noSinew.clawDamage).toBe(1);
		expect(mediumSinew.clawDamage).toBe(1 + 5 * 0.5);
		expect(highSinew.clawDamage).toBe(1 + 10 * 0.5);

		// Katana: 2 + sinew * 0.75
		expect(noSinew.katanaDamage).toBe(2);
		expect(mediumSinew.katanaDamage).toBe(2 + 5 * 0.75);
		expect(highSinew.katanaDamage).toBe(2 + 10 * 0.75);
	});

	it('scales rail damage with voltage attribute', () => {
		const noVoltage = computeDerivedStats({ voltage: 0 });
		const mediumVoltage = computeDerivedStats({ voltage: 5 });

		// Rail: 3 + voltage * 0.5
		expect(noVoltage.railDamage).toBe(3);
		expect(mediumVoltage.railDamage).toBe(3 + 5 * 0.5);
	});

	it('scales max speed with velocity attribute', () => {
		const noVelocity = computeDerivedStats({ velocity: 0 });
		const mediumVelocity = computeDerivedStats({ velocity: 10 });
		const highVelocity = computeDerivedStats({ velocity: 20 });

		expect(noVelocity.maxSpeed).toBe(285);
		expect(mediumVelocity.maxSpeed).toBe(285 + 10 * 10);
		expect(highVelocity.maxSpeed).toBe(285 + 20 * 10);
	});

	it('reduces hack time with cortex attribute', () => {
		const noCortex = computeDerivedStats({ cortex: 0 });
		const mediumCortex = computeDerivedStats({ cortex: 5 });
		const maxCortex = computeDerivedStats({ cortex: 10 });

		// hackTimeBonus: 0.8 - cortex * 0.05 (lower is better = faster hacking)
		expect(noCortex.hackTimeBonus).toBe(0.8);
		expect(mediumCortex.hackTimeBonus).toBe(0.8 - 5 * 0.05);
		expect(maxCortex.hackTimeBonus).toBe(0.8 - 10 * 0.05);
	});

	it('caps shop discount at 30% maximum', () => {
		const noGuile = computeDerivedStats({ guile: 0 });
		const smallGuile = computeDerivedStats({ guile: 5 });
		const largeGuile = computeDerivedStats({ guile: 20 }); // Would exceed 30% without cap

		// shopDiscount: Math.min(0.3, guile * 0.02)
		expect(noGuile.shopDiscount).toBe(0);
		expect(smallGuile.shopDiscount).toBe(5 * 0.02);
		expect(largeGuile.shopDiscount).toBe(0.3); // Capped at maximum
	});

	it('scales companion sync rate with bass attribute', () => {
		const noBass = computeDerivedStats({ bass: 0 });
		const mediumBass = computeDerivedStats({ bass: 5 });
		const highBass = computeDerivedStats({ bass: 10 });

		// companionSyncRate: 0.5 + bass * 0.1
		expect(noBass.companionSyncRate).toBe(0.5);
		expect(mediumBass.companionSyncRate).toBe(0.5 + 5 * 0.1);
		expect(highBass.companionSyncRate).toBe(0.5 + 10 * 0.1);
	});

	it('combines multiple attributes correctly', () => {
		const combined = computeDerivedStats({
			vigor: 3,
			sinew: 4,
			voltage: 2,
			velocity: 5,
			cortex: 3,
			bass: 2,
			guile: 8,
		});

		expect(combined.hp).toBe(5 + 3 * 2);
		expect(combined.clawDamage).toBe(1 + 4 * 0.5);
		expect(combined.katanaDamage).toBe(2 + 4 * 0.75);
		expect(combined.railDamage).toBe(3 + 2 * 0.5);
		expect(combined.maxSpeed).toBe(285 + 5 * 10);
		expect(combined.hackTimeBonus).toBe(0.8 - 3 * 0.05);
		expect(combined.shopDiscount).toBe(8 * 0.02);
		expect(combined.companionSyncRate).toBe(0.5 + 2 * 0.1);
	});

	it('preserves rally window as constant', () => {
		const anyStats = computeDerivedStats({
			vigor: 100,
			sinew: 100,
			voltage: 100,
			velocity: 100,
			cortex: 100,
			bass: 100,
			guile: 100,
		});

		expect(anyStats.rallyWindow).toBe(1.2);
	});

	it('handles edge case: very high attributes', () => {
		const stats = computeDerivedStats({
			vigor: 100,
			sinew: 100,
			voltage: 100,
			velocity: 100,
			cortex: 100,
			bass: 100,
			guile: 100,
		});

		// All stats should scale appropriately without errors
		expect(stats.hp).toBeGreaterThan(0);
		expect(stats.clawDamage).toBeGreaterThan(0);
		expect(stats.maxSpeed).toBeGreaterThan(285);
		expect(stats.shopDiscount).toBe(0.3); // Capped
	});
});

import { describe, expect, it } from 'vitest';
import { combineDamagePackets, resolveDamagePacket } from './DamageModel';

describe('DamageModel', () => {
	it('resolves crit, armor pierce, resistance, vulnerability, and guard deterministically', () => {
		const result = resolveDamagePacket(
			{ amount: 10, type: 'slash', crit: true, critMultiplier: 2, armorPierce: 1 },
			{ armor: 3, resistances: { slash: 0.25 }, vulnerabilities: { slash: 0.1 }, guardMultiplier: 0.5 }
		);

		expect(result).toEqual({
			base: 10,
			afterCrit: 20,
			afterArmor: 18,
			afterResistance: 15.3,
			final: 7.65,
			blocked: 12.35,
		});
	});

	it('combines multi-type damage packets into one deterministic resolution', () => {
		const result = combineDamagePackets([
			{ amount: 5, type: 'pierce', armorPierce: 2 },
			{ amount: 2, type: 'true' },
		], { armor: 3, resistances: { pierce: 0.5 } });

		expect(result.final).toBe(4);
		expect(result.blocked).toBe(3);
	});
});

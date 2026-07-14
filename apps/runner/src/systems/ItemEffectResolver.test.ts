import { describe, expect, it } from 'vitest';
import { InventorySystem, type ItemDefinition } from './InventorySystem';
import { flattenRuntimeItemEffects, resolveRuntimeItemEffects } from './ItemEffectResolver';

const catalog: ItemDefinition[] = [
	{ id: 'claws', name: 'Claws', slot: 'melee', rarity: 'starter', tags: ['melee'], effect: 'slash' },
	{ id: 'katana', name: 'Katana', slot: 'melee_upgrade', rarity: 'rare', tags: ['melee'], effect: 'draw' },
	{ id: 'black_ice_tooth', name: 'Black Ice Tooth', slot: 'hack_combat', rarity: 'epic', tags: ['hack'], effect: 'emp' },
	{ id: 'dub_shield', name: 'Dub Shield', slot: 'defense', rarity: 'rare', tags: ['beat'], effect: 'guard' },
	{ id: 'echo_cassette', name: 'Echo Cassette', slot: 'boon', rarity: 'rare', tags: ['decoy'], effect: 'ghost' },
	{ id: 'signal_jammer', name: 'Signal Jammer', slot: 'active', rarity: 'uncommon', tags: ['hack'], effect: 'jam' },
];

describe('ItemEffectResolver', () => {
	it('translates equipped set bonuses into flat runtime physics/combat/hacking hooks', () => {
		const inventory = new InventorySystem(catalog);
		for (const itemId of ['dub_shield', 'echo_cassette', 'signal_jammer']) {
			inventory.addItem(itemId);
			inventory.equip(itemId);
		}

		const resolved = resolveRuntimeItemEffects(inventory.buildLoadoutSummary());
		const flat = flattenRuntimeItemEffects(resolved);

		expect(flat.damageMitigation).toBe(0.15);
		expect(flat.beatGrace).toBe(0.08);
		expect(flat.decoyOnPerfectDodge).toBe(true);
		expect(flat.traceReduction).toBe(0.25);
	});

	it('turns finisher item sets into deterministic status-on-hit effects', () => {
		const inventory = new InventorySystem(catalog);
		for (const itemId of ['claws', 'katana', 'black_ice_tooth']) {
			inventory.addItem(itemId);
			inventory.equip(itemId);
		}

		const resolved = resolveRuntimeItemEffects(inventory.buildLoadoutSummary());

		expect(resolved.combat.finisherEmp).toBe(true);
		expect(resolved.combat.finisherDamageBonus).toBe(1);
		expect(resolved.statusesOnHit.map((status) => status.kind)).toEqual(['emp']);
	});

	it('resolves extended rail, rocket, and timing hooks', () => {
		const summary = {
			ownedItemIds: [],
			equippedItemIds: [],
			activeBonuses: [],
			missingSetPieces: [],
			effects: {
				railDamageBonus: 0.4,
				railPierceBonus: 2,
				railCooldownReduction: 0.12,
				railRecoilReduction: 0.35,
				empOnChargedShot: true,
				rocketFuelBonus: 2,
				fuelRechargeBonus: 0.3,
				comboWindowBonus: 0.15,
			},
		};

		const resolved = resolveRuntimeItemEffects(summary);

		expect(resolved.combat).toMatchObject({
			railDamageBonus: 0.4,
			railPierceBonus: 2,
			railCooldownReduction: 0.12,
			railRecoilReduction: 0.35,
			empOnChargedShot: true,
			comboWindowBonus: 0.15,
		});
		expect(resolved.physics).toMatchObject({ rocketFuelBonus: 2, fuelRechargeBonus: 0.3 });
	});
});

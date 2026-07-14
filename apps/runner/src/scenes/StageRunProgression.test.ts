import { describe, expect, it } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene progression integration', () => {
	it('merges canonical purchased skills into the live loadout effect channel', () => {
		const scene = new StageRunScene({
			stageId: 'chrome-arcology',
			unlockedSkills: ['rail_mastery', 'piercing_shot', 'fuel_sipper'],
			generatedEnemyPacks: [],
			generatedSideRooms: [],
		});

		const loadout = scene.getLoadoutSnapshot();

		expect(loadout.skillTrackRanks).toEqual({
			clawline: 0,
			railgun: 2,
			rocket: 1,
			hacking: 0,
		});
		expect(loadout.effects).toMatchObject({
			railDamageBonus: 0.25,
			railPierceBonus: 1,
			railCooldownReduction: 0.06,
			rocketFuelBonus: 1,
			fuelRechargeBonus: 0.25,
		});
	});

	it('registers sprite-backed extended gear in the authored first-world layouts', () => {
		const scene = new StageRunScene({
			stageId: 'chrome-arcology',
			generatedEnemyPacks: [],
			generatedSideRooms: [],
		});
		const pickups = scene.getPickupSnapshots();

		expect(pickups).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					itemId: 'capacitor_coil',
					animation: 'capacitor_coil_pickup',
					spriteSheetId: 'items_extended',
				}),
				expect.objectContaining({
					itemId: 'mirror_thread',
					spriteSheetId: 'items_extended',
				}),
			]),
		);
	});
});

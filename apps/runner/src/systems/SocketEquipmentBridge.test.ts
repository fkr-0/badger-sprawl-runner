import { describe, expect, it } from 'vitest';
import type { EquipmentState } from './EquipmentSystem';
import { evaluateEquipment } from './EquipmentSystem';
import { applySocketEffectsToEquipment } from './SocketEquipmentBridge';
import type { ModChipDefinition, SocketedItemState } from './ItemSocketSystem';

const equipment: EquipmentState = {
	items: [{ itemId: 'katana', slot: 'melee', effects: { damage: 1 } }],
};

const socketed: SocketedItemState[] = [{
	itemId: 'katana',
	sockets: [
		{ id: 'edge', acceptsTags: ['blade'] },
		{ id: 'circuit', acceptsTags: ['hack'] },
	],
	installed: { edge: 'sharp_edge', circuit: 'black_ice' },
}];

const chips: ModChipDefinition[] = [
	{ id: 'sharp_edge', tags: ['blade'], effects: { damage: 1, critChance: 0.05 } },
	{ id: 'black_ice', tags: ['hack'], effects: { traceReduction: 0.1 } },
];

describe('SocketEquipmentBridge', () => {
	it('applies socket effects into equipment stats deterministically', () => {
		const bridged = applySocketEffectsToEquipment(equipment, socketed, chips);
		const report = evaluateEquipment(bridged.equipment);

		expect(bridged.socketEffectsByItemId).toEqual({ katana: { traceReduction: 0.1, damage: 1, critChance: 0.05 } });
		expect(report.stats.damage).toBe(3);
		expect(report.stats.critChance).toBe(0.05);
		expect(report.stats.traceReduction).toBe(0.1);
	});

	it('does not mutate base equipment', () => {
		applySocketEffectsToEquipment(equipment, socketed, chips);
		expect(equipment.items[0]?.effects).toEqual({ damage: 1 });
	});
});

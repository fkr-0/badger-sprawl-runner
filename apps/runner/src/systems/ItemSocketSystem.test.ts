import { describe, expect, it } from 'vitest';
import { installModChip, removeModChip, resolveSocketEffects, resolveSocketPolarityEffects, type ModChipDefinition, type SocketedItemState } from './ItemSocketSystem';

const item: SocketedItemState = {
	itemId: 'katana',
	sockets: [
		{ id: 'edge', acceptsTags: ['melee', 'blade'] },
		{ id: 'circuit', acceptsTags: ['hack'] },
	],
	installed: {},
};

const chips: ModChipDefinition[] = [
	{ id: 'sharp_edge', tags: ['blade'], effects: { damage: 1, critChance: 0.05 } },
	{ id: 'black_ice', tags: ['hack'], effects: { traceReduction: 0.1, damage: 0.5 } },
];

describe('ItemSocketSystem', () => {
	it('installs compatible chips and resolves effects in socket order', () => {
		const edge = installModChip(item, chips[0]!, 'edge');
		expect(edge.ok).toBe(true);
		const circuit = installModChip(edge.state, chips[1]!, 'circuit');

		expect(circuit.ok).toBe(true);
		expect(circuit.state.installed).toEqual({ edge: 'sharp_edge', circuit: 'black_ice' });
		expect(resolveSocketEffects(circuit.state, chips)).toEqual({ damage: 1.5, traceReduction: 0.1, critChance: 0.05 });
	});

	it('rejects missing sockets and incompatible chips without mutation', () => {
		const missing = installModChip(item, chips[0]!, 'missing');
		const incompatible = installModChip(item, chips[1]!, 'edge');

		expect(missing).toMatchObject({ ok: false, reason: 'missing-socket:missing' });
		expect(incompatible).toMatchObject({ ok: false, reason: 'incompatible:black_ice:edge' });
		expect(item.installed).toEqual({});
	});

	it('removes chips immutably', () => {
		const installed = installModChip(item, chips[0]!, 'edge').state;
		const removed = removeModChip(installed, 'edge');

		expect(removed.installed).toEqual({});
		expect(installed.installed).toEqual({ edge: 'sharp_edge' });
	});

	it('matching polarity boosts effect without overclock', () => {
		const result = resolveSocketPolarityEffects(
			{ itemId: 'blade', sockets: [{ id: 'edge', acceptsTags: ['blade'], polarity: 'volt' }], installed: { edge: 'sharp_edge' } },
			[{ id: 'sharp_edge', tags: ['blade'], polarity: 'volt', effects: { damage: 10 } }]
		);
		expect(result.effects.damage).toBe(12.5);
		expect(result.entries[0]?.polarity).toBe('matched');
	});

	it('mismatch applies penalty without overclock', () => {
		const result = resolveSocketPolarityEffects(
			{ itemId: 'blade', sockets: [{ id: 'edge', acceptsTags: ['blade'], polarity: 'bio' }], installed: { edge: 'sharp_edge' } },
			[{ id: 'sharp_edge', tags: ['blade'], polarity: 'volt', effects: { damage: 10 } }]
		);
		expect(result.effects.damage).toBe(8);
		expect(result.entries[0]?.polarity).toBe('mismatched');
	});

	it('overclock increases effect and wear on neutral sockets', () => {
		const result = resolveSocketPolarityEffects(
			{ itemId: 'core', sockets: [{ id: 'circuit', acceptsTags: ['hack'], overclockLevel: 2 }], installed: { circuit: 'black_ice' } },
			[{ id: 'black_ice', tags: ['hack'], effects: { traceReduction: 1 }, heatCost: 2, durabilityDrain: 2 }]
		);
		expect(result.effects.traceReduction).toBe(1.3);
		expect(result.entries[0]).toMatchObject({ polarity: 'neutral', heatCost: 3, durabilityDrain: 4, instability: 0.1 });
	});

	it('resolves polarity, mismatch penalties, overclock wear, and deterministic instability', () => {
		const overclocked: SocketedItemState = {
			itemId: 'railgun',
			sockets: [
				{ id: 'core', acceptsTags: ['hack'], polarity: 'volt', overclockLevel: 2, instability: 0.1 },
				{ id: 'edge', acceptsTags: ['blade'], polarity: 'bio' },
			],
			installed: { core: 'black_ice', edge: 'sharp_edge' },
		};
		const polarChips: ModChipDefinition[] = [
			{ id: 'sharp_edge', tags: ['blade'], polarity: 'volt', effects: { damage: 10 }, heatCost: 1, durabilityDrain: 1 },
			{ id: 'black_ice', tags: ['hack'], polarity: 'volt', effects: { traceReduction: 1 }, heatCost: 2, durabilityDrain: 2 },
		];
		const result = resolveSocketPolarityEffects(overclocked, polarChips);
		expect(result.effects).toEqual({ damage: 8, traceReduction: 1.625 });
		expect(result.entries.map((entry) => [entry.socketId, entry.polarity, entry.overclockLevel, entry.heatCost, entry.durabilityDrain, entry.instability])).toEqual([
			['core', 'matched', 2, 3, 4, 0.2],
			['edge', 'mismatched', 0, 1, 1, 0],
		]);
		expect(result.instabilitySeed).toBe(resolveSocketPolarityEffects(overclocked, polarChips).instabilitySeed);
	});
});

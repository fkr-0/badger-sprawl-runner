import { describe, expect, it } from 'vitest';
import {
	colorAuthorityGraph,
	packCivicCargo,
	proveByContradiction,
} from './AlgorithmicCivicSystems';

describe('algorithmic civic systems', () => {
	it('packs protected passengers before aggregate freight and proves the exact small-instance result', () => {
		const result = packCivicCargo(
			[
				{ id: 'medicine', volume: 4, mass: 3, priority: 5, protected: true },
				{ id: 'witness-car', volume: 5, mass: 4, priority: 5, protected: true },
				{ id: 'ad-panels', volume: 6, mass: 5, priority: 1 },
				{ id: 'toolkits', volume: 3, mass: 3, priority: 4 },
			],
			[
				{ id: 'car-a', volumeCapacity: 8, massCapacity: 7 },
				{ id: 'car-b', volumeCapacity: 6, massCapacity: 5 },
			]
		);

		expect(result).toMatchObject({
			optimal: true,
			packedProtectedCount: 2,
			packedPriority: 14,
			usedBinCount: 2,
			unplacedItemIds: ['ad-panels'],
		});
		expect(result.placements.flatMap((placement) => placement.itemIds).sort()).toEqual([
			'medicine',
			'toolkits',
			'witness-car',
		]);
		expect(result.placements.every((placement) => placement.usedMass <= 7)).toBe(true);
	});

	it('honors mutual incompatibilities instead of treating capacity as the only public constraint', () => {
		const result = packCivicCargo(
			[
				{ id: 'oxygen', volume: 2, mass: 2, priority: 5, conflictsWith: ['spark-cell'] },
				{ id: 'spark-cell', volume: 2, mass: 2, priority: 4 },
			],
			[
				{ id: 'left', volumeCapacity: 5, massCapacity: 5 },
				{ id: 'right', volumeCapacity: 5, massCapacity: 5 },
			]
		);

		expect(result.unplacedItemIds).toEqual([]);
		expect(result.placements.filter((placement) => placement.itemIds.length > 0)).toHaveLength(2);
	});

	it('finds a minimum graph coloring for rotating authority without adjacent conflicts', () => {
		const result = colorAuthorityGraph({
			nodeIds: ['clinic', 'transit', 'archive', 'forecast'],
			edges: [
				['clinic', 'transit'],
				['transit', 'archive'],
				['archive', 'forecast'],
				['forecast', 'clinic'],
			],
		});

		expect(result.colorCount).toBe(2);
		expect(result.conflictFree).toBe(true);
		expect(result.assignment.clinic).not.toBe(result.assignment.transit);
		expect(result.assignment.archive).not.toBe(result.assignment.forecast);
	});

	it('closes a forecast claim by contradiction while preserving the derivation trace', () => {
		const result = proveByContradiction({
			facts: ['appeal-exists', 'appeal-blocked', 'model-authorizes-route'],
			assumption: 'model-is-complete',
			implications: [
				{
					id: 'complete-means-every-case',
					when: ['model-is-complete', 'appeal-exists'],
					then: 'appeal-represented',
					reason: 'a complete route model represents every valid appeal',
				},
				{
					id: 'blocked-means-omitted',
					when: ['appeal-blocked', 'model-authorizes-route'],
					then: 'appeal-not-represented',
					reason: 'the authorized route proceeded without the recorded appeal',
				},
			],
			exclusivePairs: [['appeal-represented', 'appeal-not-represented']],
		});

		expect(result.closed).toBe(true);
		expect(result.contradiction).toEqual(['appeal-represented', 'appeal-not-represented']);
		expect(result.proofTrace.at(-1)).toContain('Contradiction');
	});

	it('reports an open proof honestly when public evidence is insufficient', () => {
		const result = proveByContradiction({
			facts: ['forecast-published'],
			assumption: 'forecast-is-fair',
			implications: [],
			exclusivePairs: [['forecast-is-fair', 'forecast-is-not-fair']],
		});

		expect(result.closed).toBe(false);
		expect(result.proofTrace.at(-1)).toContain('unrefuted');
	});
});

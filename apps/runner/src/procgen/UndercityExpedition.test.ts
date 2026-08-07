import { describe, expect, it } from 'vitest';
import {
	buildUndercityExpedition,
	createActiveUndercityExpeditionSave,
	rebuildUndercityExpedition,
	sanitizeActiveUndercityExpeditionSave,
	verifyUndercityManifest,
} from './UndercityExpedition';

describe('UndercityExpedition', () => {
	it('builds byte-stable manifests and generated content from seed, entrance, and depth', () => {
		const left = buildUndercityExpedition({
			seed: 'commons-dawn-42',
			entranceId: 'blue-mercy-maintenance-mouth',
			depth: 7,
		});
		const right = buildUndercityExpedition({
			seed: 'commons-dawn-42',
			entranceId: 'blue-mercy-maintenance-mouth',
			depth: 7,
		});

		expect(right.manifest).toEqual(left.manifest);
		expect(right.enemyPacks).toEqual(left.enemyPacks);
		expect(right.sideRooms).toEqual(left.sideRooms);
		expect(verifyUndercityManifest(left.manifest)).toBe(true);
	});

	it('migrates legacy mid-run saves into v2 without inventing inventory state', () => {
		const built = buildUndercityExpedition({
			seed: 'legacy-mid-room',
			entranceId: 'blue-mercy-maintenance-mouth',
			depth: 3,
		});
		const migrated = sanitizeActiveUndercityExpeditionSave({
			schemaVersion: 1,
			manifest: built.manifest,
			currentRoomIndex: 1,
			bankedSalvage: 4,
			unbankedSalvage: 2,
			status: 'active',
			updatedSequence: 7,
		});

		expect(migrated).toMatchObject({
			schemaVersion: 2,
			currentRoomIndex: 1,
			bankedSalvage: 4,
			unbankedSalvage: 2,
			runtime: {
				inventory: [],
				equippedItemIds: [],
				itemStates: {},
				integrity: 1,
				maxIntegrity: 1,
				injuries: 0,
				collectedSourceIds: [],
			},
		});
	});

	it('rebuilds an accepted manifest exactly for startup resume', () => {
		const original = buildUndercityExpedition({
			seed: 'resume-exactly',
			entranceId: 'chorus-rail-subharmonic-loop',
			depth: 8,
		});
		const rebuilt = rebuildUndercityExpedition(original.manifest);

		expect(rebuilt).toEqual(original);
	});

	it('bounds affixes and reward scaling across maximum supported depth', () => {
		const built = buildUndercityExpedition({
			seed: 'deep-but-not-infinite',
			entranceId: 'commons-return-signal-root',
			depth: 999,
		});

		expect(built.manifest.depth).toBe(20);
		expect(built.manifest.rewardScale).toBeLessThanOrEqual(2.25);
		expect(built.manifest.maxAffixesPerPack).toBe(2);
		expect(built.enemyPacks.every((pack) => pack.affixes.length <= 2)).toBe(true);
		expect(built.manifest.enemyPackCount).toBeLessThanOrEqual(5);
		expect(built.manifest.sideRoomCount).toBeLessThanOrEqual(3);
	});

	it('uses procedural vendors and elites without impersonating authored campaign actors', () => {
		const built = buildUndercityExpedition({
			seed: 'no-fake-auntie',
			entranceId: 'arcology-remainder-shaft',
			depth: 4,
		});

		expect(built.manifest.vendorId).toMatch(/^vendor-/);
		expect(built.manifest.eliteId).toMatch(/^elite-/);
		expect(built.manifest.vendorId).not.toContain('auntie');
		expect(built.manifest.eliteId).not.toContain('director-vane');
	});

	it('rejects tampered manifests and sanitizes resumable active state', () => {
		const built = buildUndercityExpedition({
			seed: 'checksum-public',
			entranceId: 'drainmarket-sump-archive',
			depth: 5,
		});
		const active = createActiveUndercityExpeditionSave(built.manifest, {
			runId: built.manifest.runId,
			inventory: [{ itemId: 'railgun', quantity: 1 }],
			equippedItemIds: ['railgun'],
			itemStates: { railgun: { condition: 43, maxCondition: 100, repairCount: 2 } },
			integrity: 3,
			maxIntegrity: 6,
			injuries: 2,
		});
		const sanitized = sanitizeActiveUndercityExpeditionSave({
			...active,
			currentRoomIndex: 999,
			bankedSalvage: 7.9,
			unbankedSalvage: -3,
		});

		expect(sanitized).toMatchObject({
			currentRoomIndex: built.manifest.sideRoomCount,
			bankedSalvage: 7,
			unbankedSalvage: 0,
			status: 'active',
			runtime: {
				inventory: [{ itemId: 'railgun', quantity: 1 }],
				equippedItemIds: ['railgun'],
				itemStates: { railgun: { condition: 43, maxCondition: 100, repairCount: 2 } },
				integrity: 3,
				maxIntegrity: 6,
				injuries: 2,
				collectedSourceIds: [],
			},
		});
		expect(
			verifyUndercityManifest({ ...built.manifest, rewardScale: built.manifest.rewardScale + 0.1 })
		).toBe(false);
	});
});

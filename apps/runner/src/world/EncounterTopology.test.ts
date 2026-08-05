import { describe, expect, it } from 'vitest';
import { RUNTIME_STAGE_IDS } from './stageLayoutRegistry';
import { getStageEncounterTopology } from './EncounterTopologyCatalog';
import {
	findEncounterRoute,
	getEncounterZoneAtPoint,
	validateEncounterTopology,
} from './EncounterTopology';

describe('encounter topology', () => {
	it('validates authored topology and two distinct plans for every major runtime zone', () => {
		for (const stageId of RUNTIME_STAGE_IDS) {
			const topology = getStageEncounterTopology(stageId);
			expect(validateEncounterTopology(topology), stageId).toEqual([]);
			for (const zone of topology.zones.filter((candidate) => candidate.major)) {
				const plans = topology.approachPlans.filter((plan) => plan.zoneId === zone.id);
				expect(plans, `${stageId}:${zone.id}`).toHaveLength(2);
				expect(new Set(plans.flatMap((plan) => plan.approaches)).size).toBeGreaterThanOrEqual(2);
			}
		}
	});

	it('finds bounded best routes and respects dynamic portal closure', () => {
		const topology = getStageEncounterTopology('lower-sprawl');
		const entry = 'lower-sprawl:entry';
		const stronghold = 'lower-sprawl:stronghold';
		const openRoute = findEncounterRoute(topology, entry, stronghold, 'sound');
		expect(openRoute).toMatchObject({
			portalIds: ['lower-sprawl:portal-a', 'lower-sprawl:portal-b'],
		});
		expect(openRoute?.transmission).toBeCloseTo(0.78 * 0.64);
		expect(
			findEncounterRoute(topology, entry, stronghold, 'sound', {
				'lower-sprawl:portal-b': { open: false },
			})
		).toBeNull();
	});

	it('resolves the smallest authored zone at a point deterministically', () => {
		const topology = getStageEncounterTopology('chrome-arcology');
		expect(getEncounterZoneAtPoint(topology, 1200, 430)?.id).toBe('chrome-arcology:work');
		expect(getEncounterZoneAtPoint(topology, 2200, 430)?.id).toBe(
			'chrome-arcology:stronghold'
		);
	});

	it('uses district-specific late-stage portal, occluder, and trap geometry', () => {
		const expected = {
			'antenna-barrens': {
				portals: ['dish-shadow-cut', 'mast-trench', 'confidence-gate'],
				traps: ['sweep-chime', 'confidence-ping'],
			},
			'orbital-lift': {
				portals: ['manifest-door', 'crawl-iris', 'authority-lock'],
				traps: ['cargo-status-bell', 'counterweight-clack'],
			},
			'asteroid-redoubt': {
				portals: ['witness-corridor', 'doctrine-seal', 'service-bypass'],
				traps: ['doctrine-recorder', 'broadcast-recoil'],
			},
		} as const;

		for (const [stageId, contract] of Object.entries(expected)) {
			const topology = getStageEncounterTopology(
				stageId as keyof typeof expected
			);
			expect(topology.portals.map((portal) => portal.id)).toEqual(
				contract.portals.map((suffix) => `${stageId}:${suffix}`)
			);
			expect(topology.traps?.map((trap) => trap.id)).toEqual(
				contract.traps.map((suffix) => `${stageId}:${suffix}`)
			);
			expect(topology.occluders).toHaveLength(2);
			const strongholdPlans = topology.approachPlans.filter((plan) =>
				plan.zoneId.endsWith(':stronghold')
			);
			expect(strongholdPlans).toHaveLength(2);
			expect(new Set(strongholdPlans.flatMap((plan) => plan.entryPortalIds)).size).toBe(2);
		}
	});

	it('rejects malformed trap acoustic geometry', () => {
		const topology = getStageEncounterTopology('orbital-lift');
		const firstTrap = topology.traps?.[0];
		expect(firstTrap).toBeDefined();
		if (!firstTrap) return;
		firstTrap.soundRadius = 0;
		firstTrap.intensity = 2;
		expect(validateEncounterTopology(topology)).toContainEqual(
			expect.objectContaining({ code: 'invalid-trap', refId: firstTrap.id })
		);
	});
});

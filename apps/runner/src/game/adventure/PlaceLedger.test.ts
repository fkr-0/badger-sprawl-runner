import { describe, expect, it } from 'vitest';
import { getPlaceDef, getPlaceVariant, validatePlaceLedger } from './PlaceLedger';

describe('place ledger', () => {
	it('defines three functional Lower Sprawl off-combat places', () => {
		expect(validatePlaceLedger()).toEqual([]);
		for (const id of [
			'lower-sprawl:safehouse',
			'lower-sprawl:settlement',
			'lower-sprawl:station',
		]) {
			expect(getPlaceDef(id)).toBeDefined();
		}
	});

	it('projects visible post-story transformations', () => {
		const station = getPlaceDef('lower-sprawl:station');
		expect(station && getPlaceVariant(station, 'transformed')).toMatchObject({
			titleSuffix: 'Blue Mercy Public Platform',
		});
	});

	it('proves the place pipeline with a second three-zone district', () => {
		for (const id of [
			'drainmarket:safehouse',
			'drainmarket:settlement',
			'drainmarket:station',
		]) {
			expect(getPlaceDef(id)).toBeDefined();
		}
		expect(getPlaceDef('drainmarket:station')?.services.map((service) => service.id)).toEqual(
			expect.arrayContaining(['transit-control', 'clinic', 'repair-bench'])
		);
	});

	it('extends the place pipeline into the vertical city', () => {
		for (const id of [
			'chrome-arcology:safehouse',
			'chrome-arcology:settlement',
			'chrome-arcology:station',
		]) {
			expect(getPlaceDef(id)).toBeDefined();
		}
		expect(getPlaceDef('chrome-arcology:station')?.services.map((service) => service.id)).toEqual(
			expect.arrayContaining(['transit-control', 'repair-bench', 'signal-lab'])
		);
	});

	it('turns orbital luxury into three revisitable worker places', () => {
		for (const id of [
			'mirror-palace:safehouse',
			'mirror-palace:settlement',
			'mirror-palace:station',
		]) {
			expect(getPlaceDef(id)).toBeDefined();
		}
		expect(getPlaceDef('mirror-palace:station')?.services.map((service) => service.id)).toEqual(
			expect.arrayContaining(['transit-control', 'repair-bench', 'signal-lab'])
		);
	});

	it('projects the colony as an inhabited transit commons rather than a mission hub', () => {
		for (const id of [
			'dub-colony:safehouse',
			'dub-colony:settlement',
			'dub-colony:station',
		]) {
			expect(getPlaceDef(id)).toBeDefined();
		}
		expect(getPlaceDef('dub-colony:settlement')?.services.map((service) => service.id)).toEqual(
			expect.arrayContaining(['greenhouse', 'legal-aid', 'signal-lab'])
		);
	});

	it.each([
		['antenna-barrens', ['signal-lab', 'archive', 'transit-control']],
		['orbital-lift', ['clinic', 'archive', 'transit-control']],
		['asteroid-redoubt', ['signal-lab', 'archive', 'transit-control']],
	] as const)('projects %s through the same three-place civic pipeline', (districtId, services) => {
		for (const kind of ['safehouse', 'settlement', 'station']) {
			expect(getPlaceDef(`${districtId}:${kind}`)).toBeDefined();
		}
		const projectedServices = new Set(
			[
				...getPlaceDef(`${districtId}:safehouse`)!.services,
				...getPlaceDef(`${districtId}:settlement`)!.services,
				...getPlaceDef(`${districtId}:station`)!.services,
			].map((service) => service.id)
		);
		for (const service of services) expect(projectedServices.has(service)).toBe(true);
	});
});


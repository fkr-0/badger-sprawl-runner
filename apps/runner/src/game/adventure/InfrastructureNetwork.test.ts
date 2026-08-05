import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../GameFlow';
import { createDefaultAdventureSave } from './AdventureState';
import {
	getInfrastructureNoticesForDistrict,
	resolveInfrastructureNetwork,
	validateInfrastructureNetwork,
} from './InfrastructureNetwork';

describe('infrastructure network', () => {
	it('validates dependency links and begins as a fragmented contested network', () => {
		expect(validateInfrastructureNetwork()).toEqual([]);
		const network = resolveInfrastructureNetwork(
			createDefaultAdventureSave(),
			createGameFlow().getStoryProgress()
		);
		expect(network.nodes.find((node) => node.id === 'blue-mercy-line')?.status).toBe(
			'contested'
		);
		expect(network.notices).toEqual([]);
	});

	it('activates a cross-district medical dependency when Blue Mercy opens', () => {
		const adventure = createDefaultAdventureSave({
			discoveredLocationIds: [
				'lower-sprawl:station',
				'drainmarket:safehouse',
				'drainmarket:settlement',
			],
			districtPhases: { 'lower-sprawl': 'transformed', drainmarket: 'contested' },
			worldFlags: ['lower-sprawl:blue-mercy-public'],
		});
		const network = resolveInfrastructureNetwork(adventure, createGameFlow().getStoryProgress());
		expect(network.links.find((link) => link.id === 'blue-mercy-to-cold-chain')?.active).toBe(
			true
		);
		expect(getInfrastructureNoticesForDistrict(network, 'drainmarket')).toContain(
			'Blue Mercy carries clinic stock and redundant couriers toward Drainmarket.'
		);
	});

	it('mirrors colony systems back into the city after homecoming', () => {
		const flow = createGameFlow(undefined, {
			completedStageIds: ['lower-sprawl', 'drainmarket', 'dub-colony', 'orbital-lift'],
		});
		const adventure = createDefaultAdventureSave({
			discoveredLocationIds: [
				'lower-sprawl:station',
				'dub-colony:settlement',
				'orbital-lift:station',
			],
			districtPhases: {
				'lower-sprawl': 'transformed',
				'dub-colony': 'transformed',
				'orbital-lift': 'transformed',
			},
			worldFlags: [
				'lower-sprawl:blue-mercy-public',
				'main:colony-charter-written',
				'main:homecoming',
			],
		});
		const network = resolveInfrastructureNetwork(adventure, flow.getStoryProgress());
		expect(network.links.find((link) => link.id === 'greenhouse-to-blue-mercy')?.active).toBe(
			true
		);
		expect(network.links.find((link) => link.id === 'homecoming-to-blue-mercy')?.active).toBe(
			true
		);
	});

	it('turns the subway upward only after labor governance reaches the Elevator Seed', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'mirror-palace',
			completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology'],
		});
		const adventure = createDefaultAdventureSave({
			discoveredLocationIds: [
				'lower-sprawl:station',
				'chrome-arcology:safehouse',
				'chrome-arcology:station',
				'mirror-palace:station',
			],
			districtPhases: {
				'lower-sprawl': 'transformed',
				'chrome-arcology': 'transformed',
				'mirror-palace': 'contested',
			},
			worldFlags: [
				'lower-sprawl:blue-mercy-public',
				'chrome-arcology:vertical-commons',
				'main:elevator-seed-secured',
			],
		});
		const network = resolveInfrastructureNetwork(adventure, flow.getStoryProgress());

		expect(network.links.find((link) => link.id === 'labor-grid-to-elevator-seed')?.active).toBe(
			true
		);
		expect(network.links.find((link) => link.id === 'elevator-seed-to-sky-mirror')?.active).toBe(
			true
		);
	});

	it('turns the luxury express into a worker local before reaching the colony', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'dub-colony',
			completedStageIds: ['lower-sprawl', 'drainmarket', 'chrome-arcology', 'mirror-palace'],
		});
		const adventure = createDefaultAdventureSave({
			discoveredLocationIds: [
				'mirror-palace:station',
				'dub-colony:station',
			],
			districtPhases: {
				'mirror-palace': 'transformed',
				'dub-colony': 'contested',
			},
			worldFlags: [
				'main:sky-mirror-broken',
				'mirror-palace:public-staff-local',
				'mirror-palace:withdrawable-refusal-archive',
			],
		});
		const network = resolveInfrastructureNetwork(adventure, flow.getStoryProgress());

		expect(network.links.find((link) => link.id === 'sky-mirror-to-staff-local')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'refusal-archive-to-staff-local')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'staff-local-to-chorus-rail')?.active).toBe(true);
	});

	it('requires public air and colony governance before the return line feeds homecoming', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'orbital-lift',
			completedStageIds: [
				'lower-sprawl',
				'drainmarket',
				'chrome-arcology',
				'mirror-palace',
				'dub-colony',
				'antenna-barrens',
			],
		});
		const adventure = createDefaultAdventureSave({
			discoveredLocationIds: ['dub-colony:station', 'orbital-lift:station'],
			districtPhases: {
				'dub-colony': 'transformed',
				'orbital-lift': 'contested',
			},
			worldFlags: [
				'main:colony-charter-written',
				'dub-colony:public-air-forecast',
				'dub-colony:commons-governance',
				'main:chorus-commons',
			],
		});
		const network = resolveInfrastructureNetwork(adventure, flow.getStoryProgress());

		expect(network.links.find((link) => link.id === 'rotating-fader-to-air-forecast')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'air-forecast-to-return-line')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'return-line-to-homecoming-lift')?.active).toBe(true);
	});

	it('carries consent and pre-harm appeals from the forecast into passenger classification', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'orbital-lift',
			completedStageIds: [
				'lower-sprawl',
				'drainmarket',
				'chrome-arcology',
				'mirror-palace',
				'dub-colony',
				'antenna-barrens',
			],
		});
		const adventure = createDefaultAdventureSave({
			discoveredLocationIds: ['antenna-barrens:station', 'orbital-lift:station'],
			districtPhases: {
				'antenna-barrens': 'transformed',
				'orbital-lift': 'contested',
			},
			worldFlags: [
				'antenna-barrens:listener-cache-public',
				'antenna-barrens:pre-harm-appeals',
				'main:forecast-public',
				'orbital-lift:passenger-manifest',
			],
		});
		const network = resolveInfrastructureNetwork(adventure, flow.getStoryProgress());

		expect(network.links.find((link) => link.id === 'listener-consent-to-passenger-manifest')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'appeal-switch-to-passenger-manifest')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'passenger-manifest-to-homecoming-lift')?.active).toBe(true);
	});

	it('requires mirrored tools and protected routes before the last signal becomes a commons', () => {
		const flow = createGameFlow(undefined, {
			currentStageId: 'asteroid-redoubt',
			completedStageIds: ['orbital-lift'],
		});
		const adventure = createDefaultAdventureSave({
			discoveredLocationIds: ['lower-sprawl:station', 'asteroid-redoubt:station'],
			districtPhases: {
				'lower-sprawl': 'transformed',
				'asteroid-redoubt': 'transformed',
			},
			worldFlags: [
				'lower-sprawl:blue-mercy-public',
				'asteroid-redoubt:public-toolkits-distributed',
				'asteroid-redoubt:protected-map-public',
				'main:commons-line',
			],
		});
		const network = resolveInfrastructureNetwork(adventure, flow.getStoryProgress());

		expect(network.links.find((link) => link.id === 'blue-mercy-to-public-toolkit-mirrors')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'protected-map-to-peer-return-signal')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'toolkit-mirrors-to-commons-transmitter')?.active).toBe(true);
		expect(network.links.find((link) => link.id === 'commons-transmitter-to-blue-mercy')?.active).toBe(true);
	});
});

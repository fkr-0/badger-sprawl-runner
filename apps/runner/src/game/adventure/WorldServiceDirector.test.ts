import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../GameFlow';
import { createDefaultAdventureSave } from './AdventureState';
import { WorldDirector } from './WorldDirector';
import { WorldServiceDirector } from './WorldServiceDirector';

describe('WorldServiceDirector', () => {
	it('purchases into canonical persistent inventory and spends canonical currency', () => {
		const flow = createGameFlow({ credchips: 100 });
		const world = new WorldDirector();
		world.debugTravelTo('lower-sprawl:settlement');
		const services = new WorldServiceDirector(flow, world);

		const receipt = services.purchaseItem('lower-sprawl:settlement', 'stim_pack');

		expect(receipt).toMatchObject({ ok: true, changed: true, itemId: 'stim_pack', quantity: 1 });
		expect(flow.getMeta().credchips).toBeLessThan(100);
		expect(world.getState().inventory).toContainEqual({ itemId: 'stim_pack', quantity: 1 });
	});

	it('projects Arcology access tools through the same canonical shop boundary', () => {
		const flow = createGameFlow({ credchips: 500 });
		const world = new WorldDirector();
		world.debugTravelTo('chrome-arcology:settlement');
		const services = new WorldServiceDirector(flow, world);

		expect(services.getShopOffer('chrome-arcology:settlement').map((offer) => offer.itemId)).toEqual(
			expect.arrayContaining(['phase_pick', 'ledger_lens'])
		);
		expect(services.purchaseItem('chrome-arcology:settlement', 'ledger_lens')).toMatchObject({
			ok: true,
			itemId: 'ledger_lens',
		});
	});

	it('uses the canonical economy for the Lift passenger supply cooperative', () => {
		const flow = createGameFlow({ credchips: 500 });
		const world = new WorldDirector();
		world.debugTravelTo('orbital-lift:settlement');
		const services = new WorldServiceDirector(flow, world);

		expect(services.getShopOffer('orbital-lift:settlement').map((offer) => offer.itemId)).toEqual(
			expect.arrayContaining(['gravity_talisman', 'capacitor_coil'])
		);
		expect(services.purchaseItem('orbital-lift:settlement', 'gravity_talisman')).toMatchObject({
			ok: true,
			itemId: 'gravity_talisman',
		});
		expect(world.getState().inventory).toContainEqual({ itemId: 'gravity_talisman', quantity: 1 });
	});

	it('sells Mirror Palace concealment tools without creating a second economy', () => {
		const flow = createGameFlow({ credchips: 500 });
		const world = new WorldDirector();
		world.debugTravelTo('mirror-palace:settlement');
		const services = new WorldServiceDirector(flow, world);

		expect(services.getShopOffer('mirror-palace:settlement').map((offer) => offer.itemId)).toEqual(
			expect.arrayContaining(['mirror_thread', 'phase_mantle'])
		);
		expect(services.purchaseItem('mirror-palace:settlement', 'mirror_thread')).toMatchObject({
			ok: true,
			itemId: 'mirror_thread',
		});
	});

	it('projects curated colony maintenance stock through the repair bay', () => {
		const flow = createGameFlow({ credchips: 500 });
		const world = new WorldDirector();
		world.debugTravelTo('dub-colony:safehouse');
		const services = new WorldServiceDirector(flow, world);

		expect(services.getShopOffer('dub-colony:safehouse').map((offer) => offer.itemId)).toEqual(
			expect.arrayContaining(['shock_fern', 'solder_mite_swarm'])
		);
		expect(services.purchaseItem('dub-colony:safehouse', 'shock_fern')).toMatchObject({
			ok: true,
			itemId: 'shock_fern',
		});
	});

	it('does not mutate inventory when the player cannot pay', () => {
		const flow = createGameFlow({ credchips: 0 });
		const world = new WorldDirector();
		const services = new WorldServiceDirector(flow, world);

		expect(services.purchaseItem('lower-sprawl:settlement', 'stim_pack')).toMatchObject({
			ok: false,
			failure: 'insufficient-credchips',
		});
		expect(world.getState().inventory).toEqual([]);
	});

	it('equips persistent items using existing slot rules', () => {
		const flow = createGameFlow();
		const world = new WorldDirector();
		world.execute({ type: 'add-inventory-item', itemId: 'signal_jammer', quantity: 1 });
		world.execute({ type: 'add-inventory-item', itemId: 'rocket_backpack', quantity: 1 });
		const services = new WorldServiceDirector(flow, world);

		services.equipItem('signal_jammer');
		services.equipItem('rocket_backpack');

		expect(world.getState().equippedItemIds).toEqual(['rocket_backpack']);
	});

	it('refuses equipment changes away from a trusted locker', () => {
		const flow = createGameFlow();
		const world = new WorldDirector();
		world.execute({ type: 'add-inventory-item', itemId: 'signal_jammer', quantity: 1 });
		world.debugTravelTo('lower-sprawl:route');

		expect(new WorldServiceDirector(flow, world).equipItem('signal_jammer')).toMatchObject({
			ok: false,
			failure: 'service-unavailable',
		});
	});

	it('repairs and modifies persistent equipment through one atomic bench ledger', () => {
		const flow = createGameFlow({ credchips: 500 });
		const world = new WorldDirector(
			undefined,
			createDefaultAdventureSave({
				currentLocationId: 'lower-sprawl:safehouse',
				inventory: [{ itemId: 'signal_jammer', quantity: 1 }],
				itemStates: {
					signal_jammer: { condition: 35, maxCondition: 100, repairCount: 0 },
				},
			})
		);
		const services = new WorldServiceDirector(flow, world);

		expect(services.getServiceActions('lower-sprawl:safehouse', 'repair-bench')).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'repair:signal_jammer' }),
				expect.objectContaining({ id: 'modify:signal_jammer:subharmonic-tuning' }),
			])
		);
		expect(
			services.performServiceAction(
				'lower-sprawl:safehouse',
				'repair-bench',
				'repair:signal_jammer'
			)
		).toMatchObject({ ok: true, serviceId: 'repair-bench' });
		expect(world.getState().itemStates.signal_jammer).toMatchObject({
			condition: 100,
			repairCount: 1,
		});
		expect(
			services.performServiceAction(
				'lower-sprawl:safehouse',
				'repair-bench',
				'modify:signal_jammer:subharmonic-tuning'
			)
		).toMatchObject({ ok: true });
		expect(world.getState().itemStates.signal_jammer?.modificationId).toBe(
			'subharmonic-tuning'
		);
		expect(world.getState().economy.repairCount).toBe(2);
	});

	it('uses supplies and visible strain for clinic recovery instead of shadow debt', () => {
		const flow = createGameFlow({ credchips: 0 });
		const world = new WorldDirector(
			undefined,
			createDefaultAdventureSave({
				currentLocationId: 'drainmarket:safehouse',
				inventory: [{ itemId: 'stim_pack', quantity: 2 }],
				expedition: {
					integrity: 2,
					maxIntegrity: 6,
					injuries: 2,
					completedRuns: 0,
				},
			})
		);
		const services = new WorldServiceDirector(flow, world);

		expect(
			services.performServiceAction('drainmarket:safehouse', 'clinic', 'clinic:stabilize')
		).toMatchObject({ ok: true, serviceId: 'clinic' });
		expect(world.getState()).toMatchObject({
			expedition: { integrity: 4, injuries: 1 },
			locationStates: {
				'drainmarket:safehouse': { serviceStrain: { clinic: 1 } },
			},
		});
		expect(world.getState().inventory).toContainEqual({ itemId: 'stim_pack', quantity: 1 });
		expect(flow.getMeta().credchips).toBe(0);
	});

	it('makes greenhouse production finite until an expedition restores capacity', () => {
		const flow = createGameFlow();
		const world = new WorldDirector();
		world.debugTravelTo('drainmarket:safehouse');
		const services = new WorldServiceDirector(flow, world);

		for (let index = 0; index < 4; index += 1) {
			expect(
				services.performServiceAction(
					'drainmarket:safehouse',
					'greenhouse',
					'greenhouse:harvest-stim'
				)
			).toMatchObject({ ok: true });
		}
		expect(
			services.performServiceAction(
				'drainmarket:safehouse',
				'greenhouse',
				'greenhouse:harvest-stim'
			)
		).toMatchObject({ ok: false, failure: 'action-unavailable' });
		expect(world.getState().locationStates['drainmarket:safehouse']?.serviceStrain.greenhouse).toBe(4);
	});

	it('awards archive and transit mastery once and exposes economy risk telemetry', () => {
		const flow = createGameFlow({ credchips: 20 });
		const world = new WorldDirector(
			undefined,
			createDefaultAdventureSave({
				currentLocationId: 'chrome-arcology:safehouse',
				expedition: {
					integrity: 2,
					maxIntegrity: 6,
					injuries: 1,
					completedRuns: 0,
				},
				locationStates: {
					'drainmarket:safehouse': {
						visitCount: 1,
						flags: [],
						serviceLevels: {},
						serviceStrain: { clinic: 4 },
					},
				},
			})
		);
		const services = new WorldServiceDirector(flow, world);

		expect(
			services.performServiceAction(
				'chrome-arcology:safehouse',
				'archive',
				'archive:review-records'
			)
		).toMatchObject({ ok: true });
		expect(
			services.performServiceAction(
				'chrome-arcology:safehouse',
				'archive',
				'archive:review-records'
			)
		).toMatchObject({ ok: false, failure: 'action-unavailable' });
		expect(services.getEconomyTelemetry()).toMatchObject({
			clinicStrain: 4,
			softLockRisk: true,
		});
	});
});

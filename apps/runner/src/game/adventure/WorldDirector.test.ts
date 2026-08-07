import { describe, expect, it } from 'vitest';
import { createDefaultAdventureSave } from './AdventureState';
import { ADVENTURE_TRAVEL_GRAPH } from './WorldGraph';
import { WorldDirector } from './WorldDirector';

describe('WorldDirector', () => {
	it('allows only discovered destinations on unlocked adjacent routes', () => {
		const world = new WorldDirector();

		expect(world.execute({ type: 'travel', destinationId: 'lower-sprawl:settlement' }).ok).toBe(
			true
		);
		expect(world.execute({ type: 'travel', destinationId: 'drainmarket:station' })).toMatchObject({
			ok: false,
			reason: 'location-undiscovered',
		});
	});

	it('adds, equips, removes, and automatically unequips persistent items', () => {
		const world = new WorldDirector();
		expect(world.execute({ type: 'add-inventory-item', itemId: 'signal_jammer', quantity: 2 }).ok).toBe(true);
		expect(world.execute({ type: 'set-equipped-items', itemIds: ['signal_jammer'] }).ok).toBe(true);
		expect(world.execute({ type: 'remove-inventory-item', itemId: 'signal_jammer', quantity: 1 }).ok).toBe(true);
		expect(world.getState()).toMatchObject({
			inventory: [{ itemId: 'signal_jammer', quantity: 1 }],
			equippedItemIds: ['signal_jammer'],
		});
		expect(world.execute({ type: 'remove-inventory-item', itemId: 'signal_jammer', quantity: 1 }).ok).toBe(true);
		expect(world.getState()).toMatchObject({ inventory: [], equippedItemIds: [] });
	});

	it('replays the same command sequence deterministically', () => {
		const commands = [
			{ type: 'travel', destinationId: 'lower-sprawl:settlement' },
			{ type: 'travel', destinationId: 'lower-sprawl:station' },
		] as const;
		const first = new WorldDirector(ADVENTURE_TRAVEL_GRAPH, createDefaultAdventureSave());
		const second = new WorldDirector(ADVENTURE_TRAVEL_GRAPH, createDefaultAdventureSave());
		for (const command of commands) {
			first.execute(command);
			second.execute(command);
		}
		expect(first.getState()).toEqual(second.getState());
		expect(first.getState().transitionSequence).toBe(2);
	});

	it('returns to a persistent respawn anchor', () => {
		const world = new WorldDirector();
		world.execute({ type: 'travel', destinationId: 'lower-sprawl:settlement' });
		world.execute({ type: 'set-respawn', locationId: 'lower-sprawl:settlement', spawnId: 'respawn' });
		world.execute({ type: 'travel', destinationId: 'lower-sprawl:route' });
		world.execute({ type: 'respawn' });

		expect(world.getState()).toMatchObject({
			currentLocationId: 'lower-sprawl:settlement',
			currentSpawnId: 'respawn',
		});
	});

	it('supports explicit debug travel without weakening normal travel rules', () => {
		const world = new WorldDirector();
		expect(world.debugTravelTo('asteroid-redoubt:stronghold').ok).toBe(true);
		expect(world.getState().currentLocationId).toBe('asteroid-redoubt:stronghold');
	});

	it('persists place visits, conversations, services, and NPC relocation', () => {
		const world = new WorldDirector();
		world.execute({ type: 'travel', destinationId: 'lower-sprawl:settlement' });
		world.execute({
			type: 'record-conversation',
			npcId: 'murr-murrby',
			conversationId: 'murr:survival-retail',
			trustDelta: 1,
		});
		world.execute({
			type: 'set-service-level',
			locationId: 'lower-sprawl:settlement',
			serviceId: 'field-shop',
			level: 1,
		});
		world.execute({
			type: 'relocate-npc',
			npcId: 'murr-murrby',
			locationId: 'lower-sprawl:station',
		});

		expect(world.getState()).toMatchObject({
			locationStates: {
				'lower-sprawl:settlement': {
					visitCount: 1,
					serviceLevels: { 'field-shop': 1 },
				},
			},
			npcStates: {
				'murr-murrby': { met: true, trust: 1, currentLocationId: 'lower-sprawl:station' },
			},
		});
	});

	it('rolls back every event when an atomic service transaction fails', () => {
		const world = new WorldDirector();
		const before = world.getState();

		const result = world.executeTransaction([
			{ type: 'add-inventory-item', itemId: 'stim_pack', quantity: 1 },
			{ type: 'remove-inventory-item', itemId: 'missing_supply', quantity: 1 },
		]);

		expect(result).toMatchObject({
			ok: false,
			failedCommandIndex: 1,
			reason: 'insufficient-item',
		});
		expect(world.getState()).toEqual(before);
	});

	it('commits bounded expedition state and recovers one service-strain mark', () => {
		const world = new WorldDirector(
			undefined,
			createDefaultAdventureSave({
				inventory: [{ itemId: 'signal_jammer', quantity: 1 }],
				equippedItemIds: ['signal_jammer'],
				itemStates: {
					signal_jammer: {
						condition: 80,
						maxCondition: 100,
						repairCount: 0,
					},
				},
				locationStates: {
					'drainmarket:safehouse': {
						visitCount: 1,
						flags: [],
						serviceLevels: {},
						serviceStrain: { clinic: 3 },
					},
				},
			})
		);

		expect(
			world.execute({
				type: 'commit-expedition',
				commit: {
					runId: 'run:lower-sprawl:test:1',
					stageId: 'lower-sprawl',
					inventory: [
						{ itemId: 'signal_jammer', quantity: 1 },
						{ itemId: 'stim_pack', quantity: 2 },
					],
					equippedItemIds: ['signal_jammer'],
					itemStates: {
						signal_jammer: {
							condition: 61,
							maxCondition: 100,
							repairCount: 0,
						},
					},
					integrity: 3,
					maxIntegrity: 6,
					injuries: 1,
					bankedSalvage: 4,
				},
			})
		).toMatchObject({ ok: true });
		expect(world.getState()).toMatchObject({
			expedition: {
				integrity: 3,
				injuries: 1,
				completedRuns: 1,
				lastStageId: 'lower-sprawl',
				settledRunIds: ['run:lower-sprawl:test:1'],
			},
			itemStates: { signal_jammer: { condition: 61 } },
			locationStates: {
				'drainmarket:safehouse': { serviceStrain: { clinic: 2 } },
			},
		});
	});
});

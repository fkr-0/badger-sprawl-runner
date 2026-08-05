import { describe, expect, it } from 'vitest';
import { createGameFlow } from '../GameFlow';
import { PlaceDirector } from './PlaceDirector';
import { WorldDirector } from './WorldDirector';

describe('PlaceDirector', () => {
	it('records conversations and starts quests durably', () => {
		const world = new WorldDirector();
		const places = new PlaceDirector(world, createGameFlow());
		const result = places.talkTo('auntie-subharmonic', 'lower-sprawl:safehouse');

		expect(result.ok).toBe(true);
		expect(world.getState().npcStates['auntie-subharmonic']).toMatchObject({
			met: true,
			trust: 2,
		});
		expect(world.getState().questStates['lower-sprawl:main-song-of-the-toll']).toMatchObject({
			status: 'active',
			stepId: 'listen-to-the-relay',
		});
	});

	it('changes cast and services after district transformation', () => {
		const world = new WorldDirector();
		world.execute({ type: 'set-district-phase', districtId: 'lower-sprawl', phase: 'transformed' });
		world.execute({
			type: 'set-service-level',
			locationId: 'lower-sprawl:station',
			serviceId: 'signal-lab',
			level: 1,
		});
		const snapshot = new PlaceDirector(world, createGameFlow()).getSnapshot('lower-sprawl:station');

		expect(snapshot?.npcs.map((entry) => entry.npc.id)).toContain('sister-version');
		expect(snapshot?.services.map((service) => service.id)).toContain('signal-lab');
	});
});


import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { findEncounterRoute, type StageEncounterTopology } from '../world/EncounterTopology';
import { EncounterAcousticActorSystem } from './EncounterAcousticActorSystem';
import type { ActionMap } from './InputSystem';

const quietAction = (): ActionMap => ({
	moveLeft: false,
	moveRight: false,
	jump: false,
	jumpPressed: false,
	fastFall: false,
	melee: false,
	meleePressed: false,
	shoot: false,
	shootPressed: false,
	item: false,
	itemPressed: false,
	parry: false,
	parryPressed: false,
	dodge: false,
	dodgePressed: false,
	hack: false,
	hackPressed: false,
	hackHeld: false,
	pause: false,
	pausePressed: false,
	debugToggle: false,
});

function topology(): StageEncounterTopology {
	return {
		stageId: 'test-stage',
		zones: [
			{ id: 'entry', label: 'Entry', x: 0, y: 0, w: 300, h: 500, major: false, tags: [] },
			{ id: 'work', label: 'Work', x: 300, y: 0, w: 400, h: 500, major: true, tags: [] },
		],
		portals: [
			{
				id: 'service-door',
				fromZoneId: 'entry',
				toZoneId: 'work',
				x: 280,
				y: 250,
				w: 40,
				h: 240,
				visionTransmission: 0.6,
				soundTransmission: 0.7,
				defaultOpen: false,
				tags: ['door'],
			},
		],
		occluders: [],
		traps: [
			{
				id: 'floor-chime',
				label: 'Floor chime',
				x: 500,
				y: 430,
				triggerRadius: 70,
				hackRadius: 90,
				cooldownSeconds: 1,
				intensity: 0.7,
				soundRadius: 600,
				decoyOffset: -220,
				tags: ['tripwire'],
			},
		],
		civilianRoutes: [],
		approachPlans: [
			{
				id: 'work-a',
				zoneId: 'work',
				label: 'Quiet',
				approaches: ['ghoststep'],
				entryPortalIds: ['service-door'],
				requiredTags: [],
				risk: 'low',
				playerCue: 'Door.',
				worldConsequenceHint: 'Quiet.',
			},
			{
				id: 'work-b',
				zoneId: 'work',
				label: 'Loud',
				approaches: ['claw'],
				entryPortalIds: ['service-door'],
				requiredTags: [],
				risk: 'high',
				playerCue: 'Gate.',
				worldConsequenceHint: 'Loud.',
			},
		],
	};
}

describe('EncounterAcousticActorSystem', () => {
	it('opens and closes authored doors while projecting the same portal truth to vision and sound', () => {
		const encounter = topology();
		const system = new EncounterAcousticActorSystem(encounter);
		const player = createPlayer();
		player.x = 255;
		player.y = 390;

		expect(findEncounterRoute(encounter, 'entry', 'work', 'sound', system.getPortalStates())).toBeNull();
		const opened = system.step(player, quietAction(), 0.1);
		expect(opened.events).toContainEqual(
			expect.objectContaining({ kind: 'door-opened', portalId: 'service-door' })
		);
		expect(opened.sounds).toContainEqual(
			expect.objectContaining({ kind: 'door', sourceId: 'service-door' })
		);
		expect(findEncounterRoute(encounter, 'entry', 'work', 'sound', opened.portalStates)).toMatchObject({
			portalIds: ['service-door'],
			transmission: 0.7,
		});

		player.x = 20;
		system.step(player, quietAction(), 0.5);
		const closed = system.step(player, quietAction(), 0.5);
		expect(closed.events).toContainEqual(
			expect.objectContaining({ kind: 'door-closed', portalId: 'service-door' })
		);
		expect(findEncounterRoute(encounter, 'entry', 'work', 'vision', closed.portalStates)).toBeNull();
	});

	it('triggers, persistently spoofs, and then disables an authored acoustic trap', () => {
		const system = new EncounterAcousticActorSystem(topology());
		const player = createPlayer();
		player.x = 465;
		player.y = 390;

		const triggered = system.step(player, quietAction(), 0.1);
		expect(triggered.events).toContainEqual(
			expect.objectContaining({ kind: 'trap-triggered', trapId: 'floor-chime' })
		);
		expect(triggered.sounds).toContainEqual(
			expect.objectContaining({ kind: 'trap', sourceKind: 'device' })
		);

		player.x = 250;
		system.step(player, quietAction(), 1.1);
		player.x = 465;
		const hacked = system.step(
			player,
			{ ...quietAction(), hack: true, hackPressed: true, hackHeld: true },
			0.1
		);
		expect(hacked.events).toContainEqual(
			expect.objectContaining({ kind: 'trap-spoofed', falseX: 280 })
		);

		player.x = 250;
		system.step(player, quietAction(), 1.1);
		player.x = 465;
		const spoofedTrigger = system.step(player, quietAction(), 0.1);
		expect(spoofedTrigger.sounds).toContainEqual(
			expect.objectContaining({ kind: 'decoy', x: 280, sourceKind: 'decoy' })
		);

		const disabled = system.step(
			player,
			{ ...quietAction(), hack: true, hackPressed: true, hackHeld: true },
			0.1
		);
		expect(disabled.events).toContainEqual(
			expect.objectContaining({ kind: 'trap-disabled', trapId: 'floor-chime' })
		);
		expect(system.getSnapshot().traps[0]?.state).toBe('disabled');
	});
});

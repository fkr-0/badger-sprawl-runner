import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { EnemyAlarmDeviceSystem } from './EnemyAlarmDeviceSystem';
import { EnemyCommunicationNetwork } from './EnemyCommunicationNetwork';
import type { ActionMap } from './InputSystem';

const quietAction = (): ActionMap => ({
	moveLeft: false, moveRight: false, jump: false, jumpPressed: false, fastFall: false,
	melee: false, meleePressed: false, shoot: false, shootPressed: false,
	item: false, itemPressed: false, parry: false, parryPressed: false,
	dodge: false, dodgePressed: false, hack: false, hackPressed: false,
	hackHeld: false, pause: false, pausePressed: false, debugToggle: false,
});

describe('EnemyAlarmDeviceSystem', () => {
	it('reports a real position into one local cell after bounded detection', () => {
		const player = createPlayer();
		player.x = 660;
		player.y = 360;
		const network = new EnemyCommunicationNetwork();
		const alarms = new EnemyAlarmDeviceSystem('lower-sprawl');
		const events = [];
		for (let index = 0; index < 18; index += 1) {
			events.push(...alarms.step(player, quietAction(), 0.1, network).events);
		}

		expect(events).toEqual(
			expect.arrayContaining([expect.objectContaining({ kind: 'alarm-triggered' })])
		);
		expect(network.getCellSnapshot()[0]).toMatchObject({
			lastKnownX: player.x + player.w / 2,
		});
	});

	it('plants a plausible false local report when hacked', () => {
		const player = createPlayer();
		player.x = 670;
		player.y = 350;
		const network = new EnemyCommunicationNetwork();
		const alarms = new EnemyAlarmDeviceSystem('lower-sprawl');
		const result = alarms.step(
			player,
			{ ...quietAction(), hack: true, hackPressed: true, hackHeld: true },
			0.1,
			network
		);

		expect(result.events[0]).toMatchObject({ kind: 'alarm-spoofed' });
		expect(network.getCellSnapshot()[0]?.lastKnownX).not.toBe(player.x + player.w / 2);
		expect(network.getCellSnapshot()[0]?.alert).toBeLessThan(0.72);
		expect(network.getCellSnapshot()[0]).toMatchObject({
			sourceKind: 'spoofed-sensor',
		});
	});

	it('can be physically disabled without changing unrelated devices', () => {
		const alarms = new EnemyAlarmDeviceSystem('chrome-arcology');
		expect(alarms.damageDevice('atrium-hospitality-eye', 3)).toEqual([
			{ kind: 'alarm-disabled', deviceId: 'atrium-hospitality-eye' },
		]);
		expect(alarms.getSnapshot()).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'atrium-hospitality-eye', state: 'disabled' }),
				expect.objectContaining({ id: 'freight-manifest-eye', state: 'armed' }),
			])
		);
	});

	it('resolves authored rail and melee placement against device durability', () => {
		const player = createPlayer();
		player.x = 40;
		player.y = 420;
		player.dir = 1;
		player.hasRailgun = true;
		const alarms = new EnemyAlarmDeviceSystem('test-stage', [
			{
				id: 'front-eye',
				stageId: 'test-stage',
				x: 180,
				y: 450,
				scanRadius: 100,
				hackRadius: 60,
				durability: 2,
				decoyOffset: 100,
			},
			{
				id: 'rear-eye',
				stageId: 'test-stage',
				x: 10,
				y: 450,
				scanRadius: 100,
				hackRadius: 60,
				durability: 2,
				decoyOffset: 100,
			},
		]);

		expect(
			alarms.resolvePlayerAttack(player, {
				...quietAction(),
				shoot: true,
				shootPressed: true,
			})
		).toEqual([{ kind: 'alarm-damaged', deviceId: 'front-eye', durability: 1 }]);
		expect(
			alarms.resolvePlayerAttack(player, {
				...quietAction(),
				shoot: true,
				shootPressed: true,
			})
		).toEqual([{ kind: 'alarm-disabled', deviceId: 'front-eye' }]);
		expect(alarms.getSnapshot()).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: 'front-eye', state: 'disabled' }),
				expect.objectContaining({ id: 'rear-eye', state: 'armed', durability: 2 }),
			])
		);
	});
});

import type { Player } from '../actors/MossBadger';
import type { ActionMap } from './InputSystem';
import type {
	EnemyCommunicationEvent,
	EnemyCommunicationNetwork,
} from './EnemyCommunicationNetwork';

export type AlarmDeviceState = 'armed' | 'cooldown' | 'spoofed' | 'disabled';

export interface AlarmDeviceDef {
	id: string;
	stageId: string;
	x: number;
	y: number;
	scanRadius: number;
	hackRadius: number;
	durability: number;
	decoyOffset: number;
}

interface AlarmDeviceRuntime extends AlarmDeviceDef {
	state: AlarmDeviceState;
	detection: number;
	cooldownRemaining: number;
	currentDurability: number;
}

export type EnemyAlarmDeviceEvent =
	| { kind: 'alarm-suspicious' | 'alarm-triggered'; deviceId: string; x: number; y: number }
	| { kind: 'alarm-spoofed'; deviceId: string; falseX: number; falseY: number }
	| { kind: 'alarm-damaged'; deviceId: string; durability: number }
	| { kind: 'alarm-disabled'; deviceId: string };

export interface EnemyAlarmStepResult {
	events: EnemyAlarmDeviceEvent[];
	communicationEvents: EnemyCommunicationEvent[];
}

export const ENEMY_ALARM_DEVICE_CATALOG: readonly AlarmDeviceDef[] = [
	{ id: 'toll-eye-west', stageId: 'lower-sprawl', x: 680, y: 390, scanRadius: 210, hackRadius: 105, durability: 2, decoyOffset: 430 },
	{ id: 'invoice-eye', stageId: 'drainmarket', x: 980, y: 350, scanRadius: 230, hackRadius: 110, durability: 2, decoyOffset: -460 },
	{ id: 'atrium-hospitality-eye', stageId: 'chrome-arcology', x: 720, y: 320, scanRadius: 245, hackRadius: 115, durability: 3, decoyOffset: 510 },
	{ id: 'freight-manifest-eye', stageId: 'chrome-arcology', x: 1680, y: 330, scanRadius: 250, hackRadius: 115, durability: 3, decoyOffset: -520 },
	{ id: 'reflection-usher', stageId: 'mirror-palace', x: 1120, y: 310, scanRadius: 250, hackRadius: 110, durability: 2, decoyOffset: 500 },
	{ id: 'chorus-crown-eye', stageId: 'dub-colony', x: 1260, y: 330, scanRadius: 220, hackRadius: 105, durability: 3, decoyOffset: -420 },
	{ id: 'forecast-tripod', stageId: 'antenna-barrens', x: 1380, y: 300, scanRadius: 270, hackRadius: 120, durability: 2, decoyOffset: 560 },
	{ id: 'cargo-authority-eye', stageId: 'orbital-lift', x: 1540, y: 300, scanRadius: 260, hackRadius: 115, durability: 3, decoyOffset: -540 },
	{ id: 'skylock-witness-eye', stageId: 'asteroid-redoubt', x: 1760, y: 290, scanRadius: 280, hackRadius: 120, durability: 3, decoyOffset: 600 },
];

/**
 * Hackable local alarm devices are knowledge actors, not global switches.
 * Armed devices report the real position to one bounded communication cell;
 * spoofed devices report a plausible false position to that same topology.
 */
export class EnemyAlarmDeviceSystem {
	private readonly devices: AlarmDeviceRuntime[];

	constructor(
		private readonly stageId: string,
		definitions: readonly AlarmDeviceDef[] = ENEMY_ALARM_DEVICE_CATALOG
	) {
		this.devices = definitions
			.filter((device) => device.stageId === stageId)
			.map((device) => ({
				...device,
				state: 'armed',
				detection: 0,
				cooldownRemaining: 0,
				currentDurability: device.durability,
			}));
	}

	step(
		player: Player,
		action: ActionMap,
		dt: number,
		communication: Pick<EnemyCommunicationNetwork, 'reportLocalIncident'>
	): EnemyAlarmStepResult {
		const events: EnemyAlarmDeviceEvent[] = [];
		const communicationEvents: EnemyCommunicationEvent[] = [];
		const playerX = player.x + player.w / 2;
		const playerY = player.y + player.h / 2;
		for (const device of this.devices) {
			if (device.state === 'disabled') continue;
			const distance = Math.hypot(playerX - device.x, playerY - device.y);
			if (action.hackPressed && distance <= device.hackRadius) {
				if (device.state === 'spoofed') {
					device.state = 'disabled';
					events.push({ kind: 'alarm-disabled', deviceId: device.id });
				} else {
					device.state = 'spoofed';
					device.detection = 0;
					const falseX = Math.max(0, device.x + device.decoyOffset);
					const falseY = device.y;
					events.push({ kind: 'alarm-spoofed', deviceId: device.id, falseX, falseY });
					communicationEvents.push(
						...communication.reportLocalIncident(
							this.stageId,
							device.x,
							falseX,
							falseY,
							0.55,
							device.id,
							'spoofed-sensor'
						)
					);
				}
				continue;
			}
			if (device.state === 'cooldown') {
				device.cooldownRemaining = Math.max(0, device.cooldownRemaining - Math.max(0, dt));
				if (device.cooldownRemaining === 0) device.state = 'armed';
				continue;
			}
			if (device.state === 'spoofed') continue;

			const loudAction = action.shootPressed || action.meleePressed || action.dodgePressed;
			if (distance <= device.scanRadius) {
				device.detection = Math.min(1, device.detection + Math.max(0, dt) * 0.72);
				if (device.detection >= 0.45 && device.detection - Math.max(0, dt) * 0.72 < 0.45) {
					events.push({ kind: 'alarm-suspicious', deviceId: device.id, x: playerX, y: playerY });
				}
			}
			if (loudAction && distance <= device.scanRadius * 2.2) device.detection = 1;
			if (device.detection < 1) continue;
			device.state = 'cooldown';
			device.cooldownRemaining = 4.5;
			device.detection = 0;
			events.push({ kind: 'alarm-triggered', deviceId: device.id, x: playerX, y: playerY });
			communicationEvents.push(
				...communication.reportLocalIncident(
					this.stageId,
					device.x,
					playerX,
					playerY,
					1,
					device.id,
					'sensor'
				)
			);
		}
		return { events, communicationEvents };
	}

	damageDevice(deviceId: string, amount: number): EnemyAlarmDeviceEvent[] {
		const device = this.devices.find((candidate) => candidate.id === deviceId);
		if (!device || device.state === 'disabled' || !Number.isFinite(amount) || amount <= 0) return [];
		device.currentDurability -= amount;
		if (device.currentDurability > 0) {
			return [
				{
					kind: 'alarm-damaged',
					deviceId,
					durability: device.currentDurability,
				},
			];
		}
		device.state = 'disabled';
		return [{ kind: 'alarm-disabled', deviceId }];
	}

	resolvePlayerAttack(player: Player, action: ActionMap): EnemyAlarmDeviceEvent[] {
		if (!action.shootPressed && !action.meleePressed) return [];
		const originX = player.x + player.w / 2;
		const originY = player.y + player.h / 2;
		const direction = player.dir < 0 ? -1 : 1;
		const railAttack = action.shootPressed && player.hasRailgun;
		const events: EnemyAlarmDeviceEvent[] = [];
		for (const device of this.devices) {
			if (device.state === 'disabled') continue;
			const dx = (device.x - originX) * direction;
			const dy = Math.abs(device.y - originY);
			const hit = railAttack
				? dx >= 0 && dx <= 620 && dy <= 72
				: action.meleePressed && Math.hypot(device.x - originX, device.y - originY) <= 82;
			if (!hit) continue;
			events.push(...this.damageDevice(device.id, railAttack ? 1 : 0.75));
		}
		return events;
	}

	getSnapshot(): Array<{
		id: string;
		x: number;
		y: number;
		state: AlarmDeviceState;
		detection: number;
		durability: number;
	}> {
		return this.devices.map((device) => ({
			id: device.id,
			x: device.x,
			y: device.y,
			state: device.state,
			detection: device.detection,
			durability: device.currentDurability,
		}));
	}
}

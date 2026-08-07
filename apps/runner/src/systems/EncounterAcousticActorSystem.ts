import type { Player } from '../actors/MossBadger';
import type { ActionMap } from './InputSystem';
import type { PlayerSoundEvent } from './EnemyPerceptionMemorySystem';
import type {
	EncounterPortalState,
	EncounterTrapDef,
	StageEncounterTopology,
} from '../world/EncounterTopology';

export type AcousticTrapState = 'armed' | 'spoofed' | 'cooldown' | 'disabled';

interface DoorRuntime {
	open: boolean;
	touched: boolean;
	holdRemaining: number;
}

interface TrapRuntime extends EncounterTrapDef {
	state: AcousticTrapState;
	cooldownReturnState: 'armed' | 'spoofed';
	cooldownRemaining: number;
	insideLastStep: boolean;
}

export type EncounterAcousticActorEvent =
	| { kind: 'door-opened' | 'door-closed'; portalId: string; x: number; y: number }
	| { kind: 'trap-triggered'; trapId: string; x: number; y: number }
	| { kind: 'trap-spoofed'; trapId: string; falseX: number; falseY: number }
	| { kind: 'trap-disabled'; trapId: string; x: number; y: number };

export interface EncounterAcousticActorStepResult {
	events: EncounterAcousticActorEvent[];
	sounds: PlayerSoundEvent[];
	portalStates: Readonly<Record<string, EncounterPortalState>>;
}

const DOOR_OPEN_RADIUS = 92;
const DOOR_CLOSE_RADIUS = 142;
const DOOR_HOLD_SECONDS = 0.85;

/**
 * Owns authored door/trap acoustic state for one encounter.
 *
 * Doors only project portal openness and sound events. Traps only project local
 * sound/decoy evidence. Damage, AI engagement and quest state remain owned by
 * their existing systems.
 */
export class EncounterAcousticActorSystem {
	private readonly doors = new Map<string, DoorRuntime>();
	private readonly traps: TrapRuntime[];
	private readonly portalStates: Record<string, EncounterPortalState> = {};

	constructor(private readonly topology: StageEncounterTopology | null) {
		for (const portal of topology?.portals ?? []) {
			if (!isAudibleDoor(portal.tags)) continue;
			const open = portal.defaultOpen;
			this.doors.set(portal.id, {
				open,
				touched: false,
				holdRemaining: open ? DOOR_HOLD_SECONDS : 0,
			});
			this.portalStates[portal.id] = { open };
		}
		this.traps = (topology?.traps ?? []).map((trap) => ({
			...trap,
			tags: [...trap.tags],
			state: 'armed',
			cooldownReturnState: 'armed',
			cooldownRemaining: 0,
			insideLastStep: false,
		}));
	}

	step(player: Player, action: ActionMap, dt: number): EncounterAcousticActorStepResult {
		const safeDt = Math.max(0, Number.isFinite(dt) ? dt : 0);
		const events: EncounterAcousticActorEvent[] = [];
		const sounds: PlayerSoundEvent[] = [];
		const playerX = player.x + player.w / 2;
		const playerY = player.y + player.h / 2;

		for (const portal of this.topology?.portals ?? []) {
			const door = this.doors.get(portal.id);
			if (!door) continue;
			const centerX = portal.x + portal.w / 2;
			const centerY = portal.y + portal.h / 2;
			const distance = Math.hypot(playerX - centerX, playerY - centerY);
			if (distance <= DOOR_OPEN_RADIUS) {
				door.touched = true;
				door.holdRemaining = DOOR_HOLD_SECONDS;
				if (!door.open) {
					door.open = true;
					this.portalStates[portal.id] = { open: true };
					events.push({ kind: 'door-opened', portalId: portal.id, x: centerX, y: centerY });
					sounds.push(sound('door', centerX, centerY, 0.48, 430, portal.id, 'environment'));
				}
			} else if (door.open && door.touched) {
				door.holdRemaining = Math.max(0, door.holdRemaining - safeDt);
				if (distance >= DOOR_CLOSE_RADIUS && door.holdRemaining <= 0) {
					door.open = false;
					this.portalStates[portal.id] = { open: false };
					events.push({ kind: 'door-closed', portalId: portal.id, x: centerX, y: centerY });
					sounds.push(sound('door', centerX, centerY, 0.34, 330, portal.id, 'environment'));
				}
			}
		}

		for (const trap of this.traps) {
			trap.cooldownRemaining = Math.max(0, trap.cooldownRemaining - safeDt);
			if (trap.state === 'cooldown' && trap.cooldownRemaining <= 0) {
				trap.state = trap.cooldownReturnState;
			}
			const distance = Math.hypot(playerX - trap.x, playerY - trap.y);
			if (action.hackPressed && distance <= trap.hackRadius && trap.state !== 'disabled') {
				const ownsSpoof =
					trap.state === 'spoofed' ||
					(trap.state === 'cooldown' && trap.cooldownReturnState === 'spoofed');
				if (ownsSpoof) {
					trap.state = 'disabled';
					trap.cooldownRemaining = 0;
					events.push({ kind: 'trap-disabled', trapId: trap.id, x: trap.x, y: trap.y });
					sounds.push(sound('trap', trap.x, trap.y, 0.22, 190, trap.id, 'device'));
				} else {
					trap.state = 'spoofed';
					trap.cooldownReturnState = 'spoofed';
					const falseX = Math.max(0, trap.x + trap.decoyOffset);
					events.push({ kind: 'trap-spoofed', trapId: trap.id, falseX, falseY: trap.y });
					sounds.push(sound('decoy', falseX, trap.y, 0.42, 470, trap.id, 'decoy'));
				}
				trap.insideLastStep = distance <= trap.triggerRadius;
				continue;
			}
			const inside = distance <= trap.triggerRadius;
			if (inside && !trap.insideLastStep && trap.cooldownRemaining <= 0) {
				if (trap.state === 'spoofed') {
					trap.cooldownReturnState = 'spoofed';
					const falseX = Math.max(0, trap.x + trap.decoyOffset);
					events.push({ kind: 'trap-spoofed', trapId: trap.id, falseX, falseY: trap.y });
					sounds.push(sound('decoy', falseX, trap.y, trap.intensity * 0.62, trap.soundRadius, trap.id, 'decoy'));
				} else if (trap.state === 'armed') {
					trap.cooldownReturnState = 'armed';
					events.push({ kind: 'trap-triggered', trapId: trap.id, x: trap.x, y: trap.y });
					sounds.push(sound('trap', trap.x, trap.y, trap.intensity, trap.soundRadius, trap.id, 'device'));
				}
				trap.state = 'cooldown';
				trap.cooldownRemaining = trap.cooldownSeconds;
			}
			trap.insideLastStep = inside;
		}

		return { events, sounds, portalStates: this.getPortalStates() };
	}

	getPortalStates(): Readonly<Record<string, EncounterPortalState>> {
		return Object.fromEntries(
			Object.entries(this.portalStates).map(([portalId, state]) => [portalId, { ...state }])
		);
	}

	getSnapshot(): {
		doors: Array<{ portalId: string; open: boolean }>;
		traps: Array<{ id: string; label: string; x: number; y: number; state: AcousticTrapState; tags: string[] }>;
	} {
		return {
			doors: [...this.doors.entries()]
				.map(([portalId, state]) => ({ portalId, open: state.open }))
				.sort((a, b) => a.portalId.localeCompare(b.portalId)),
			traps: this.traps
				.map((trap) => ({ id: trap.id, label: trap.label, x: trap.x, y: trap.y, state: trap.state, tags: [...trap.tags] }))
				.sort((a, b) => a.id.localeCompare(b.id)),
		};
	}
}

function isAudibleDoor(tags: readonly string[]): boolean {
	return tags.includes('door') || tags.includes('security') || tags.includes('iris') || tags.includes('gate');
}

function sound(
	kind: PlayerSoundEvent['kind'],
	x: number,
	y: number,
	intensity: number,
	radius: number,
	sourceId: string,
	sourceKind: NonNullable<PlayerSoundEvent['sourceKind']>
): PlayerSoundEvent {
	return { kind, x, y, intensity, radius, sourceId, sourceKind };
}

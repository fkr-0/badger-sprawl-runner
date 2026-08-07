import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { getStageEncounterTopology } from '../world/EncounterTopologyCatalog';
import type { CombatEntity } from './CombatSystem';
import { EncounterReadinessSystem } from './EncounterReadinessSystem';
import { EnemyPerceptionMemorySystem } from './EnemyPerceptionMemorySystem';
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

function enemy(id: string, x: number): CombatEntity {
	return {
		id,
		x,
		y: 462,
		w: 34,
		h: 32,
		vx: 0,
		vy: 0,
		dir: -1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 2,
		maxHp: 2,
		stun: 0,
		invuln: 0,
		awarenessState: 'routine',
		awarenessLevel: 0,
		communicationRole: 'observer',
	};
}

describe('EnemyPerceptionMemorySystem', () => {
	it('makes a nearby enemy investigate a shot without informing a distant enemy', () => {
		const player = createPlayer();
		player.x = 180;
		const near = enemy('near', 360);
		const far = enemy('far', 1300);
		const perception = new EnemyPerceptionMemorySystem();
		const readiness = new EncounterReadinessSystem();

		const events = perception.step(
			[near, far],
			player,
			{ ...quietAction(), shoot: true, shootPressed: true },
			0.1,
			readiness
		);

		expect(events).toEqual(
			expect.arrayContaining([expect.objectContaining({ kind: 'sound-heard', enemyId: 'near' })])
		);
		expect(near.perceptionState).toBe('investigating');
		expect(near.lastKnownPlayerX).toBeDefined();
		expect(far.perceptionState).toBe('calm');
		expect(far.lastKnownPlayerX).toBeUndefined();
	});

	it('searches a bounded last-known area and eventually returns to calm', () => {
		const player = createPlayer();
		player.x = 220;
		const guard = enemy('guard', 280);
		const perception = new EnemyPerceptionMemorySystem({
			confidenceDecayPerSecond: 1,
			investigateSpeed: 90,
			searchRadius: 40,
			searchSeconds: 0.4,
			engageConfidence: 2,
			minimumAudibleConfidence: 0.02,
		});
		const readiness = new EncounterReadinessSystem();
		perception.step(
			[guard],
			player,
			{ ...quietAction(), dodge: true, dodgePressed: true },
			0.1,
			readiness
		);
		for (let index = 0; index < 30; index += 1) {
			perception.step([guard], player, quietAction(), 0.1, readiness);
		}

		expect(guard.perceptionState).toBe('calm');
		expect(guard.soundConfidence).toBe(0);
	});

	it('keeps hack pulses much quieter than rail shots', () => {
		const player = createPlayer();
		const perception = new EnemyPerceptionMemorySystem();
		const shot = perception.derivePlayerSounds(
			player,
			{ ...quietAction(), shoot: true, shootPressed: true },
			0.1
		)[0];
		const hack = perception.derivePlayerSounds(
			player,
			{ ...quietAction(), hack: true, hackPressed: true, hackHeld: true },
			0.1
		)[0];

		expect(shot?.radius).toBeGreaterThan(hack?.radius ?? 0);
		expect(shot?.intensity).toBeGreaterThan(hack?.intensity ?? 0);
	});

	it('attenuates environmental sound through authored acoustic portals', () => {
		const player = createPlayer();
		player.x = 50;
		const guard = enemy('stronghold-guard', 1450);
		const topology = getStageEncounterTopology('lower-sprawl');
		const perception = new EnemyPerceptionMemorySystem();
		const readiness = new EncounterReadinessSystem();

		const events = perception.step([guard], player, quietAction(), 0.1, readiness, {
			topology,
			externalSounds: [
				{
					kind: 'alarm',
					x: 100,
					y: 450,
					intensity: 1,
					radius: 2200,
					sourceId: 'station-alarm',
					sourceKind: 'device',
				},
			],
		});

		expect(events).toContainEqual(
			expect.objectContaining({
				kind: 'sound-heard',
				enemyId: 'stronghold-guard',
				sourceId: 'station-alarm',
				portalIds: ['lower-sprawl:portal-a', 'lower-sprawl:portal-b'],
			})
		);
		expect(guard.soundConfidence).toBeGreaterThan(0);
		expect(guard.soundConfidence).toBeLessThan(0.35);
	});

	it('contains environmental sound when an authored acoustic portal is closed', () => {
		const player = createPlayer();
		const guard = enemy('stronghold-guard', 1450);
		const events = new EnemyPerceptionMemorySystem().step(
			[guard],
			player,
			quietAction(),
			0.1,
			new EncounterReadinessSystem(),
			{
				topology: getStageEncounterTopology('lower-sprawl'),
				portalStates: { 'lower-sprawl:portal-b': { open: false } },
				externalSounds: [
					{
						kind: 'impact',
						x: 100,
						y: 450,
						intensity: 1,
						radius: 2200,
						sourceId: 'falling-door',
						sourceKind: 'environment',
					},
				],
			}
		);

		expect(events).not.toContainEqual(
			expect.objectContaining({ kind: 'sound-heard', enemyId: 'stronghold-guard' })
		);
		expect(guard.perceptionState).toBe('calm');
	});
});

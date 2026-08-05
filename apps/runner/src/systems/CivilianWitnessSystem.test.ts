import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { CivilianWitnessSystem, type CivilianWitnessDef } from './CivilianWitnessSystem';
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

function witness(overrides: Partial<CivilianWitnessDef> = {}): CivilianWitnessDef {
	return {
		id: 'witness',
		stageId: 'orbital-lift',
		label: 'Witness',
		x: 300,
		y: 400,
		radius: 300,
		initialTrust: 0.5,
		disposition: 'precarious',
		decoyOffset: 420,
		...overrides,
	};
}

function enemy(overrides: Partial<CombatEntity> = {}): CombatEntity {
	return {
		id: 'porter-guard',
		x: 340,
		y: 400,
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
		communicationCellId: 'orbital-lift:cell:0',
		cohesionState: 'committed',
		...overrides,
	};
}

describe('CivilianWitnessSystem', () => {
	it('warns a local cell after repeated unjustified violence and may withdraw', () => {
		const system = new CivilianWitnessSystem('orbital-lift', [witness({ initialTrust: 0.46 })]);
		const player = createPlayer();
		player.x = 280;
		player.y = 380;
		const communication = { reportLocalIncident: vi.fn(() => []) };
		const cohesion = { offerStandDown: vi.fn() };
		const violent = { ...quietAction(), shoot: true, shootPressed: true };

		system.step(player, violent, [], 0.1, communication, cohesion);
		const result = system.step(player, violent, [], 0.1, communication, cohesion);

		expect(result.events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ kind: 'civilian-warning', witnessId: 'witness' }),
				expect.objectContaining({ kind: 'civilian-withdrew', witnessId: 'witness' }),
			])
		);
		expect(communication.reportLocalIncident).toHaveBeenCalledWith(
			'orbital-lift',
			300,
			expect.any(Number),
			expect.any(Number),
			0.82,
			'witness',
			'civilian-witness'
		);
	});

	it('misdirects authority after documented public aid and authority harm', () => {
		const system = new CivilianWitnessSystem('antenna-barrens', [
			witness({ stageId: 'antenna-barrens', initialTrust: 0.68, decoyOffset: -200 }),
		]);
		const player = createPlayer();
		player.x = 280;
		player.y = 380;
		const communication = { reportLocalIncident: vi.fn(() => []) };
		const cohesion = { offerStandDown: vi.fn() };
		system.recordPublicAid('witness', 0.2);
		system.recordAuthorityHarm('witness', 0.8);

		const result = system.step(player, quietAction(), [], 0.1, communication, cohesion);

		expect(result.events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ kind: 'civilian-misdirection', x: 100 }),
			])
		);
		expect(communication.reportLocalIncident).toHaveBeenCalledWith(
			'antenna-barrens',
			300,
			100,
			400,
			0.7,
			'witness',
			'civilian-witness'
		);
	});

	it('lends local legitimacy to a wavering patrol stand-down', () => {
		const system = new CivilianWitnessSystem('asteroid-redoubt', [
			witness({ stageId: 'asteroid-redoubt', initialTrust: 0.82 }),
		]);
		const player = createPlayer();
		const communication = { reportLocalIncident: vi.fn(() => []) };
		const cohesion = { offerStandDown: vi.fn() };
		const wavering = enemy({
			communicationCellId: 'asteroid-redoubt:cell:0',
			cohesionState: 'wavering',
		});

		const result = system.step(player, quietAction(), [wavering], 0.1, communication, cohesion);

		expect(result.events).toContainEqual(
			expect.objectContaining({
				kind: 'civilian-stand-down-appeal',
				cellId: 'asteroid-redoubt:cell:0',
			})
		);
		expect(cohesion.offerStandDown).toHaveBeenCalledWith('asteroid-redoubt:cell:0', 0.82);
	});

	it('projects and follows an authored evacuation route under local danger', () => {
		const system = new CivilianWitnessSystem('orbital-lift', [
			witness({ initialTrust: 0.7 }),
		]);
		system.configureEvacuationRoutes([
			{
				id: 'orbital-lift:evacuation-test',
				fromZoneId: 'stronghold',
				toZoneId: 'entry',
				waypoints: [
					{ x: 300, y: 400 },
					{ x: 240, y: 400 },
					{ x: 180, y: 400 },
				],
				trigger: 'combat',
				capacity: 4,
				accessibilityCue: 'Three chalk bars point left.',
			},
		]);
		const player = createPlayer();
		player.x = 280;
		player.y = 380;
		const communication = { reportLocalIncident: vi.fn(() => []) };
		const cohesion = { offerStandDown: vi.fn() };
		const violent = { ...quietAction(), shoot: true, shootPressed: true };

		system.step(player, violent, [], 0.1, communication, cohesion);
		const started = system.step(player, violent, [], 0.1, communication, cohesion);
		expect(started.events).toContainEqual(
			expect.objectContaining({
				kind: 'civilian-evacuating',
				routeId: 'orbital-lift:evacuation-test',
			})
		);

		const routeEvents = [];
		for (let index = 0; index < 20; index += 1) {
			routeEvents.push(...system.step(player, quietAction(), [], 0.2, communication, cohesion).events);
		}
		expect(routeEvents).toContainEqual(
			expect.objectContaining({ kind: 'civilian-sheltered' })
		);
		expect(system.getSnapshot()[0]).toMatchObject({
			state: 'sheltering',
			x: 180,
			evacuationRouteId: 'orbital-lift:evacuation-test',
			evacuationCue: 'Three chalk bars point left.',
		});
	});
});

import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { EnemyCohesionSystem } from './EnemyCohesionSystem';

function enemy(id: string, role: CombatEntity['communicationRole'] = 'observer'): CombatEntity {
	return {
		id,
		x: 300,
		y: 440,
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
		awarenessState: 'engaged',
		awarenessLevel: 1,
		communicationCellId: 'mirror-palace:cell:0',
		communicationRole: role,
		networkReportConflict: 0,
	};
}

describe('EnemyCohesionSystem', () => {
	it('keeps a supported intact patrol committed', () => {
		const system = new EnemyCohesionSystem();
		const members = [enemy('observer'), enemy('relay', 'relay'), enemy('enforcer', 'enforcer')];
		system.step(members, createPlayer(), 1);

		expect(members.map((member) => member.cohesionState)).toEqual([
			'committed',
			'committed',
			'committed',
		]);
	});

	it('breaks local cohesion after casualties, relay loss, and contradictory intelligence', () => {
		const system = new EnemyCohesionSystem();
		const members = [enemy('observer'), enemy('relay', 'relay'), enemy('enforcer', 'enforcer')];
		system.step(members, createPlayer(), 0);
		members[1]!.hp = 0;
		members[2]!.hp = 0;
		members[0]!.networkReportConflict = 0.7;
		const events = system.step(members, createPlayer(), 1);

		expect(events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ kind: 'cell-cohesion-broken' }),
				expect.objectContaining({ kind: 'enemy-retreating', enemyId: 'observer' }),
			])
		);
		expect(members[0]).toMatchObject({
			cohesionState: 'retreating',
			aiState: 'retreat',
			awarenessState: 'alert',
		});
	});

	it('requires legitimate local pressure before wavering enemies stand down', () => {
		const system = new EnemyCohesionSystem();
		const members = [enemy('observer'), enemy('relay', 'relay')];
		system.step(members, createPlayer(), 0);
		members[1]!.hp = 0;
		members[0]!.networkReportConflict = 0.45;
		system.offerStandDown('mirror-palace:cell:0', 0.9);
		const events = system.step(members, createPlayer(), 1);

		expect(events).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ kind: 'enemy-standing-down', enemyId: 'observer' }),
			])
		);
		expect(members[0]).toMatchObject({
			cohesionState: 'standing-down',
			aiState: 'stand-down',
			awarenessState: 'routine',
		});
	});
});

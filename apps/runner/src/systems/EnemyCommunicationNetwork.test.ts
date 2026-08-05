import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { CombatEntity } from './CombatSystem';
import { EnemyCommunicationNetwork, inferCommunicationRole } from './EnemyCommunicationNetwork';
import { EncounterReadinessSystem } from './EncounterReadinessSystem';

function enemy(id: string, x: number, role: string, engaged = false): CombatEntity {
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
		procgenRole: role,
		awarenessState: engaged ? 'engaged' : 'routine',
		awarenessLevel: engaged ? 1 : 0,
	};
}

describe('EnemyCommunicationNetwork', () => {
	it('assigns communication jobs from combat roles', () => {
		expect(inferCommunicationRole(enemy('watcher', 100, 'patrol'))).toBe('observer');
		expect(inferCommunicationRole(enemy('radio', 120, 'turret'))).toBe('relay');
		expect(inferCommunicationRole(enemy('heavy', 140, 'bruiser'))).toBe('enforcer');
		expect(inferCommunicationRole({ ...enemy('boss', 160, 'boss'), bossId: 'captain' })).toBe(
			'isolated'
		);
	});

	it('shares suspicion inside one local cell without alerting the whole level', () => {
		const network = new EnemyCommunicationNetwork();
		const readiness = new EncounterReadinessSystem();
		const player = createPlayer();
		player.x = 170;
		const source = enemy('source', 120, 'patrol', true);
		const local = enemy('local', 250, 'bruiser');
		const distant = enemy('distant', 1200, 'patrol');

		for (let index = 0; index < 12; index += 1) {
			network.step('lower-sprawl', [source, local, distant], player, 0.1, readiness);
		}

		expect(local.awarenessLevel).toBeGreaterThan(0);
		expect(local.lastKnownPlayerX).toBeDefined();
		expect(distant.awarenessLevel ?? 0).toBe(0);
		expect(distant.lastKnownPlayerX).toBeUndefined();
	});

	it('allows a relay to warn only one adjacent cell and caps the propagated alert', () => {
		const network = new EnemyCommunicationNetwork();
		const readiness = new EncounterReadinessSystem();
		const player = createPlayer();
		player.x = 180;
		const source = enemy('source', 120, 'patrol', true);
		const relay = enemy('relay', 180, 'turret');
		const adjacent = enemy('adjacent', 520, 'patrol');
		const twoCellsAway = enemy('far', 980, 'patrol');

		const events = [];
		for (let index = 0; index < 30; index += 1) {
			events.push(
				...network.step(
					'lower-sprawl',
					[source, relay, adjacent, twoCellsAway],
					player,
					0.1,
					readiness
				)
			);
		}

		expect(events.some((event) => event.kind === 'relay-signal')).toBe(true);
		expect(adjacent.networkAlert).toBeGreaterThan(0);
		expect(adjacent.networkAlert).toBeLessThan(0.7);
		expect(twoCellsAway.networkAlert ?? 0).toBe(0);
	});

	it('accepts a local alarm report without granting level-wide knowledge', () => {
		const network = new EnemyCommunicationNetwork();
		const readiness = new EncounterReadinessSystem();
		const player = createPlayer();
		const local = enemy('local', 220, 'patrol');
		const distant = enemy('distant', 1400, 'patrol');

		expect(
			network.reportLocalIncident('chrome-arcology', 180, 330, 430, 1, 'atrium-alarm')
		).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'cell-alerted' })]));
		for (let index = 0; index < 8; index += 1) {
			network.step('chrome-arcology', [local, distant], player, 0.1, readiness);
		}

		expect(local.lastKnownPlayerX).toBe(330);
		expect(local.awarenessLevel).toBeGreaterThan(0);
		expect(distant.lastKnownPlayerX).toBeUndefined();
	});

	it('retains contradictory local reports and reduces patrol trust instead of averaging reality', () => {
		const network = new EnemyCommunicationNetwork();
		const readiness = new EncounterReadinessSystem();
		const player = createPlayer();
		const local = enemy('local', 220, 'patrol');

		network.reportLocalIncident('mirror-palace', 180, 300, 420, 0.9, 'staff-eye');
		const events = network.reportLocalIncident(
			'mirror-palace',
			180,
			760,
			420,
			0.75,
			'spoofed-mirror'
		);
		network.step('mirror-palace', [local], player, 0.1, readiness);

		expect(events).toEqual(
			expect.arrayContaining([expect.objectContaining({ kind: 'cell-conflicted' })])
		);
		expect(network.getCellSnapshot()[0]).toMatchObject({
			primarySourceId: 'staff-eye',
			lastKnownX: 300,
			reportCount: 2,
		});
		expect(network.getCellSnapshot()[0]!.reportTrust).toBeLessThan(0.7);
		expect(network.getCellSnapshot()[0]!.reportConflict).toBeGreaterThan(0.3);
		expect(local.networkReportConflict).toBeGreaterThan(0.3);
	});

	it('applies district source doctrine before contradictory reports enter consensus', () => {
		const network = new EnemyCommunicationNetwork();
		network.reportLocalIncident(
			'orbital-lift',
			180,
			300,
			420,
			0.8,
			'passenger-witness',
			'civilian-witness'
		);
		network.reportLocalIncident(
			'orbital-lift',
			180,
			760,
			420,
			0.8,
			'cargo-authority-eye',
			'sensor'
		);

		expect(network.getCellSnapshot()[0]).toMatchObject({
			primarySourceId: 'cargo-authority-eye',
			sourceKind: 'sensor',
			sourceTrustWeight: 1,
			doctrineLabel: 'THE MANIFEST SPEAKS BEFORE THE PASSENGER',
			lastKnownX: 760,
		});
	});
});


import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import type { StageEncounterTopology } from '../world/EncounterTopology';
import type { CombatEntity } from './CombatSystem';
import { EncounterReadinessSystem } from './EncounterReadinessSystem';
import { EnemyVisionSystem } from './EnemyVisionSystem';

function enemy(id: string, x: number, y = 440): CombatEntity {
	return {
		id,
		x,
		y,
		w: 30,
		h: 40,
		vx: 0,
		vy: 0,
		dir: 1,
		onGround: true,
		coyoteLeft: 0,
		jumpBuffered: 0,
		hp: 2,
		maxHp: 2,
		stun: 0,
		invuln: 0,
		procgenRole: 'patrol',
	};
}

function topology(withOccluder = false): StageEncounterTopology {
	return {
		stageId: 'test-stage',
		zones: [
			{ id: 'west', label: 'West', x: 0, y: 0, w: 300, h: 500, major: false, tags: [] },
			{ id: 'east', label: 'East', x: 300, y: 0, w: 300, h: 500, major: true, tags: [] },
		],
		portals: [
			{
				id: 'gate',
				fromZoneId: 'west',
				toZoneId: 'east',
				x: 290,
				y: 250,
				w: 20,
				h: 250,
				visionTransmission: 0.5,
				soundTransmission: 0.7,
				defaultOpen: true,
				tags: [],
			},
		],
		occluders: withOccluder
			? [
					{
						id: 'billboard',
						x: 170,
						y: 350,
						w: 30,
						h: 150,
						blocksVision: true,
						soundLoss: 0.2,
						tags: [],
					},
				]
			: [],
		civilianRoutes: [],
		approachPlans: [
			{
				id: 'quiet',
				zoneId: 'east',
				label: 'Quiet',
				approaches: ['ghoststep'],
				entryPortalIds: ['gate'],
				requiredTags: [],
				risk: 'low',
				playerCue: 'Use cover.',
				worldConsequenceHint: 'Nobody panics.',
			},
			{
				id: 'loud',
				zoneId: 'east',
				label: 'Loud',
				approaches: ['ballistics'],
				entryPortalIds: ['gate'],
				requiredTags: [],
				risk: 'high',
				playerCue: 'Break through.',
				worldConsequenceHint: 'Repairs rise.',
			},
		],
	};
}

describe('EnemyVisionSystem', () => {
	it('attenuates cross-zone visibility through authored portals', () => {
		const player = createPlayer();
		player.x = 390;
		player.y = 440;
		const guard = enemy('guard', 180);
		const step = new EnemyVisionSystem().step([guard], player, topology());
		const evidence = step.evidenceByEnemyId.get('guard');

		expect(evidence).toMatchObject({
			visible: true,
			enemyZoneId: 'west',
			playerZoneId: 'east',
			portalIds: ['gate'],
		});
		expect(evidence?.confidence).toBeGreaterThan(0);
		expect(evidence?.confidence).toBeLessThan(0.5);
		expect(guard.visionState).toBe('visible');
	});

	it('treats closed portals and solid authored cover as loss of sight', () => {
		const player = createPlayer();
		player.x = 390;
		player.y = 440;
		const gateGuard = enemy('gate-guard', 180);
		const closed = new EnemyVisionSystem().step([gateGuard], player, topology(), {
			gate: { open: false },
		});
		expect(closed.evidenceByEnemyId.get('gate-guard')).toMatchObject({
			visible: false,
			reason: 'topology',
		});

		const coveredGuard = enemy('covered', 70);
		const coveredPlayer = createPlayer();
		coveredPlayer.x = 240;
		coveredPlayer.y = 440;
		const covered = new EnemyVisionSystem().step(
			[coveredGuard],
			coveredPlayer,
			topology(true)
		);
		expect(covered.evidenceByEnemyId.get('covered')).toMatchObject({
			visible: false,
			reason: 'occluded',
			blockerId: 'billboard',
		});
	});

	it('feeds confidence into the single readiness owner without direct engagement mutation', () => {
		const player = createPlayer();
		player.x = 390;
		player.y = 440;
		const guard = enemy('guard', 180);
		const vision = new EnemyVisionSystem();
		const readiness = new EncounterReadinessSystem();
		for (let index = 0; index < 45; index += 1) {
			const evidence = vision.step([guard], player, topology()).evidenceByEnemyId;
			readiness.step([guard], player, 0.03, evidence);
		}
		expect(guard.awarenessState).toBe('engaged');
	});
});

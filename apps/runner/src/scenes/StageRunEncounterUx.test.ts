import { describe, expect, it } from 'vitest';
import { StageRunScene } from './StageRunScene';

describe('StageRunScene encounter UX', () => {
	it('projects two player-readable plans only inside major authored zones', () => {
		const scene = new StageRunScene({ stageId: 'lower-sprawl' });
		expect(scene.getEncounterPlanHudSnapshot()).toBeNull();

		scene.debugTeleportPlayer(900, 430);
		expect(scene.getEncounterPlanHudSnapshot()).toMatchObject({
			zoneId: 'lower-sprawl:work',
			zoneLabel: 'Meter market and toll queue',
			plans: [
				{
					id: 'lower-sprawl:work-plan-1',
					label: 'Ride the dead signal',
					risk: 'low',
					approaches: ['ghoststep', 'hacking'],
				},
				{
					id: 'lower-sprawl:work-plan-2',
					label: 'Enter through the argument',
					risk: 'medium',
					approaches: ['social', 'claw'],
				},
			],
		});
	});

	it('keeps training free of story-route recommendations', () => {
		const scene = new StageRunScene({
			stageId: 'lower-sprawl',
			training: { enabled: true, seed: 'ux-test' },
		});
		scene.debugTeleportPlayer(900, 430);
		expect(scene.getEncounterPlanHudSnapshot()).toBeNull();
	});
});

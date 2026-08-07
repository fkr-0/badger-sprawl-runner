import { describe, expect, it, vi } from 'vitest';
import { createGameFlow } from '../game/GameFlow';
import { createDefaultAdventureSave } from '../game/adventure/AdventureState';
import { WorldDirector } from '../game/adventure/WorldDirector';
import { SubwayMapScene } from './SubwayMapScene';

describe('SubwayMapScene', () => {
	it('starts at the persistent current location and exposes reachable places', () => {
		const scene = new SubwayMapScene({ flow: createGameFlow(), world: new WorldDirector() });
		expect(scene.getSnapshot()).toMatchObject({
			currentLocationId: 'lower-sprawl:safehouse',
			selectedLocationId: 'lower-sprawl:safehouse',
			networkHealth: expect.any(Number),
			networkLabel: expect.any(String),
			worldBeat: expect.any(String),
			scheduleLabel: expect.any(String),
		});
		expect(scene.getSnapshot().reachableLocationIds).toContain('lower-sprawl:settlement');
		expect(scene.getSnapshot()).toMatchObject({
			activeCampaignPhase: 6,
			campaignPhases: [
				expect.objectContaining({ phase: 6, ready: false }),
				expect.objectContaining({ phase: 7, ready: false }),
				expect.objectContaining({ phase: 8, ready: false }),
				expect.objectContaining({ phase: 9, ready: false }),
			],
		});
	});

	it('projects material final-doctrine support and warnings into the world shell', () => {
		const flow = createGameFlow(undefined, {
			campaignComplete: true,
			currentStageId: 'asteroid-redoubt',
			completedStageIds: ['asteroid-redoubt'],
			finalBroadcastDoctrine: 'abolish-skylock',
		});
		const world = new WorldDirector(
			undefined,
			createDefaultAdventureSave({
				worldFlags: ['lower-sprawl:blue-mercy-public', 'homecoming:return-delegation-arrived'],
			})
		);
		const snapshot = new SubwayMapScene({ flow, world }).getSnapshot();

		expect(snapshot.finalDoctrineReadiness).toMatchObject({
			doctrine: 'abolish-skylock',
			materiallyGrounded: false,
			score: 2,
		});
		expect(snapshot.finalDoctrineReadiness?.warnings).toEqual(
			expect.arrayContaining([
				expect.stringContaining('appeal path'),
				expect.stringContaining('right to refuse'),
			])
		);
	});

	it('travels through an unlocked edge and autosaves the world position', () => {
		const world = new WorldDirector();
		const onAutosaveWorld = vi.fn();
		const scene = new SubwayMapScene({ flow: createGameFlow(), world, onAutosaveWorld });
		scene.moveSelection(1);
		const selected = scene.getSnapshot().selectedLocationId;
		const result = scene.confirmSelection();

		expect(result?.ok).toBe(true);
		expect(world.getState().currentLocationId).toBe(selected);
		expect(onAutosaveWorld).toHaveBeenCalledTimes(1);
	});

	it('deploys only from the active story district expedition node', () => {
		const onDeployStory = vi.fn();
		const scene = new SubwayMapScene({
			flow: createGameFlow(),
			world: new WorldDirector(),
			onDeployStory,
		});
		expect(scene.selectLocation('lower-sprawl:settlement')).toBe(true);
		scene.confirmSelection();
		expect(scene.selectLocation('lower-sprawl:route')).toBe(true);
		scene.confirmSelection();
		expect(onDeployStory).toHaveBeenCalledTimes(1);
	});
});

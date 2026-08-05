import { describe, expect, it } from 'vitest';
import { createPlayer } from '../actors/MossBadger';
import { PhysicsSystem, type Platform } from '../systems/PhysicsSystem';
import type { ActionMap } from '../systems/InputSystem';
import {
	getTraversalEnvironmentProfile,
	validateTraversalEnvironmentProfiles,
} from './OrbitalTraversalProfile';

const FLOOR: Platform = { x: 0, y: 466, w: 1600, h: 80 };

function emptyAction(): ActionMap {
	return {
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
	};
}

function jumpTrace(stageId: Parameters<typeof getTraversalEnvironmentProfile>[0]) {
	const player = createPlayer();
	const profile = getTraversalEnvironmentProfile(stageId);
	player.x = 80;
	player.y = FLOOR.y - player.h;
	player.onGround = true;
	player.environmentGravityMultiplier = profile.gravityMultiplier;
	player.environmentAirControlMultiplier = profile.airControlMultiplier;
	player.environmentMaxFallSpeedDelta = profile.maxFallSpeedDelta;
	player.landingNoiseMultiplier = profile.landingNoiseMultiplier;
	const physics = new PhysicsSystem();
	let minimumY = player.y;
	let landingFrame: number | null = null;
	for (let frame = 0; frame < 180; frame += 1) {
		const action = emptyAction();
		action.jumpPressed = frame === 0;
		action.jump = frame <= 27;
		action.moveRight = frame >= 4 && frame < 42;
		physics.step(player, [FLOOR], action, 1 / 60);
		minimumY = Math.min(minimumY, player.y);
		if (landingFrame === null && frame > 0 && player.justLanded) landingFrame = frame;
	}
	return { minimumY, landingFrame, x: player.x, profile };
}

describe('orbital traversal profiles', () => {
	it('keeps all profiles inside readability bounds', () => {
		expect(validateTraversalEnvironmentProfiles()).toEqual([]);
	});

	it('preserves the exact city baseline', () => {
		expect(getTraversalEnvironmentProfile('lower-sprawl')).toEqual({
			id: 'city-standard',
			label: 'CITY GRAVITY // FAMILIAR WEIGHT',
			gravityMultiplier: 1,
			airControlMultiplier: 1,
			maxFallSpeedDelta: 0,
			landingNoiseMultiplier: 1,
		});
		expect(getTraversalEnvironmentProfile(undefined)).toEqual(
			getTraversalEnvironmentProfile('lower-sprawl')
		);
	});

	it('makes orbital traversal visibly lighter without changing the base movement contract', () => {
		const city = jumpTrace('lower-sprawl');
		const colony = jumpTrace('dub-colony');
		const redoubt = jumpTrace('asteroid-redoubt');

		expect(colony.minimumY).toBeLessThan(city.minimumY);
		expect(redoubt.minimumY).toBeLessThan(colony.minimumY);
		expect(colony.landingFrame).toBeGreaterThan(city.landingFrame ?? 0);
		expect(redoubt.landingFrame).toBeGreaterThan(colony.landingFrame ?? 0);
		expect(redoubt.x).toBeGreaterThan(city.x);
	});
});

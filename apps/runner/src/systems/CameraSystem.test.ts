import { describe, expect, it } from 'vitest';
import { CameraSystem } from './CameraSystem';

describe('CameraSystem scene integration', () => {
	it('exposes getState as the scene-facing camera snapshot alias', () => {
		const camera = new CameraSystem();
		camera.step(600, 0, 1600, 1);

		expect(camera.getState()).toEqual(camera.getCamera());
		expect(camera.getState().x).toBeGreaterThan(0);
	});

	it('looks farther into the player travel direction', () => {
		const neutral = new CameraSystem();
		const moving = new CameraSystem();
		neutral.step(600, 0, 1600, 1, 0);
		moving.step(600, 0, 1600, 1, 285);

		expect(moving.getState().x).toBeGreaterThan(neutral.getState().x);
	});

	it('recovers lookahead quickly when travel direction reverses', () => {
		const camera = new CameraSystem();
		camera.step(600, 0, 1600, 0.1, 300);
		const forward = camera.getState().x;
		camera.step(600, 0, 1600, 0.1, -300);

		expect(camera.getState().x).toBeLessThan(forward);
	});
});

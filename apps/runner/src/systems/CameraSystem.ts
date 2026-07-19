/**
 * Camera system: smooth follow with velocity lookahead and quick direction recovery.
 */

import { createCameraRig, type CameraRig } from '../../../../vendor/arcade-runtime.mjs';

export interface Camera {
	x: number;
	y: number;
}

export class CameraSystem {
	private readonly camera: CameraRig = createCameraRig({ x: 0, y: 0 });

	step(playerX: number, worldMinX: number, worldMaxX: number, dt: number, playerVx = 0): void {
		this.camera.target(playerX - 260, 0);
		this.camera.step(dt, {
			velocityX: playerVx,
			lookaheadScaleX: 0.24,
			lookaheadMinX: -86,
			lookaheadMaxX: 96,
			lookaheadRateSameX: 5.5,
			lookaheadRateOppositeX: 10,
			followRateX: 4.6,
			followRateFarX: 7.5,
			farThreshold: 240,
			minX: worldMinX,
			maxX: worldMaxX,
		});
	}

	getCamera(): Camera {
		const state = this.camera.snapshot();
		return { x: state.x, y: state.y };
	}

	getState(): Camera {
		return this.getCamera();
	}
}

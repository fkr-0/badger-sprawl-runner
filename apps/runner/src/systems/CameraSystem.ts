/**
 * Camera system: smooth follow with velocity lookahead and quick direction recovery.
 */

import { createCameraRig, type CameraRig } from '../../../../vendor/arcade-runtime.mjs';
import { STORY_CAMERA_PROFILE, type CameraProfile } from '../game/GameplayTuning';

export interface Camera {
	x: number;
	y: number;
	zoom: number;
	groundAnchorY: number;
	visibleWorldWidth: number;
}

export class CameraSystem {
	private readonly camera: CameraRig = createCameraRig({ x: 0, y: 0 });

	constructor(private readonly profile: CameraProfile = STORY_CAMERA_PROFILE) {}

	step(playerX: number, worldMinX: number, worldMaxX: number, dt: number, playerVx = 0): void {
		const anchorWorldX = this.getVisibleWorldWidth() * this.profile.playerScreenAnchorX;
		this.camera.target(playerX - anchorWorldX, 0);
		this.camera.step(dt, {
			velocityX: playerVx,
			lookaheadScaleX: this.profile.lookaheadScaleX,
			lookaheadMinX: this.profile.lookaheadMinX,
			lookaheadMaxX: this.profile.lookaheadMaxX,
			lookaheadRateSameX: 5.5,
			lookaheadRateOppositeX: 10,
			followRateX: this.profile.followRateX,
			followRateFarX: this.profile.followRateFarX,
			farThreshold: this.profile.farThreshold,
			minX: worldMinX,
			maxX: worldMaxX,
		});
	}

	getCamera(): Camera {
		const state = this.camera.snapshot();
		return {
			x: state.x,
			y: state.y,
			zoom: this.profile.zoom,
			groundAnchorY: this.profile.groundAnchorY,
			visibleWorldWidth: this.getVisibleWorldWidth(),
		};
	}

	getState(): Camera {
		return this.getCamera();
	}

	getVisibleWorldWidth(): number {
		return this.profile.logicalViewportWidth / this.profile.zoom;
	}
}

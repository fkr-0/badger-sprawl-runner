/**
 * Camera system: smooth follow with velocity lookahead and quick direction recovery.
 */

export interface Camera {
	x: number;
	y: number;
}

export class CameraSystem {
	private camera: Camera = { x: 0, y: 0 };
	private lookahead = 0;

	step(playerX: number, worldMinX: number, worldMaxX: number, dt: number, playerVx = 0): void {
		const desiredLookahead = Math.max(-86, Math.min(96, playerVx * 0.24));
		const lookaheadRate = Math.sign(desiredLookahead) === Math.sign(this.lookahead) ? 5.5 : 10;
		this.lookahead += (desiredLookahead - this.lookahead) * Math.min(1, dt * lookaheadRate);
		const targetX = playerX - 260 + this.lookahead;
		const diff = targetX - this.camera.x;
		const followRate = Math.abs(diff) > 240 ? 7.5 : 4.6;
		this.camera.x += diff * Math.min(1, dt * followRate);
		this.camera.x = Math.max(worldMinX, Math.min(worldMaxX, this.camera.x));
	}

	getCamera(): Camera {
		return { ...this.camera };
	}

	getState(): Camera {
		return this.getCamera();
	}
}

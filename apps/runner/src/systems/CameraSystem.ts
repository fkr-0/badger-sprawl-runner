/**
 * Camera system: smooth follow with lookahead
 */

export interface Camera {
	x: number;
	y: number;
}

export class CameraSystem {
	private camera: Camera = { x: 0, y: 0 };

	step(playerX: number, worldMinX: number, worldMaxX: number, dt: number): void {
		const targetX = playerX - 260;
		const diff = targetX - this.camera.x;
		this.camera.x += diff * Math.min(1, dt * 4);
		this.camera.x = Math.max(worldMinX, Math.min(worldMaxX, this.camera.x));
	}

	getCamera(): Camera {
		return { ...this.camera };
	}

	getState(): Camera {
		return this.getCamera();
	}
}

import { resolveOneWayPlatforms } from '@arcade/runtime/core';

export interface PlatformStepInput {
	x: number;
	y: number;
	w: number;
	h: number;
	vx: number;
	vy: number;
	prevVy: number;
	dt: number;
	platforms: Array<{ x: number; y: number; w: number; h: number }>;
	coyoteTime: number;
}

export interface PlatformStepOutput {
	x: number;
	y: number;
	onGround: boolean;
	coyoteLeft: number;
}

/** Resolve one-way platform landing through the shared arcade collision primitive. */
export function platformStep(input: PlatformStepInput): PlatformStepOutput {
	const { x, y, w, h, vy, prevVy, dt, platforms, coyoteTime } = input;
	const previous = { x, y: y - prevVy * dt, w, h };
	const landing = resolveOneWayPlatforms({
		body: { x, y, w, h, vy },
		previous,
		velocityY: vy,
		tolerance: 6,
		platforms,
	});
	if (!landing) return { x, y, onGround: false, coyoteLeft: 0 };
	return {
		x,
		y: landing.y,
		onGround: true,
		coyoteLeft: coyoteTime,
	};
}

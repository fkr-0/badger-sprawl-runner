export interface PhysicsParams {
	gravity: number;
	jumpVelocity: number;
	maxFallSpeed: number;
	runAccelGround: number;
	runAccelAir: number;
	friction: number;
	maxRunSpeed: number;
	fastFallMultiplier: number;
	coyote: number;
	jumpBuffer: number;
	variableJumpCut: number;
}

export const defaultParams: PhysicsParams = {
	gravity: 1900,
	jumpVelocity: -650,
	maxFallSpeed: 1100,
	runAccelGround: 5200,
	runAccelAir: 2900,
	friction: 4200,
	maxRunSpeed: 285,
	fastFallMultiplier: 1.55,
	coyote: 0.095,
	jumpBuffer: 0.11,
	variableJumpCut: 0.48,
};

// Re-export commonly used types for convenience
export type { Velocity, MovementState } from './types';

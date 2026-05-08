import type { MovementState, PhysicsParams } from '../PhysicsParams';

export interface CoyoteStepInput {
	onGround: boolean;
	coyoteLeft: number;
	jumpBuffered: number;
	params: Pick<PhysicsParams, 'coyote' | 'jumpBuffer'>;
	dt: number;
}

export interface CoyoteStepOutput {
	coyoteLeft: number;
	jumpBuffered: number;
}

/**
 * Pure function: update timers for coyote and jump buffer
 */
export function coyoteStep(input: CoyoteStepInput): CoyoteStepOutput {
	let { onGround, coyoteLeft, jumpBuffered, params, dt } = input;

	// Decrease coyote timer
	coyoteLeft = Math.max(0, coyoteLeft - dt);
	if (onGround) {
		coyoteLeft = params.coyote;
	}

	// Decrease jump buffer
	jumpBuffered = Math.max(0, jumpBuffered - dt);

	return { coyoteLeft, jumpBuffered };
}

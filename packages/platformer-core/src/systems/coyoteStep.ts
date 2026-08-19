import type { MovementState, PhysicsParams } from '../PhysicsParams';
import {
	createActionGraceState,
	stepActionGrace,
} from '@arcade/runtime/gameplay';

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
	const stepped = stepActionGrace(
		createActionGraceState({
			graceDuration: input.params.coyote,
			bufferDuration: input.params.jumpBuffer,
			graceRemaining: input.coyoteLeft,
			bufferRemaining: input.jumpBuffered,
		}),
		{
			delta: input.dt,
			available: input.onGround,
			enabled: false,
		}
	);
	return {
		coyoteLeft: stepped.state.graceRemaining,
		jumpBuffered: stepped.state.bufferRemaining,
	};
}

export interface FixedStepConfig {
	stepSeconds: number;
	maxSubSteps: number;
	maxAccumulatedSeconds?: number;
}

export interface FixedStepState<T> {
	value: T;
	accumulatorSeconds: number;
	steps: number;
	droppedSeconds: number;
}

export interface FixedStepResult<T> extends FixedStepState<T> {
	alpha: number;
}

function assertConfig(config: FixedStepConfig): void {
	if (!Number.isFinite(config.stepSeconds) || config.stepSeconds <= 0) {
		throw new Error(`Invalid fixed step size: ${config.stepSeconds}`);
	}
	if (!Number.isInteger(config.maxSubSteps) || config.maxSubSteps <= 0) {
		throw new Error(`Invalid maxSubSteps: ${config.maxSubSteps}`);
	}
	if (config.maxAccumulatedSeconds !== undefined && config.maxAccumulatedSeconds <= 0) {
		throw new Error(`Invalid maxAccumulatedSeconds: ${config.maxAccumulatedSeconds}`);
	}
}

export function createFixedStepState<T>(value: T): FixedStepState<T> {
	return {
		value,
		accumulatorSeconds: 0,
		steps: 0,
		droppedSeconds: 0,
	};
}

export function advanceFixedStep<T>(
	state: FixedStepState<T>,
	deltaSeconds: number,
	config: FixedStepConfig,
	step: (value: T, dt: number, stepIndex: number) => T
): FixedStepResult<T> {
	assertConfig(config);
	if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
		throw new Error(`Invalid frame delta: ${deltaSeconds}`);
	}

	const maxAccumulatedSeconds = config.maxAccumulatedSeconds ?? config.stepSeconds * config.maxSubSteps;
	let accumulatorSeconds = state.accumulatorSeconds + deltaSeconds;
	let droppedSeconds = state.droppedSeconds;

	if (accumulatorSeconds > maxAccumulatedSeconds) {
		droppedSeconds += accumulatorSeconds - maxAccumulatedSeconds;
		accumulatorSeconds = maxAccumulatedSeconds;
	}

	let value = state.value;
	let stepsThisFrame = 0;
	while (accumulatorSeconds + Number.EPSILON >= config.stepSeconds && stepsThisFrame < config.maxSubSteps) {
		value = step(value, config.stepSeconds, state.steps + stepsThisFrame);
		accumulatorSeconds -= config.stepSeconds;
		stepsThisFrame += 1;
	}

	return {
		value,
		accumulatorSeconds,
		steps: state.steps + stepsThisFrame,
		droppedSeconds,
		alpha: accumulatorSeconds / config.stepSeconds,
	};
}

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
export declare function createFixedStepState<T>(value: T): FixedStepState<T>;
export declare function advanceFixedStep<T>(state: FixedStepState<T>, deltaSeconds: number, config: FixedStepConfig, step: (value: T, dt: number, stepIndex: number) => T): FixedStepResult<T>;
//# sourceMappingURL=fixedStep.d.ts.map
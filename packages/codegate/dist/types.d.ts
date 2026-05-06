/**
 * @badger/codegate - Core minigame types from MINIGAMES.md
 */
export type GateKind = 'fasttype' | 'commandrepair' | 'regex' | 'routing' | 'bytecode' | 'microcode';
export interface MiniGameSpec {
    id: string;
    kind: GateKind;
    prompt: string;
    timeLimitMs: number;
    attempts: number;
    rewardTags: string[];
    failureHeat: number;
}
export type SuccessOutcome = 'clean' | 'normal';
export type FailOutcome = 'fail' | 'timeout';
export interface MiniGameResult {
    outcome: SuccessOutcome | FailOutcome;
    heatDelta: number;
    rewardTags: string[];
    timeMs: number;
}
export interface MiniGameEvent {
    kind: 'timeout' | 'attempt_failed' | 'completed';
    result?: MiniGameResult;
}
export interface GateState {
    kind: GateKind;
    phase: 'active' | 'succeeded' | 'failed';
    prompt: string;
    inputSoFar: string;
    timeRemaining: number;
    attemptsLeft: number;
}
export interface CodeGateInstance {
    update(dt: number): MiniGameEvent | null;
    submitInput(text: string): MiniGameResult | null;
    currentState(): GateState;
}
//# sourceMappingURL=types.d.ts.map
/**
 * Create a code gate state machine
 * Minimal implementation for phase 3 stub
 */
export function createCodeGate(spec) {
    let phase = 'active';
    let timeRemaining = spec.timeLimitMs / 1000;
    const inputSoFar = '';
    const attemptsLeft = spec.attempts;
    return {
        update(dt) {
            timeRemaining -= dt;
            if (timeRemaining <= 0 && phase === 'active') {
                phase = 'failed';
                return {
                    kind: 'timeout',
                    result: {
                        outcome: 'timeout',
                        heatDelta: spec.failureHeat,
                        rewardTags: [],
                        timeMs: spec.timeLimitMs,
                    },
                };
            }
            return null;
        },
        submitInput(text) {
            // Stub: always succeed on submit for now
            phase = 'succeeded';
            const isPerfect = timeRemaining < (spec.timeLimitMs / 1000) * 0.15;
            return {
                outcome: isPerfect ? 'clean' : 'normal',
                heatDelta: isPerfect ? -1 : 0,
                rewardTags: spec.rewardTags,
                timeMs: (spec.timeLimitMs * (1 - timeRemaining / (spec.timeLimitMs / 1000))) | 0,
            };
        },
        currentState() {
            return {
                kind: spec.kind,
                phase,
                prompt: spec.prompt,
                inputSoFar,
                timeRemaining,
                attemptsLeft,
            };
        },
    };
}
//# sourceMappingURL=core.js.map
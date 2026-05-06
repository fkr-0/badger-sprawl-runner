export function createCommandRepairGate(spec, config) {
    return {
        validate(input) {
            if (input === config.expectedFix) {
                return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
            }
            return null;
        },
    };
}
//# sourceMappingURL=CommandRepairGate.js.map
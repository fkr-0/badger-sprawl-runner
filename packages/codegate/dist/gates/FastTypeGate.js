export function createFastTypeGate(spec, config) {
    return {
        validate(input) {
            if (input === config.target) {
                return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
            }
            return null;
        },
    };
}
//# sourceMappingURL=FastTypeGate.js.map
export function createMicroCodeGate(spec, config) {
    return {
        validate(input) {
            try {
                const result = eval(input);
                if (result === config.output) {
                    return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
                }
            }
            catch {
                return null;
            }
            return null;
        },
    };
}
//# sourceMappingURL=MicroCodeGate.js.map
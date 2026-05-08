export function createRegexMatchGate(spec, config) {
    return {
        validate(input) {
            const selected = config.patterns.find((p) => p.pattern === input);
            if (selected?.correct) {
                return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
            }
            return null;
        },
    };
}
//# sourceMappingURL=RegexMatchGate.js.map
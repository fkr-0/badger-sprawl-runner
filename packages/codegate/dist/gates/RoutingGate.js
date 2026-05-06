export function createRoutingGate(spec, config) {
    return {
        validate(input) {
            // Check if input is a valid path from start to end
            const path = input.split('->');
            if (path[0] === config.start && path[path.length - 1] === config.end) {
                return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
            }
            return null;
        },
    };
}
//# sourceMappingURL=RoutingGate.js.map
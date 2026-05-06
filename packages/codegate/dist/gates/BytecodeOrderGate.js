export function createBytecodeOrderGate(spec, config) {
    return {
        validate(input) {
            const order = input.split(',').map(s => s.trim());
            const sorted = config.opcodes.map(o => o.name);
            if (order.join(',') === sorted.join(',')) {
                return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
            }
            return null;
        },
    };
}
//# sourceMappingURL=BytecodeOrderGate.js.map
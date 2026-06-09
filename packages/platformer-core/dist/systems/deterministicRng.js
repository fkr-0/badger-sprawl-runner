const UINT32_MAX_PLUS_ONE = 0x100000000;
export function createDeterministicRng(seed) {
    return {
        seed: typeof seed === 'number' ? seed >>> 0 : hashSeed(seed),
        calls: 0,
    };
}
export function hashSeed(seed) {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index += 1) {
        hash ^= seed.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
export function nextRng(state) {
    let value = state.seed >>> 0;
    value += 0x6d2b79f5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const seed = value >>> 0;
    const random = ((value ^ (value >>> 14)) >>> 0) / UINT32_MAX_PLUS_ONE;
    return {
        state: { seed, calls: state.calls + 1 },
        value: random,
    };
}
export function rngRange(state, min, max) {
    const next = nextRng(state);
    return {
        state: next.state,
        value: min + (max - min) * next.value,
    };
}
export function rngInt(state, minInclusive, maxInclusive) {
    const next = nextRng(state);
    const min = Math.ceil(minInclusive);
    const max = Math.floor(maxInclusive);
    return {
        state: next.state,
        value: Math.floor(next.value * (max - min + 1)) + min,
    };
}
export function rngPick(state, values) {
    if (values.length === 0)
        throw new Error('Cannot pick from an empty deterministic list');
    const picked = rngInt(state, 0, values.length - 1);
    return {
        state: picked.state,
        value: values[picked.value],
    };
}
//# sourceMappingURL=deterministicRng.js.map
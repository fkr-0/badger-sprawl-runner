const DEFAULT_PRECISION = 6;
function normalizeNumber(value, precision) {
    if (!Number.isFinite(value))
        return 0;
    const scale = 10 ** precision;
    const rounded = Math.round(value * scale) / scale;
    return Object.is(rounded, -0) ? 0 : rounded;
}
export function stableSnapshot(value, options = {}) {
    const precision = options.precision ?? DEFAULT_PRECISION;
    const ignore = new Set(options.ignoreKeys ?? []);
    if (value === null)
        return null;
    if (typeof value === 'number')
        return normalizeNumber(value, precision);
    if (typeof value === 'boolean' || typeof value === 'string')
        return value;
    if (Array.isArray(value))
        return value.map((entry) => stableSnapshot(entry, options));
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
        if (ignore.has(key))
            continue;
        const entry = value[key];
        if (entry === undefined)
            continue;
        sorted[key] = stableSnapshot(entry, options);
    }
    return sorted;
}
export function stableSnapshotString(value, options = {}) {
    return JSON.stringify(stableSnapshot(value, options));
}
export function fnv1a32(input) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}
export function deterministicHash(value, options = {}) {
    return fnv1a32(stableSnapshotString(value, options));
}
//# sourceMappingURL=deterministicSnapshot.js.map
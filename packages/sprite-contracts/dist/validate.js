/**
 * Validate sprite manifest structure
 * Checks version string, sheets array, and each sheet's properties
 */
export function validateSpriteManifest(manifest) {
    if (typeof manifest !== 'object' || !manifest)
        return false;
    const m = manifest;
    if (typeof m.version !== 'string')
        return false;
    if (!Array.isArray(m.sheets))
        return false;
    for (const sheet of m.sheets) {
        if (typeof sheet !== 'object' || !sheet)
            return false;
        const s = sheet;
        if (typeof s.id !== 'string')
            return false;
        if (typeof s.file !== 'string')
            return false;
        if (!Array.isArray(s.frameSize) || s.frameSize.length !== 2)
            return false;
        if (typeof s.frameSize[0] !== 'number' || typeof s.frameSize[1] !== 'number')
            return false;
        if (s.frameSize[0] <= 0 || s.frameSize[1] <= 0)
            return false;
        if (typeof s.animations !== 'object' || !s.animations)
            return false;
        const anims = s.animations;
        for (const anim of Object.values(anims)) {
            if (typeof anim !== 'object' || !anim)
                return false;
            const a = anim;
            if (typeof a.frames !== 'number' || a.frames <= 0)
                return false;
            if (typeof a.fps !== 'number' || a.fps <= 0)
                return false;
        }
    }
    return true;
}
//# sourceMappingURL=validate.js.map
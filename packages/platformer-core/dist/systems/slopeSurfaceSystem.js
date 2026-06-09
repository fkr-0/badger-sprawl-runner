function materialFor(id, materials) {
    return materials?.find((material) => material.id === id) ?? { id, traction: 1, slideMultiplier: 1 };
}
function sampleSlopeY(slope, x) {
    const minX = Math.min(slope.x1, slope.x2);
    const maxX = Math.max(slope.x1, slope.x2);
    if (x < minX - 1e-9 || x > maxX + 1e-9)
        return null;
    const dx = slope.x2 - slope.x1;
    if (dx === 0)
        return Math.min(slope.y1, slope.y2);
    const t = (x - slope.x1) / dx;
    return slope.y1 + (slope.y2 - slope.y1) * t;
}
function normalFor(slope) {
    const dx = slope.x2 - slope.x1;
    const dy = slope.y2 - slope.y1;
    const length = Math.hypot(dx, dy);
    if (length === 0)
        return { x: 0, y: -1 };
    let x = dy / length;
    let y = -dx / length;
    if (y > 0) {
        x = -x;
        y = -y;
    }
    return { x: Number(x.toFixed(6)), y: Number(y.toFixed(6)) };
}
export function resolveSlopeSurface(input) {
    const candidates = input.slopes
        .map((slope) => ({ slope, y: sampleSlopeY(slope, input.x) }))
        .filter((entry) => entry.y !== null)
        .sort((a, b) => a.y - b.y || a.slope.id.localeCompare(b.slope.id));
    const selected = candidates[0];
    if (!selected)
        return null;
    const normal = normalFor(selected.slope);
    const material = materialFor(selected.slope.materialId, input.materials);
    const gravity = input.gravity ?? 1;
    const slideMultiplier = material.slideMultiplier ?? 1;
    const slideForce = Number((gravity * Math.abs(normal.x) * slideMultiplier * (1 - Math.min(1, material.traction))).toFixed(6));
    return {
        slopeId: selected.slope.id,
        materialId: selected.slope.materialId,
        y: Number(selected.y.toFixed(6)),
        normalX: normal.x,
        normalY: normal.y,
        slideForce,
        tractionModifier: material.traction,
    };
}
export function walkSlopeSurface(input) {
    if (!Number.isFinite(input.dt) || input.dt < 0)
        throw new Error(`Invalid slope dt: ${input.dt}`);
    const centerX = input.body.x + input.body.w / 2;
    const sample = resolveSlopeSurface({ x: centerX, slopes: input.slopes, materials: input.materials, gravity: input.gravity });
    if (!sample)
        return { body: { ...input.body }, sample: null };
    const moveX = input.moveX ?? 0;
    const walkSpeed = input.walkSpeed ?? 0;
    const vx = input.body.vx + moveX * walkSpeed * sample.tractionModifier;
    const slideDirection = sample.normalX === 0 ? 0 : sample.normalX > 0 ? -1 : 1;
    const nextVx = vx + slideDirection * sample.slideForce * input.dt;
    const nextX = input.body.x + nextVx * input.dt;
    const nextCenterX = nextX + input.body.w / 2;
    const nextSample = resolveSlopeSurface({ x: nextCenterX, slopes: input.slopes, materials: input.materials, gravity: input.gravity }) ?? sample;
    return {
        body: { ...input.body, x: Number(nextX.toFixed(6)), y: Number((nextSample.y - input.body.h).toFixed(6)), vx: Number(nextVx.toFixed(6)), vy: 0, onGround: true },
        sample: nextSample,
    };
}
//# sourceMappingURL=slopeSurfaceSystem.js.map